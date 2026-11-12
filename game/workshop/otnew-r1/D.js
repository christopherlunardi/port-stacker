// D: Weather. Full colour stays; each overtime the harbour gets different weather: a red sky, then fog, then snow.
// ---- shared by every option in this round: a printer that can reprint the play area in other inks / paper ----
// A look (an entry of OT_LOOKS) may carry, besides the game's own pal/steps/flat/grid/fade:
//   mode: 0 the game's handheld ramp (default) | 1 reprint: paper x inks (multiply, the riso way) | 2 night print: light inks on dark paper
//   paper, ip, ib, iy: '#rrggbb' paper and the ink each plate (pink, blue, yellow) is printed in
//   g0, g1: '#rrggbb' a tint down the play area (top, bottom), multiplied in; dots: 0..1 how much halftone (1 = as the game)
//   scan, vig: 0..1 scanlines / darker corners; wash: [[p,b,y], alpha] the backdrop washed toward an ink colour before the stage is drawn
//   back(look), front(look): extra drawing behind the stage / over the play area (field coordinates), e.g. fog, snow
const XFS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D tex; uniform vec2 size; uniform float sc; uniform float strength;
uniform float mono; uniform vec3 m0; uniform vec3 m1; uniform vec3 m2; uniform vec3 m3; uniform float msteps; uniform float mgrid; uniform float mflat; uniform vec4 frect;
uniform float xmode; uniform vec3 xpaper; uniform vec3 xip; uniform vec3 xib; uniform vec3 xiy; uniform vec3 xg0; uniform vec3 xg1; uniform float xdots; uniform float xscan; uniform float xvig;
varying vec2 v;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float spot(vec2 p, float a, float per) { float c = cos(a), s = sin(a); vec2 q = vec2(p.x * c + p.y * s, -p.x * s + p.y * c) / per; return (cos(6.2831853 * q.x) + cos(6.2831853 * q.y)) * 0.25 + 0.5; }
vec4 at(vec2 px, vec2 off) { vec2 uv = (px - off) / size; if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0); return texture2D(tex, uv); }
void main() {
  vec2 px = floor(v * size) + 0.5;
#ifndef GL_FRAGMENT_PRECISION_HIGH
  vec2 pm = mod(px, 256.0);
#else
  vec2 pm = px;
#endif
  float per = sc * 1.3;
  vec3 paper = vec3(0.969, 0.925, 0.871);
  float gr = hash(floor(pm / max(1.0, sc * 0.5))) < 0.04 ? 1.0 : 0.0;
  vec3 grain = gr * vec3(0.055, 0.063, 0.07);
  float tp = at(px, vec2(0.28, 0.12) * sc * strength).r, tb = at(px, vec2(0.0)).g, ty = at(px, vec2(-0.16, 0.22) * sc * strength).b;
  float dy = (ty * 1.04 - 0.02 > spot(pm, 0.79, per) + (hash(pm + 1.3) - 0.5) * 0.12 && hash(pm + 9.1) > 0.015) ? 1.0 : 0.0;
  float dp = (tp * 1.04 - 0.02 > spot(pm, 0.26, per) + (hash(pm + 7.1) - 0.5) * 0.12 && hash(pm + 5.3) > 0.015) ? 1.0 : 0.0;
  float db = (tb * 1.04 - 0.02 > spot(pm, 1.31, per) + (hash(pm + 3.7) - 0.5) * 0.12 && hash(pm + 2.9) > 0.015) ? 1.0 : 0.0;
  vec3 IY = vec3(1.0, 0.886, 0.0), IP = vec3(1.0, 0.282, 0.69), IB = vec3(0.149, 0.337, 0.769), W = vec3(1.0);
  vec3 flatc = paper * mix(W, IY, ty) * mix(W, IP, tp) * mix(W, IB, tb);
  vec3 col = (paper - grain) * mix(W, IY, dy) * mix(W, IP, dp) * mix(W, IB, db);
  vec3 outc = mix(flatc, col, strength);
  if (mono > 0.5) {
    vec2 uv = px / size;
    if (uv.x > frect.x && uv.y > frect.y && uv.x < frect.z && uv.y < frect.w && texture2D(tex, uv).a < 0.999) {
      vec2 f = (uv - frect.xy) / (frect.zw - frect.xy);
      float st = strength * xdots;
      vec3 g;
      if (xmode > 1.5) { // night print: light inks on dark paper
        vec3 fl = W - (W - xpaper) * (W - xiy * ty) * (W - xip * tp) * (W - xib * tb);
        vec3 ht = W - (W - xpaper - grain * 0.6) * (W - xiy * dy) * (W - xip * dp) * (W - xib * db);
        g = mix(fl, ht, st);
      } else if (xmode > 0.5) { // reprint: the same plates, other inks and paper
        vec3 fl = xpaper * mix(W, xiy, ty) * mix(W, xip, tp) * mix(W, xib, tb);
        vec3 ht = (xpaper - grain) * mix(W, xiy, dy) * mix(W, xip, dp) * mix(W, xib, db);
        g = mix(fl, ht, st);
      } else { // the game's handheld ramp
        vec3 src = mflat > 0.5 ? flatc : outc;
        float l = clamp((dot(src, vec3(0.3, 0.59, 0.11)) - 0.1) / 0.8, 0.0, 1.0);
        if (msteps > 0.5) g = l < 0.3 ? m0 : l < 0.55 ? m1 : l < 0.8 ? m2 : m3;
        else g = l < 0.3333 ? mix(m0, m1, l * 3.0) : l < 0.6667 ? mix(m1, m2, l * 3.0 - 1.0) : mix(m2, m3, l * 3.0 - 2.0);
        if (mgrid > 0.5) { vec2 gp = fract((px - frect.xy * size) / sc); if (gp.x < 0.16 || gp.y < 0.16) g *= 0.88; }
      }
      g *= mix(xg0, xg1, f.y);
      if (xscan > 0.0) { float ph = fract((px.y - frect.y * size.y) / max(3.0, sc * 2.0)); g *= 1.0 - xscan * smoothstep(0.5, 0.75, ph) * (1.0 - smoothstep(0.9, 1.0, ph) * 0.5); }
      if (xvig > 0.0) { vec2 d = (f - 0.5) * vec2(1.0, 0.85); g *= 1.0 - xvig * smoothstep(0.32, 0.72, length(d)); }
      outc = g;
    }
  }
  gl_FragColor = vec4(outc, 1.0);
}`;
(0, eval)('initPrint = ' + initPrint.toString().replace('PRINT_FS', 'XFS'));
(function () {
  const hex = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16) / 255);
  const XU = {};
  let xprog = null;
  const DEF = { mode: 0, paper: '#f7ecde', ip: '#ff48b0', ib: '#2656c4', iy: '#ffe200', g0: '#ffffff', g1: '#ffffff', dots: 1, scan: 0, vig: 0 };
  const pr = present;
  present = function () {
    if (gl && glProg) {
      if (xprog !== glProg) {
        xprog = glProg;
        for (const n of ['xmode', 'xpaper', 'xip', 'xib', 'xiy', 'xg0', 'xg1', 'xdots', 'xscan', 'xvig']) XU[n] = gl.getUniformLocation(glProg, n);
      }
      const k = Object.assign({}, DEF, (monoShot && otLook()) || {});
      gl.uniform1f(XU.xmode, k.mode);
      for (const [u, n] of [['xpaper', 'paper'], ['xip', 'ip'], ['xib', 'ib'], ['xiy', 'iy'], ['xg0', 'g0'], ['xg1', 'g1']]) gl.uniform3f(XU[u], ...hex(k[n]));
      gl.uniform1f(XU.xdots, k.dots);
      gl.uniform1f(XU.xscan, k.scan);
      gl.uniform1f(XU.xvig, k.vig);
    }
    return pr.apply(this, arguments);
  };
  const dd = drawDoors;
  drawDoors = function (front) {
    const k = !front && otLook();
    if (k && (k.wash || k.back)) {
      pg.save();
      pg.beginPath();
      pg.rect(0, 0, PW, PH); // only the play area: the side panels on wide screens keep the normal backdrop
      pg.clip();
      if (k.wash) {
        pg.globalAlpha = k.wash[1];
        rect(0, 0, PW, PH, k.wash[0]);
        pg.globalAlpha = 1;
      }
      if (k.back) k.back(k);
      pg.restore();
    }
    return dd.apply(this, arguments);
  };
  const ms = monoSnap;
  monoSnap = function () {
    const k = otLook();
    if (k && k.front && !HEADLESS) {
      const { ox, oy, k: s } = LAY;
      pg.save();
      pg.setTransform(s, 0, 0, s, ox * s, oy * s);
      pg.beginPath();
      pg.rect(0, 0, PW, PH);
      pg.clip();
      k.front(k);
      pg.restore();
    }
    return ms.apply(this, arguments);
  };
})();
const XPAL = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]; // the game's printer wants a palette on every look; unused outside mode 0

// ---- this option ----
function xFogBack() {
  // slow banks of fog drifting behind the catwalks
  for (let i = 0; i < 5; i++) {
    const y = 40 + i * 52 + Math.sin(G.frame * 0.004 + i * 2.1) * 6,
      x = ((G.frame * (0.05 + i * 0.012) + i * 150) % (PW + 300)) - 300,
      g = pg.createLinearGradient(0, y - 22, 0, y + 22);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, 'rgba(0,0,0,0.55)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    pg.fillStyle = g;
    pg.fillRect(x, y - 22, 300, 44);
    pg.fillRect(x - PW - 300 + 0, y - 22, 300, 44);
  }
}
function xSnow(n, big, seed) {
  pg.fillStyle = ink(C.cream);
  for (let i = 0; i < n; i++) {
    const r = Math.sin((i + seed) * 127.1) * 43758.5453,
      u = r - Math.floor(r),
      r2 = Math.sin((i + seed) * 311.7) * 43758.5453,
      w = r2 - Math.floor(r2),
      sp = 0.22 + w * 0.3,
      y = ((u * PH * 3 + G.frame * sp) % (PH + 8)) - 4,
      x = (((w * PW * 7 + Math.sin(G.frame * 0.02 + i) * 5 + G.frame * 0.06) % PW) + PW) % PW,
      s = big ? 1.2 + w * 0.9 : 0.8 + w * 0.5;
    pg.beginPath();
    pg.arc(x, y, s, 0, 6.2832);
    pg.fill();
  }
}
OT_LOOKS = [
  { name: 'RED SKY', g0: '#ff9a84', g1: '#fff0c8', wash: [[120, 0, 200], 0.16] },
  { name: 'FOG', g0: '#e6ebee', g1: '#f6f6f2', wash: [[0, 26, 0], 0.62], back: xFogBack },
  { name: 'SNOW', g0: '#dfe9f4', g1: '#f6f9fc', wash: [[0, 80, 0], 0.5], back: () => xSnow(60, false, 9), front: () => xSnow(36, true, 3) }
].map(k => Object.assign({ pal: XPAL, fade: 0, mode: 1 }, k));
