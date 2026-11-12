// ---------- screen fitting, printing, and the main loop ----------
// The canvas is sized to the real pixels of its box. The 320x240 field is scaled to fit (any amount: the art is drawn, not pixels), and
// the leftover becomes extra width/height for the poster panels. The plate (10-render) is drawn at screen size, capped at 1440 tall.
// Printing: the plate goes to the graphics chip as a texture and a small shader prints it at screen resolution: a rotated halftone
// screen per ink, a little misregistration, ink dropouts and paper grain. With no WebGL it prints flat colours instead.
let scr = null,
  gl = null,
  glProg = null,
  glTex = null,
  glU = {},
  ctx2 = null,
  flat = null;
function fitLayout(W, H) {
  const s = Math.min(W / PW, H / PH),
    LW = W / s,
    LH = H / s;
  return { s, k: Math.min(s, 1440 / LH), LW, LH, ox: (LW - PW) / 2, oy: (LH - PH) / 2, W, H };
}
function resizeScreen() {
  if (!scr) return;
  const dpr = window.devicePixelRatio || 1;
  let r = scr.getBoundingClientRect();
  if (document.body.classList.contains('inapp')) {
    // in the Retroid app: pin the screen to the whole window, whatever the page layout thinks
    const iw = window.innerWidth,
      ih = window.innerHeight,
      css = 'position:fixed;left:0;top:0;width:' + iw + 'px;height:' + ih + 'px;display:block;image-rendering:auto';
    if (scr.style.cssText !== css && scr.dataset.css !== css) {
      scr.style.cssText = css;
      scr.dataset.css = css;
    } // only when it changed (changing it every time set off a resize loop)
    r = { width: iw, height: ih };
  }
  let W = Math.max(1, Math.round(r.width * dpr)),
    H = Math.max(1, Math.round(r.height * dpr));
  const cap = Math.min(1, Math.sqrt(4200000 / (W * H)));
  if (cap < 1) {
    W = Math.round(W * cap);
    H = Math.round(H * cap);
  } // keep the canvas a size handheld GPUs accept
  scr.width = W;
  scr.height = H;
  // some handheld GPUs quietly give WebGL a smaller drawing area than the canvas asked for (Chris's Retroid video, 2026-11-07: the game
  // sat in the top-left corner); use the size we actually got, so the picture fills and centres
  if (gl && (gl.drawingBufferWidth !== W || gl.drawingBufferHeight !== H)) {
    W = gl.drawingBufferWidth;
    H = gl.drawingBufferHeight;
    scr.width = W;
    scr.height = H;
    if (gl.drawingBufferWidth !== W) {
      W = gl.drawingBufferWidth;
      H = gl.drawingBufferHeight;
    }
  }
  LAY = fitLayout(DEV.view ? DEV.view[0] : W, DEV.view ? DEV.view[1] : H);
  bgKey = '';
}
const PRINT_VS =
  'attribute vec2 a; varying vec2 v; void main(){ v = vec2(a.x * 0.5 + 0.5, 0.5 - a.y * 0.5); gl_Position = vec4(a, 0.0, 1.0); }';
// (Chris 2026-11-10, picked 'Off the drum' from a Fable Workshop round of takes on the riso print) the same cream paper, inks, dot
// angles and misprint as before, with dots a bit bigger (per = sc * 1.7, was 1.3), clean round dots with slightly uneven edges, ink a
// touch thinner in places with the drum's faint streaks, each plate a hair skewed so the misprint changes across the sheet, and a
// little darkening where pink and blue overprint. The old per-pixel speckle in the dots is gone. Everything is fixed to the screen (the
// paper): characters move over it. The PRINT setting still blends from flat colour (OFF) to full; the quirks are fully on from MEDIUM.
const PRINT_FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D tex; uniform vec2 size; uniform float sc; uniform float strength;
uniform float mono; uniform vec3 m0; uniform vec3 m1; uniform vec3 m2; uniform vec3 m3; uniform float msteps; uniform float mgrid; uniform float mflat; uniform vec4 frect;
uniform float xmode; uniform vec3 xpaper; uniform vec3 xip; uniform vec3 xib; uniform vec3 xiy;
varying vec2 v;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float spot(vec2 p, float a, float per) { float c = cos(a), s = sin(a); vec2 q = vec2(p.x * c + p.y * s, -p.x * s + p.y * c) / per; return (cos(6.2831853 * q.x) + cos(6.2831853 * q.y)) * 0.25 + 0.5; }
vec4 at(vec2 px, vec2 off) { vec2 uv = (px - off) / size; if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0); return texture2D(tex, uv); }
// how much ink lands: t = ink asked for, thr = the screen's threshold here, w = edge softness. Always none at 0, full at 1.
float cover(float t, float thr, float w) { float m = w * 0.5 + 0.02; return clamp((t * (1.0 + 2.0 * m) - m - thr) / w + 0.5, 0.0, 1.0); }
void main() {
  vec2 px = floor(v * size) + 0.5;
#ifndef GL_FRAGMENT_PRECISION_HIGH
  vec2 pm = mod(px, 256.0);
#else
  vec2 pm = px;
#endif
  vec3 W = vec3(1.0), PAPER = vec3(0.969, 0.925, 0.871), IY = vec3(1.0, 0.886, 0.0), IP = vec3(1.0, 0.282, 0.69), IB = vec3(0.149, 0.337, 0.769);
  float st = strength, k = clamp(st * 2.5, 0.0, 1.0); // k: the press's quirks are fully on from MEDIUM up, and off with the print OFF
  vec2 pg = (v - 0.5) * size / sc; // where we are on the sheet, in game pixels from the middle
  vec2 offp = vec2(0.28, 0.12) * sc * st, offy = vec2(-0.16, 0.22) * sc * st, offb = vec2(0.0);
  offp += vec2(-pg.y, pg.x) * 0.0016 * sc * k; offy += vec2(pg.y, -pg.x) * 0.0012 * sc * k; offb = vec2(0.05, -0.04) * sc * st; // each plate sits a hair skewed, so the misprint changes across the sheet
  float tp = at(px, offp).r, tb = at(px, offb).g, ty = at(px, offy).b;
  float per = sc * 1.7, w = clamp(1.5 / per, 0.05, 0.8);
  vec3 pap = PAPER;
  if (hash(floor(pm / max(1.0, sc * 0.5))) < 0.04) pap -= vec3(0.055, 0.063, 0.07) * 1.0; // the game's paper grain
  float ey = 0.0, ep = 0.0, eb = 0.0; // uneven dot edges (added to the screen)
  float gy = 1.0, gp = 1.0, gb = 1.0; // how well each ink took here (1 = fully)
  float over = 0.08; // extra darkening where pink and blue overprint
  gp = 1.0 - 0.10 * vn(v * vec2(3.1, 2.3) + 4.7) - 0.035 * vn(vec2(v.x * 46.0, 1.5)); // ink a little thinner in places, and the drum's faint streaks
  gb = 1.0 - 0.09 * vn(v * vec2(2.6, 3.0) + 9.2) - 0.035 * vn(vec2(v.x * 38.0, 7.5));
  gy = 1.0 - 0.08 * vn(v * vec2(2.2, 2.7) + 1.9);
  ep = (vn(pm / (sc * 0.9) + 3.0) - 0.5) * 0.16; eb = (vn(pm / (sc * 0.9) + 17.0) - 0.5) * 0.16; ey = (vn(pm / (sc * 0.9) + 31.0) - 0.5) * 0.16; // dots not quite all the same
  float hy = ty, hp = tp, hb = tb; // what the screen is asked for

  float dy = cover(hy, spot(pm, 0.79, per) + ey, w) * gy, dp = cover(hp, spot(pm, 0.26, per) + ep, w) * gp, db = cover(hb, spot(pm, 1.31, per) + eb, w) * gb;
  float fy = ty * mix(1.0, gy, k), fp = tp * mix(1.0, gp, k), fb = tb * mix(1.0, gb, k);
  vec3 flatc = PAPER * mix(W, IY, fy) * mix(W, IP, fp) * mix(W, IB, fb) * (1.0 - over * k * fp * fb);
  vec3 col = pap * mix(W, IY, dy) * mix(W, IP, dp) * mix(W, IB, db) * (1.0 - over * dp * db);

  vec3 outc = mix(flatc, col, st);
  if (mono > 0.5) { // overtime: only the play area (marked on the plate by its alpha) is reprinted
    vec2 uv = px / size;
    if (uv.x > frect.x && uv.y > frect.y && uv.x < frect.z && uv.y < frect.w && texture2D(tex, uv).a < 0.999) {
      vec3 src = mflat > 0.5 ? flatc : outc;
      float l = clamp((dot(src, vec3(0.3, 0.59, 0.11)) - 0.1) / 0.8, 0.0, 1.0);
      vec3 g;
      if (xmode > 0.5) { // a two-ink reprint, on this take's screen and paper
        vec3 fl = xpaper * mix(W, xiy, fy) * mix(W, xip, fp) * mix(W, xib, fb);
        vec3 ht = (xpaper * (pap / PAPER)) * mix(W, xiy, dy) * mix(W, xip, dp) * mix(W, xib, db);
        g = mix(fl, ht, st);
      } else if (msteps > 0.5) g = l < 0.3 ? m0 : l < 0.55 ? m1 : l < 0.8 ? m2 : m3;
      else g = l < 0.3333 ? mix(m0, m1, l * 3.0) : l < 0.6667 ? mix(m1, m2, l * 3.0 - 1.0) : mix(m2, m3, l * 3.0 - 2.0);
      if (mgrid > 0.5) { vec2 gq = fract((px - frect.xy * size) / sc); if (gq.x < 0.16 || gq.y < 0.16) g *= 0.88; }
      outc = g;
    }
  }
  gl_FragColor = vec4(outc, 1.0);
}`;
// how strong the print texture is: the PRINT setting in the pause menu, remembered per device (Chris 2026-11-07: the dots were too much)
const PRINT_MODES = [
  ['MEDIUM', 0.4],
  ['STRONG', 1],
  ['LIGHT', 0.2],
  ['OFF', 0]
]; // MEDIUM eased from 0.5 (Chris 2026-11-07: a touch less harsh) // the same on every screen now that the dots scale with the game
let printMode = store.get('print2', 0);
function printStrength() {
  return (PRINT_MODES[printMode] || PRINT_MODES[0])[1];
}
function initPrint() {
  try {
    gl = scr.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false }) || null;
  } catch (e) {
    gl = null;
  }
  if (gl) {
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    try {
      glProg = gl.createProgram();
      gl.attachShader(glProg, sh(gl.VERTEX_SHADER, PRINT_VS));
      gl.attachShader(glProg, sh(gl.FRAGMENT_SHADER, PRINT_FS));
      gl.linkProgram(glProg);
      if (!gl.getProgramParameter(glProg, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(glProg));
      gl.useProgram(glProg);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const a = gl.getAttribLocation(glProg, 'a');
      gl.enableVertexAttribArray(a);
      gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
      glTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, glTex);
      for (const [k, v] of [
        [gl.TEXTURE_MIN_FILTER, gl.LINEAR],
        [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
        [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE],
        [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]
      ])
        gl.texParameteri(gl.TEXTURE_2D, k, v);
      for (const n of [
        'tex',
        'size',
        'sc',
        'strength',
        'mono',
        'm0',
        'm1',
        'm2',
        'm3',
        'msteps',
        'mgrid',
        'mflat',
        'frect',
        'xmode',
        'xpaper',
        'xip',
        'xib',
        'xiy'
      ])
        glU[n] = gl.getUniformLocation(glProg, n);
      gl.uniform1i(glU.tex, 0);
      try {
        const f = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
        window.__gpu = (f && f.precision > 0 ? 'HP ' : 'MP ') + (gl.getParameter(gl.RENDERER) || '');
      } catch (e) {}
      return;
    } catch (e) {
      console.warn('print shader failed, printing flat', e);
      gl = null;
    }
  }
  ctx2 = scr.getContext('2d');
  if (!ctx2) {
    const c = scr.cloneNode(false);
    scr.parentNode.replaceChild(c, scr);
    scr = c;
    ctx2 = scr.getContext('2d');
  } // a canvas that already tried WebGL can't do 2D: use a fresh one
  flat = document.createElement('canvas');
}
function present() {
  let w = Math.round(LAY.LW * LAY.s),
    h = Math.round(LAY.LH * LAY.s);
  if (DEV.view) {
    const k = Math.min(scr.width / LAY.W, scr.height / LAY.H);
    w = Math.round(w * k);
    h = Math.round(h * k);
  } // a previewed screen, shrunk to fit this one
  const dx = Math.floor((scr.width - w) / 2),
    dy = Math.floor((scr.height - h) / 2);
  if (gl) {
    const bw = gl.drawingBufferWidth,
      bh = gl.drawingBufferHeight;
    if (bw !== scr.width || bh !== scr.height) {
      resizeScreen();
      return;
    }
    gl.viewport(0, 0, bw, bh);
    gl.clearColor(0.09, 0.12, 0.23, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(dx, scr.height - dy - h, w, h);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, plate);
    const look = monoShot ? otLook() : null;
    gl.uniform1f(glU.mono, look ? 1 : 0);
    if (look) {
      look.pal.forEach((c, i) => gl.uniform3f(glU['m' + i], c[0] / 255, c[1] / 255, c[2] / 255));
      gl.uniform1f(glU.msteps, look.steps ? 1 : 0);
      gl.uniform1f(glU.mgrid, look.grid ? 1 : 0);
      gl.uniform1f(glU.mflat, look.flat ? 1 : 0);
      gl.uniform1f(glU.xmode, look.inks ? 1 : 0);
      if (look.inks)
        for (const [u, c] of [
          ['xpaper', look.inks.paper],
          ['xip', look.inks.ip],
          ['xib', look.inks.ib],
          ['xiy', look.inks.iy]
        ])
          gl.uniform3f(glU[u], c[0] / 255, c[1] / 255, c[2] / 255);
      const { LW, LH, ox, oy } = LAY;
      gl.uniform4f(glU.frect, ox / LW, oy / LH, (ox + PW) / LW, (oy + PH) / LH);
    }
    gl.uniform2f(glU.size, w, h);
    gl.uniform1f(glU.sc, w / LAY.LW);
    gl.uniform1f(glU.strength, printStrength());
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return;
  }
  // no WebGL: flat colours, each pixel paper multiplied by its inks
  if (flat.width !== plate.width || flat.height !== plate.height) {
    flat.width = plate.width;
    flat.height = plate.height;
  }
  const fc = flat.getContext('2d'),
    src = pg.getImageData(0, 0, plate.width, plate.height).data,
    img = fc.createImageData(plate.width, plate.height),
    d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const p = src[i] / 255,
      b = src[i + 1] / 255,
      y = src[i + 2] / 255;
    d[i] = 247 * (1 - b * 0.851);
    d[i + 1] = 236 * (1 - p * 0.718) * (1 - b * 0.663) * (1 - y * 0.114);
    d[i + 2] = 222 * (1 - p * 0.31) * (1 - b * 0.231) * (1 - y);
    d[i + 3] = 255;
  }
  fc.putImageData(img, 0, 0);
  ctx2.imageSmoothingEnabled = true;
  ctx2.fillStyle = '#17203b';
  ctx2.fillRect(0, 0, scr.width, scr.height);
  ctx2.drawImage(flat, dx, dy, w, h);
}
if (!HEADLESS)
  window.addEventListener('error', e => {
    if (/ResizeObserver loop/.test(e.message || '')) return;
    if ((document.body && document.body.classList.contains('inapp')) || location.protocol === 'file:') {
      let d = document.getElementById('errBox');
      if (!d) {
        d = document.createElement('pre');
        d.id = 'errBox';
        d.style.cssText =
          'position:fixed;left:0;right:0;bottom:0;z-index:99;margin:0;padding:6px;background:#2a1b7a;color:#ffe200;font:11px monospace;white-space:pre-wrap;max-height:40%;overflow:auto';
        document.body.appendChild(d);
      }
      d.textContent += (e.message || e) + ' @' + (e.lineno || '') + '\n';
    }
  }); // in the Retroid app, show errors on screen so a photo tells us what broke
function diag() {
  // a big readable box of screen facts, shown in the Retroid app for the first seconds on the title, so a photo tells us what's wrong
  let d = document.getElementById('diagBox');
  if (!d) {
    d = document.createElement('pre');
    d.id = 'diagBox';
    d.style.cssText =
      'position:fixed;left:8px;top:8px;z-index:98;margin:0;padding:8px 10px;background:#2a1b7a;color:#ffe200;font:bold 15px/1.35 monospace;border:2px solid #ffe200;border-radius:6px;pointer-events:none';
    document.body.appendChild(d);
  }
  const r = scr.getBoundingClientRect();
  let nat = '';
  try {
    nat = window.StackNative
      ? StackNative.device() + ' ' + Math.round(StackNative.refresh()) + 'Hz ' + StackNative.webview() + ' app' + StackNative.appVersion()
      : 'no app';
  } catch (e) {
    nat = 'app?';
  }
  d.textContent =
    'BUILD ' +
    BUILD +
    '  ' +
    nat +
    '\nwindow ' +
    innerWidth +
    'x' +
    innerHeight +
    ' dpr ' +
    (devicePixelRatio || 1).toFixed(2) +
    '  screen ' +
    screen.width +
    'x' +
    screen.height +
    '\ncanvas css ' +
    Math.round(r.width) +
    'x' +
    Math.round(r.height) +
    ' at ' +
    Math.round(r.left) +
    ',' +
    Math.round(r.top) +
    '  px ' +
    scr.width +
    'x' +
    scr.height +
    '\ngl ' +
    (gl ? gl.drawingBufferWidth + 'x' + gl.drawingBufferHeight + ' ' + (window.__gpu || '') : 'none (flat)') +
    '\nfit ' +
    Math.round(LAY.W) +
    'x' +
    Math.round(LAY.H) +
    ' scale ' +
    LAY.s.toFixed(2) +
    '  ' +
    document.body.className;
  d.hidden = true; // never over the game now (Chris 2026-11-07); the same facts are under INFO in the pause menu
}
function boot() {
  scr = document.getElementById('screen');
  initPrint();
  teleInit();
  loadArt();
  hookTouch();
  devHooks();
  G.hi = store.get('hi', 0);
  const tag = document.getElementById('buildTag');
  if (tag) tag.textContent = ''; // build number lives under INFO in the pause menu
  if (navigator.getGamepads)
    window.addEventListener('gamepadconnected', () => {
      document.body.classList.add('padmode');
      onLayoutChange();
    });
  window.addEventListener('resize', resizeScreen);
  if (window.ResizeObserver) {
    let q = 0;
    new ResizeObserver(() => {
      if (!q)
        q = requestAnimationFrame(() => {
          q = 0;
          resizeScreen();
        });
    }).observe(scr);
  } // next frame, so a resize can't set off another inside the same check
  resizeScreen();
  let last = performance.now(),
    acc = 0;
  const STEP = 1000 / 60;
  function frame(now) {
    acc += Math.min(now - last, 250);
    last = now;
    let n = 0;
    while (acc >= STEP && n < 5) {
      update(takeInput());
      inputDone();
      acc -= STEP;
      n++;
    }
    if (n >= 5) acc = 0;
    if (G.state !== 'studio') {
      // (the intro draws on its own canvas over the screen: the game's picture under it would only cost the phone time)
      render();
      present();
    }
    if ((G.frame & 15) === 0) diag();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && G.state === 'play' && !G.attract) pauseGame(); // (not a demo: that just carries on)
  });
}
if (!HEADLESS) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}
