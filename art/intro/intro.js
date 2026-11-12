// Idle Looping Studios intro (Chris 2026-11-10): the pink wave moves like a thin, rubbery, slightly odd audio line and settles into the
// logo; the lettering (cut from his logo image, text.png) comes in after. draw(opt, t) draws one frame at t seconds on a 1280x720 canvas.
// The wave's shape is the logo's own centre line (wave.json, traced from idle-looping-logo.png), in the logo's pixel coordinates.
const W = 1280, H = 720, CREAM = [250, 240, 222];
// LOGO (set before drawing; the default is the first logo): scale, the logo's centre, where text.png sits and where its studios row
// starts (0..1 down it), the wave's colour and stroke width. A logo whose wave changes thickness along it has a w list in wave.json,
// and its painted wave (ART, art.png at LOGO.art) fades in over the drawn one once it has landed, so it ends exactly as painted.
let LOGO = { S: 0.66, cx: 770, cy: 507, text: [200, 540], split: 0.62, pink: '#fc2c88', full: 84 };
let S, OX, OY, PINK, FULL, WAVE, TEXT, ART = null, DSTYLE = 'still', GLYPHS = null;
function useLogo(cfg) {
  LOGO = Object.assign({}, LOGO, cfg || {});
  S = LOGO.S; OX = 640 - LOGO.cx * S; OY = 360 - LOGO.cy * S; PINK = LOGO.pink; FULL = LOGO.full;
}
useLogo();
// the stroke width the logo has at u along the wave
function FW(u) {
  if (!WAVE.w) return FULL;
  const n = WAVE.w.length - 1, f = clamp(u, 0, 1) * n, i = Math.min(n - 1, Math.floor(f));
  return WAVE.w[i] + (WAVE.w[i + 1] - WAVE.w[i]) * (f - i);
}
const ease = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const spring = (t, k = 6, w = 14) => (t <= 0 ? 0 : 1 - Math.exp(-k * t) * Math.cos(w * t)); // overshoots and settles at 1
const decay = (t, k) => (t <= 0 ? 1 : Math.exp(-k * t));
function hash(n) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}
function noise1(x) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u - 0.5;
}
// the logo's shape as displacement from the line through its two ends, at u in 0..1 along it
function base(u) {
  const n = WAVE.x.length - 1, f = clamp(u, 0, 1) * n, i = Math.min(n - 1, Math.floor(f)), k = f - i;
  const x = WAVE.x[i] + (WAVE.x[i + 1] - WAVE.x[i]) * k, y = WAVE.y[i] + (WAVE.y[i + 1] - WAVE.y[i]) * k;
  return [x, y];
}
const X0 = () => WAVE.x[0], X1 = () => WAVE.x[WAVE.x.length - 1];
const YL = () => (WAVE.y[0] + WAVE.y[WAVE.y.length - 1]) / 2;
// stroke a line through pts (logo coords) with width per point (logo px), round ends: one round-capped segment at a time
function stroke(ctx, pts, widths, color, glow) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
  }
  const same = widths.every(w => Math.abs(w - widths[0]) < 0.01);
  if (same) {
    ctx.lineWidth = widths[0] * S;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(OX + x * S, OY + y * S) : ctx.moveTo(OX + x * S, OY + y * S)));
    ctx.stroke();
  } else
    for (let i = 0; i < pts.length - 1; i++) {
      ctx.lineWidth = Math.max(0.5, ((widths[i] + widths[i + 1]) / 2) * S);
      ctx.beginPath();
      ctx.moveTo(OX + pts[i][0] * S, OY + pts[i][1] * S);
      ctx.lineTo(OX + pts[i + 1][0] * S, OY + pts[i + 1][1] * S);
      ctx.stroke();
    }
  ctx.restore();
}
// the lettering: 'fade' (rises and fades in), 'type' (letters revealed left to right), 'drop' (drops in with a bounce), 'spread'
// (studios spreads out); p 0..1
function text(ctx, p, style) {
  if (p <= 0) return;
  const x = OX + LOGO.text[0] * S, y = OY + LOGO.text[1] * S, w = TEXT.width * S, h = TEXT.height * S, sp = LOGO.split;
  ctx.save();
  if (style === 'type') {
    ctx.beginPath();
    ctx.rect(x, y, w * clamp(p, 0, 1), h * sp); // the top line, idle looping, typed
    const p2 = clamp((p - 0.75) / 0.25, 0, 1);
    ctx.rect(x, y + h * sp, w * p2, h * (1 - sp)); // then studios
    ctx.clip();
    ctx.drawImage(TEXT, x, y, w, h);
  } else if (style === 'drop') {
    const s = spring(p * 1.4, 5, 16), dy = (1 - s) * -60;
    ctx.globalAlpha = clamp(p * 3, 0, 1);
    ctx.drawImage(TEXT, x, y + dy, w, h);
  } else if (style === 'spread') {
    ctx.globalAlpha = ease(p);
    ctx.drawImage(TEXT, 0, 0, TEXT.width, TEXT.height * sp, x, y + (1 - ease(p)) * 14, w, h * sp);
    const sx = 0.55 + 0.45 * ease(clamp((p - 0.2) / 0.8, 0, 1)), cx = x + w / 2;
    ctx.drawImage(TEXT, 0, TEXT.height * sp, TEXT.width, TEXT.height * (1 - sp), cx - (w * sx) / 2, y + h * sp, w * sx, h * (1 - sp));
  } else if (style === 'scatter' || style === 'focus' || style === 'sweep') {
    gather(ctx, p, style, x, y, w, h);
  } else if (style === 'still') { // a clean fade, nothing moving
    ctx.globalAlpha = ease(p);
    ctx.drawImage(TEXT, x, y, w, h);
  } else if (style === 'wipe') { // revealed left to right behind a soft edge, as if the rolling wave pushed it in
    const edge = 0.12, e = -edge + (1 + edge * 2) * ease(p) ** 0.8, g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(clamp(e - edge, 0, 1), 'rgba(0,0,0,1)');
    g.addColorStop(clamp(e, 0, 1), 'rgba(0,0,0,0)');
    const c = document.createElement('canvas');
    c.width = Math.ceil(w); c.height = Math.ceil(h);
    const cx2 = c.getContext('2d');
    cx2.drawImage(TEXT, 0, 0, w, h);
    cx2.globalCompositeOperation = 'destination-in';
    cx2.setTransform(1, 0, 0, 1, -x, 0);
    cx2.fillStyle = g;
    cx2.fillRect(x, 0, w, h);
    ctx.drawImage(c, x, y);
  } else if (style === 'pop') { // each letter pops up in turn with a little springy overshoot, idle looping then studios
    const gl = glyphs(), n = gl.length;
    gl.forEach((g, k) => {
      const q = clamp((p * (n + 6) - k) / 7, 0, 1);
      if (q <= 0) return;
      const sc = clamp(spring(q * 1.3, 4, 15), 0, 1.3), gx = x + g.x0 * S, gy = y + g.y0 * S, gw = (g.x1 - g.x0) * S, gh = (g.y1 - g.y0) * S;
      ctx.globalAlpha = clamp(q * 4, 0, 1);
      ctx.drawImage(TEXT, g.x0, g.y0, g.x1 - g.x0, g.y1 - g.y0, gx + gw / 2 - (gw * sc) / 2, gy + gh - gh * sc, gw * sc, gh * sc);
    });
  } else if (style === 'rubber') { // the whole name comes in stretched wide and flat, then snaps to size and jiggles like rubber
    const k = spring(p * 1.25, 3.2, 13), sx = 1 + (1 - k) * 0.9, sy = 1 - (1 - k) * 0.8;
    ctx.globalAlpha = clamp(p * 5, 0, 1);
    ctx.drawImage(TEXT, x + (w - w * sx) / 2, y + (h - h * sy) / 2, w * sx, h * sy);
  } else {
    ctx.globalAlpha = ease(p);
    ctx.drawImage(TEXT, x, y + (1 - ease(p)) * 16, w, h);
  }
  ctx.restore();
}
// the letters of text.png (found once from its alpha): boxes in the image's pixels, the top row then the studios row
function glyphs() {
  if (GLYPHS) return GLYPHS;
  const c = document.createElement('canvas');
  c.width = TEXT.width; c.height = TEXT.height;
  const g = c.getContext('2d');
  g.drawImage(TEXT, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data, out = [];
  for (const [r0, r1] of [[0, Math.round(TEXT.height * LOGO.split)], [Math.round(TEXT.height * LOGO.split), TEXT.height]]) {
    let start = -1, gap = 0;
    for (let xx = 0; xx <= c.width; xx++) {
      let on = false;
      if (xx < c.width) for (let yy = r0; yy < r1 && !on; yy++) on = d[(yy * c.width + xx) * 4 + 3] > 40;
      if (on) { if (start < 0) start = xx; gap = 0; }
      else if (start >= 0 && ++gap > 4) { out.push({ x0: Math.max(0, start - 2), x1: Math.min(c.width, xx - gap + 3), y0: r0, y1: r1 }); start = -1; }
    }
  }
  return (GLYPHS = out);
}
// the text as specks of light (Chris 2026-11-10: "a cool fade in from a scatter, kinda like the second part of an old console start-up screen"). The
// lettering is sampled into specks; they gather into it, glowing, then the real lettering fades in under them and they go out.
//   scatter: a cloud drifting in from all around, swirling as it closes in; far specks big and dim (out of focus), near ones small and bright
//   focus:   the specks start near their places but blurred apart and twinkling, and pull into focus
//   sweep:   like scatter, but they arrive left to right, following the wave
let SPECKS = null, GLOWC = null, SMALL = null;
// a quarter-size layer to blur on: cleared, drawn into (c), then blur(px) returns it blurred by px (quarter-size pixels)
function smallLayer(w, h) {
  if (!SMALL) {
    const mk = () => { const cv = document.createElement('canvas'); cv.width = Math.ceil(w / 4); cv.height = Math.ceil(h / 4); return cv; };
    const a = mk(), b = mk();
    SMALL = { cv: a, c: a.getContext('2d'), out: b, oc: b.getContext('2d'),
      blur(px) { const o = this.oc; o.clearRect(0, 0, b.width, b.height); o.filter = `blur(${px}px)`; o.drawImage(a, 0, 0); o.filter = 'none'; return b; } };
  }
  SMALL.c.clearRect(0, 0, SMALL.cv.width, SMALL.cv.height);
  return SMALL;
}
function specks() {
  if (SPECKS && SPECKS.src === TEXT) return SPECKS.list;
  const c = document.createElement('canvas');
  c.width = TEXT.width; c.height = TEXT.height;
  const g = c.getContext('2d');
  g.drawImage(TEXT, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data, list = [], st = 5;
  let n = 0;
  for (let yy = 0; yy < c.height; yy += st)
    for (let xx = 0; xx < c.width; xx += st)
      if (d[(yy * c.width + xx) * 4 + 3] > 120) {
        const r1 = hash(++n * 1.7), r2 = hash(n * 3.1 + 7), r3 = hash(n * 5.3 + 2), r4 = hash(n * 7.9 + 5);
        list.push({ x: xx, y: yy, a: r1 * 6.2832, r: 0.35 + r2 * 0.9, z: r3, k: r4 });
      }
  SPECKS = { src: TEXT, list };
  return list;
}
function gather(ctx, p, style, x, y, w, h) {
  if (p <= 0) return;
  const list = specks(), real = ease((p - 0.45) / 0.5), sp = S * 1.0; // (Chris: that one is quick and subtle)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const glow = GLOWC || (GLOWC = document.createElement('canvas')); // one canvas, reused (a new one each frame was slow on the Retroid 2S)
  glow.width = W; glow.height = H; // (also clears it)
  const gc = glow.getContext('2d');
  gc.globalCompositeOperation = 'lighter';
  let drawn = 0; // (none left once the name is in: then no glow to blur, which is slow on a phone)
  for (const s of list) {
    const lag = style === 'sweep' ? (s.x / TEXT.width) * 0.45 + s.k * 0.12 : s.k * 0.35;
    const q = clamp((p - lag * 0.6) / (1 - lag * 0.6 - 0.15), 0, 1), e = 1 - (1 - q) ** 3; // each speck's own arrival, fast then gentle
    let px = x + (s.x + 2) * S, py = y + (s.y + 2) * S, size, alpha;
    if (style === 'focus') {
      const off = (1 - e) * (14 + 36 * s.z), tw = 0.5 + 0.5 * Math.sin(p * 40 + s.a * 3);
      px += Math.cos(s.a) * off; py += Math.abs(Math.sin(s.a)) * off * 0.6;
      size = sp * (1.8 + 2.5 * (1 - e) * s.z); alpha = (0.2 + 0.4 * e) * (0.6 + 0.4 * tw) * ease(p / 0.15);
    } else {
      const R = (1 - e) * (40 + 90 * s.r), ang = s.a + (1 - e) * 1.2; // swirls in a little as it closes
      px += Math.cos(ang) * R; py += Math.abs(Math.sin(ang)) * R * 0.5; // from the sides and below, never over the wave
      size = sp * (1.8 + 3 * (1 - e) * s.z); alpha = (0.18 + 0.42 * e) * ease(q / 0.15);
    }
    alpha *= 1 - real;
    if (alpha <= 0.01) continue;
    const c = `rgba(${CREAM[0]},${CREAM[1]},${CREAM[2]},${(alpha * (size > sp * 5 ? (sp * 5) / size : 1)).toFixed(3)})`;
    gc.fillStyle = c;
    gc.fillRect(px - size / 2, py - size / 2, size, size);
    drawn++;
  }
  if (drawn) {
    // a light glow: blurred at a quarter size and drawn back up, the same soft look for a sixteenth of the work (a full-size blur
    // took most of a frame on a phone: Fable's bug check)
    const sm = smallLayer(W, H);
    sm.c.drawImage(glow, 0, 0, sm.cv.width, sm.cv.height);
    ctx.globalAlpha = 0.6;
    ctx.drawImage(sm.blur(1.25), 0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.drawImage(glow, 0, 0);
  }
  ctx.globalCompositeOperation = 'source-over';
  if (real > 0) {
    ctx.globalAlpha = real;
    ctx.drawImage(TEXT, x, y, w, h);
    if (real < 1) {
      ctx.globalCompositeOperation = 'lighter'; // a last soft bloom off the finished name, fading
      ctx.globalAlpha = real * (1 - real) * 0.5;
      const sm = smallLayer(W, H); // (the same quarter-size blur)
      sm.c.drawImage(TEXT, x / 4, y / 4, w / 4, h / 4);
      ctx.drawImage(sm.blur(1.5), 0, 0, W, H);
    }
  }
  ctx.restore();
}
const N = 160;
// round 1's D, untouched: the wave at t seconds (the round 2 D plays it from D0_START on)
const D0_START = 2.54;
// the stepped logo's roll (Chris 2026-11-10: "not smooth like the other"). Its long flat ends would roll through the humps, so instead
// one hump (roll.json: the three humps averaged, one period long, with its stroke widths; and at several amounts of blur) repeats
// between the flat ends and rolls through there, the way the first logo's wave does. While it rolls its steps are blurred into soft
// curves; they sharpen into the real steps as it lands, and the window the humps roll in goes from soft-edged to hard. Same timing as D0.
let ROLL = null;
function rollAt(arrs, b, k) { // arrs: the profile at each blur level; b: 0 sharp .. 1 most blurred; k: index along it (wraps)
  const f = b * (arrs.length - 1), i = Math.min(arrs.length - 2, Math.floor(f)), m = arrs[0].length, j = ((Math.floor(k) % m) + m) % m, j2 = (j + 1) % m, kk = k - Math.floor(k);
  const at = a => a[j] + (a[j2] - a[j]) * kk;
  return at(arrs[i]) + (at(arrs[i + 1]) - at(arrs[i])) * (f - i);
}
// how far the stepped logo has filled out (round-1 time): the drawn wave's and the painting's thickness both follow it, so the
// handoff doesn't change it; about 1 when it lands
function stepGrow(t) {
  const settle = ease((t - 2.4) / 1.4), sw = clamp(spring(clamp((t - 3.0) / 1.0, 0, 1) * 1.4, 3, 12), 0, 1.15);
  return (sw * settle) / 0.98;
}
// the straight parts' thickness (round-1 time): grows once, smoothly, from thin to exactly the painting's line by the handoff
// (Chris: the straight parts changed weight and roundness) so they are the painting's own lines, still, from the first frame; this is
// their thickness at x (the painted left line is a little thinner than the right), which the rolling wave matches where it meets them
// the painted straight lines' centre and thickness at x, read off the painting itself (at half strength, as they look): the lines
// aren't quite level or equal (the right one sits higher and is thicker), so the drawn wave follows them exactly where it meets them,
// and runs straight from one to the other between
let LINEC = null;
function lineAt(x) {
  if (!LINEC || LINEC.src !== ART) {
    const c = document.createElement('canvas');
    c.width = ART.width; c.height = ART.height;
    const g = c.getContext('2d');
    g.drawImage(ART, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data, cols = [];
    for (let xx = 0; xx < c.width; xx++) {
      let a0 = -1, b0 = -1, fa = 0, fb = 0;
      for (let y = 0; y < c.height; y++) {
        const v = d[(y * c.width + xx) * 4 + 3] / 255;
        if (v > 0.5) { if (a0 < 0) { a0 = y; fa = y > 0 ? (v - 0.5) / Math.max(0.01, v - d[((y - 1) * c.width + xx) * 4 + 3] / 255) : 0; } b0 = y; }
      }
      if (b0 >= 0) { const vn = b0 + 1 < c.height ? d[((b0 + 1) * c.width + xx) * 4 + 3] / 255 : 0, vb = d[(b0 * c.width + xx) * 4 + 3] / 255; fb = (vb - 0.5) / Math.max(0.01, vb - vn); }
      cols.push(a0 < 0 ? null : { t: a0 - fa, b: b0 + fb }); // sub-pixel edges at half strength
    }
    LINEC = { src: ART, cols };
  }
  const R = ROLL, ax = LOGO.art[0], xl = R.xa - 25, xr = R.xb + 60;
  const at = xx => { const k = LINEC.cols[clamp(Math.round(xx - ax), 0, LINEC.cols.length - 1)]; return k ? { c: LOGO.art[1] + (k.t + k.b + 1) / 2, w: k.b - k.t } : { c: R.yl, w: R.flatw }; };
  if (x <= xl || x >= xr) return at(x);
  const A = at(xl), B = at(xr), f = (x - xl) / (xr - xl);
  return { c: A.c + (B.c - A.c) * f, w: A.w + (B.w - A.w) * f };
}
function flatAt(x) {
  const [l, r] = LOGO.flatLine;
  return l + (r - l) * clamp((x - X0()) / (X1() - X0()), 0, 1);
}
function stepRoll(t) {
  const settle = ease((t - 2.4) / 1.4), ph = 2.0 * (1 - settle) * t * 0.55, shift = ph * (X1() - X0());
  const b = 1 - ease((t - 2.8) / 0.5), sw = clamp(spring(clamp((t - 3.0) / 1.0, 0, 1) * 1.4, 3, 12), 0, 1.15);
  const pw = ease((t - 3.0) / 0.35), R = ROLL, pts = [], wd = [], n = 320, wa = R.xa + 25, wb = R.xb + 25; // one edge for the drawn wave and the painting: flat at the window's ends (where the painting's roll wraps), full 120 px in
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = X0() + (X1() - X0()) * u, k = (x - R.xa + shift) / R.dx;
    const win = ease((x - wa) / 120) * ease((wb - x) / 120), pin = Math.sin(Math.PI * u) ** 0.35;
    // only the humps wobble and ripple (Chris: the straight parts "wobble and change shape oddly"): outside the window the line stays
    // put and just fills out evenly, in step with the painting that takes over later (stepGrow)
    const LN = lineAt(x);
    pts.push([x, LN.c + rollAt(R.h, b, k) * win * pin * (0.55 + 0.45 * settle) + Math.sin(u * 20 - t * 9) * 10 * (1 - settle) * win]);
    const b0 = 0.28 + 0.12 * Math.sin(t * 4.2), flat = LN.w;
    const target = flat * 1.6 * (1 - pw) + (rollAt(R.w, Math.max(b, 0.67), k) * win ** 3 + flat * (1 - win ** 3)) * pw; // (widths always a little smoothed: sharp ones notched the drop tops) // what it fills out to
    const inner = flat * (1 + 0.15 * Math.sin(u * 17 - t * 8) * (1 - settle)) + (target - flat) * clamp(sw * settle, 0, 1.15); // (Chris: the arms and the middle came in at different weights) one even weight to start
    wd.push(flat + (inner - flat) * win);
  }
  return { pts, wd, on: 1 };
}
function D0(t) {
  const settle = ease((t - 2.4) / 1.4), ph = 2.0 * (1 - settle) * t * 0.55, pts = [], wd = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, [x] = base(u), uu = ((u + ph) % 1 + 1) % 1, [, y2] = base(uu), yl = YL() + (u - 0.5) * (WAVE.y[WAVE.y.length - 1] - WAVE.y[0]);
    const pin = Math.sin(Math.PI * u) ** 0.35;
    pts.push([x, yl + (y2 - yl) * pin * (0.55 + 0.45 * settle) + Math.sin(u * 20 - t * 9) * 10 * (1 - settle)]);
    const breathe = 0.28 + 0.12 * Math.sin(t * 4.2) + 0.1 * Math.sin(u * 17 - t * 8);
    wd.push(FULL * breathe * (1 - settle) + FW(u) * clamp(spring(clamp((t - 3.0) / 1.0, 0, 1) * 1.4, 3, 12), 0, 1.15) * settle);
  }
  return { pts, wd, on: 1 };
}
// each option: the wave's points and widths at time t, and how the text comes in
const OPTS = {
  // A: plucked string. A thin line across, plucked: it rings in its harmonics (wobbly, odd), and the ringing settles into the logo
  // while the line swells to full thickness
  A: {
    land: 3.7,
    len: 5,
    wave(t) {
      const s = spring(clamp((t - 0.9) / 2.2, 0, 1) * 2.2, 2.4, 7), pts = [], wd = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N, [x, y] = base(u), yl = YL() + (u - 0.5) * (WAVE.y[WAVE.y.length - 1] - WAVE.y[0]);
        let ring = 0;
        if (t > 0.35) {
          const tt = t - 0.35;
          ring = 70 * Math.sin(Math.PI * u) * Math.cos(9 * tt) * decay(tt, 1.1) + 38 * Math.sin(2 * Math.PI * u) * Math.cos(17 * tt + 1) * decay(tt, 1.6) + 22 * Math.sin(5 * Math.PI * u) * Math.cos(31 * tt) * decay(tt, 2.2);
        }
        pts.push([x, yl + (y - yl) * s + ring * (1 - ease((t - 2.6) / 1.2))]);
        wd.push(6 + (FW(u) - 6) * clamp(spring(clamp((t - 2.0) / 1.6, 0, 1) * 1.6, 3, 10), 0, 1.15));
      }
      return { pts, wd, on: clamp(t / 0.3, 0, 1) };
    },
    text: t => [clamp((t - 3.3) / 0.9, 0, 1), 'fade']
  },
  // B: oscilloscope. A thin glowing trace jitters like a voice (odd, mixed frequencies), then tunes in: it locks onto the logo's
  // wave and thickens with a rubbery overshoot; the lettering types in
  B: {
    land: 3.6,
    len: 5,
    glow: true,
    wave(t) {
      const lock = spring(clamp((t - 2.0) / 1.0, 0, 1) * 1.4, 3.5, 12), pts = [], wd = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N, [x, y] = base(u), yl = YL() + (u - 0.5) * (WAVE.y[WAVE.y.length - 1] - WAVE.y[0]);
        const env = Math.sin(Math.PI * u) ** 0.6, amp = 90 * ease(t / 0.8);
        const voice = Math.sin(u * 23 + t * 19) * 0.45 + Math.sin(u * 41 - t * 31) * 0.25 + noise1(u * 30 + t * 12) * 0.9 + Math.sin(u * 9.4 + t * 7) * 0.5;
        const v = yl + voice * amp * env;
        pts.push([x, v + (y - v) * lock]);
        wd.push(4 + (FW(u) - 4) * clamp(spring(clamp((t - 2.3) / 1.2, 0, 1) * 1.6, 3, 11), 0, 1.15));
      }
      return { pts, wd, on: clamp(t / 0.25, 0, 1) };
    },
    text: t => [clamp((t - 3.0) / 1.4, 0, 1), 'type']
  },
  // C: rubber band. A short fat blob in the middle stretches out (getting thinner the longer it gets), wriggles with a wave running
  // through it, then snaps into the logo and jiggles; the lettering drops in
  C: {
    land: 3.3,
    len: 5,
    wave(t) {
      const L = 0.08 + 0.92 * spring(clamp((t - 0.2) / 1.3, 0, 1) * 1.3, 3.2, 9);
      const snap = spring(clamp((t - 1.9) / 1.0, 0, 1) * 1.3, 2.6, 13), pts = [], wd = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N, [x, y] = base(u), yl = YL() + (u - 0.5) * (WAVE.y[WAVE.y.length - 1] - WAVE.y[0]);
        const cx = (X0() + X1()) / 2, xx = cx + (x - cx) * L;
        const wig = 45 * Math.sin(u * 14 - t * 11) * Math.sin(Math.PI * u) * (1 - ease((t - 1.6) / 0.8));
        pts.push([xx, yl + wig + (y - yl) * snap]);
        const thin = clamp(0.32 / L, 0.12, 2.6); // stretched, it thins
        wd.push(FW(u) * (thin * (1 - ease((t - 1.9) / 0.6)) + clamp(snap, 0, 1.2) * ease((t - 1.9) / 0.6)) * (0.85 + 0.15 * Math.sin(u * 9 + t * 6) * (1 - ease((t - 2.5) / 1))));
      }
      return { pts, wd, on: 1 };
    },
    text: t => [clamp((t - 3.0) / 1.2, 0, 1), 'drop']
  },
  // D: idle loop. The logo's wave itself rolls along like a loop playing, thin and breathing, its thickness rippling down its length,
  // then it lands exactly on the logo and fills out. Round 2 (Chris 2026-11-10: "I liked the original a lot but just didn't want the
  // beginning"): the same motion as round 1, started at D0_START, the moment it turns from drifting left to running right, with the wave
  // easing up out of a flat line over the first third of a second; the text comes in as DSTYLE says
  D: {
    land: 4.1 - 2.54,
    roundOne: true,
    len: 3.0,
    wave(t) {
      const g = ease(t / 0.35), w0 = ROLL ? stepRoll(t + D0_START) : D0(t + D0_START);
      const n = w0.pts.length - 1;
      w0.pts = w0.pts.map(([x, y], i) => {
        const u = i / n, yl = ROLL ? lineAt(x).c : YL() + (u - 0.5) * (WAVE.y[WAVE.y.length - 1] - WAVE.y[0]);
        return [x, yl + (y - yl) * g];
      });
      w0.on = clamp(t / 0.2, 0, 1);
      return w0;
    },
    text: t => { const st = DSTYLE.split('.')[0]; return /scatter|focus|sweep/.test(st) ? [clamp((t - 0.75) / 0.9, 0, 1), st] : [clamp((t - (st === 'wipe' ? 0.7 : 0.9)) / 0.9, 0, 1), st]; }
  },
  // E: pen. A thin line is drawn on left to right by a wobbly hand, then inflates like a balloon to the logo's thickness and wobbles
  // like jelly
  E: {
    land: 3.7,
    len: 5,
    wave(t) {
      const reach = ease(clamp((t - 0.15) / 1.6, 0, 1)), inflate = spring(clamp((t - 2.0) / 1.2, 0, 1) * 1.4, 2.8, 15), pts = [], wd = [];
      const n = Math.max(2, Math.round(N * reach));
      for (let i = 0; i <= n; i++) {
        const u = i / N, [x, y] = base(u), hand = noise1(u * 40) * 18 * (1 - ease((t - 1.8) / 1.0));
        const jelly = Math.sin(u * 12 + t * 10) * 9 * (1 - clamp(inflate, 0, 1)) * (t > 2 ? 1 : 0);
        pts.push([x, y + hand + jelly]);
        wd.push(7 + (FW(u) - 7) * clamp(inflate, 0, 1.2) * (1 + 0.08 * Math.sin(u * 30 + t * 14) * decay(t - 2.4, 2)));
      }
      return { pts, wd, on: 1 };
    },
    text: t => [clamp((t - 3.1) / 1.0, 0, 1), 'fade']
  }
};
// the stepped logo's last stretch (Chris 2026-11-10: "I'd like it to look fully perfect when it snaps into focus after all the
// moving"): from ART_ROLL[0] (round-1 time) the painting itself rolls, column by column, through the same window with the same motion
// as the drawn wave (they're in step, so the drawn one fades out under it over to ART_ROLL[1]), slowing to a stop; stopped, every column
// is back where it was painted, so it ends as the painting exactly, with nothing left to switch.
const ART_ROLL = [3.3, 3.3];
let ARTCOLS = null; // the painting's pink in each of its columns: top and bottom, in its own pixels
function artCols() {
  if (ARTCOLS && ARTCOLS.src === ART) return ARTCOLS;
  const c = document.createElement('canvas');
  c.width = ART.width; c.height = ART.height;
  const g = c.getContext('2d');
  g.drawImage(ART, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data, top = [], bot = [];
  for (let x = 0; x < c.width; x++) {
    let t0 = -1, b0 = -1;
    for (let y = 0; y < c.height; y++) if (d[(y * c.width + x) * 4 + 3] > 20) { if (t0 < 0) t0 = y; b0 = y + 1; }
    top.push(t0); bot.push(b0);
  }
  return (ARTCOLS = { src: ART, top, bot });
}
// the stepped logo's straight lines with their round ends, as painted, drawn the same way in every frame
let LAYER = null;
function layer() {
  if (!LAYER) { LAYER = document.createElement('canvas'); LAYER.width = W; LAYER.height = H; }
  return LAYER;
}
function stillLines(ctx, alpha) {
  const cl = Math.round(OX + (ROLL.xa - 20) * S), cr = Math.round(OX + (ROLL.xb + 54) * S);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.rect(0, 0, cl, H);
  ctx.rect(cr, 0, W - cr, H);
  ctx.clip();
  ctx.drawImage(ART, OX + LOGO.art[0] * S, OY + LOGO.art[1] * S, ART.width * S, ART.height * S);
  ctx.restore();
}
function drawArtRoll(ctx, t, alpha) {
  const R = ROLL, settle = ease((t - 2.4) / 1.4), ph = 2.0 * (1 - settle) * t * 0.55, shift = ph * (X1() - X0()), span = R.xb - R.xa;
  const wa = R.xa + 25, wb = R.xb + 25; // the window, moved to where its two ends' columns of paint match (just past a drop's foot)
  const ax = LOGO.art[0], ay = LOGO.art[1], x0 = Math.floor(OX + ax * S), x1 = Math.ceil(OX + (ax + ART.width) * S), C = artCols();
  // the sunk zone at each edge narrows as the roll runs out (Chris: popping back up at the end looked clumsy): the edge columns show
  // paint from shift px further along, so with little shift left they're nearly right already and can rise back with the motion
  const wS = 120 * clamp(shift / 160, 0, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let cx = x0; cx < x1; cx++) {
    const x = (cx - OX) / S, u = clamp((x - X0()) / (X1() - X0()), 0, 1);
    const xs = x >= wa && x <= wb ? wa + ((((x - wa + shift) % span) + span) % span) : x, sc = Math.round(xs - ax);
    if (sc < 0 || sc >= C.top.length || C.top[sc] < 0 || x < R.xa - 20 || x > R.xb + 54) continue; // (the still lines are drawn whole, by stillLines)
    // near the window's edges a hump sinks into the flat line while it moves (the same edge as the drawn wave's, so the handoff
    // matches): its column of paint slides down onto the line and thins to the line's own thickness, so a sunk column IS the flat
    // line and there's no seam; in the last frames, with only a little roll left, they rise back to full
    const e = (x < wa && x > R.xa - 20) || (x > wb && x <= R.xb + 54) ? 1 - wS / 120 : wS < 0.5 || x < wa || x > wb ? 1 : ease((x - wa) / wS) * ease((wb - x) / wS); // (the first rise's foot, just outside, goes down and up with them)
    const amp = (settle >= 1 ? 1 : (Math.sin(Math.PI * u) ** 0.35 * (1 - settle) + settle) * (0.55 + 0.45 * settle)) * e;
    const wig = Math.sin(u * 20 - t * 9) * 10 * (1 - settle) * (x >= wa && x <= wb ? ease((x - wa) / 120) * ease((wb - x) / 120) : 0);
    // the column's top and bottom each move toward the flat line's: the top fast (k squared), the bottom gently, so a sinking hump
    // or drop stays joined to the line all the way down instead of leaving a piece floating
    // a sinking column takes the average outline of the paint around it, over more of it the further down it is, so a drop melts
    // into a slope as it sinks instead of standing up as a thin spike (Chris)
    let top = ay + C.top[sc], bot = ay + C.bot[sc];
    const foot = x < wa || x > wb, rr = foot ? 0 : Math.round(Math.sqrt(Math.max(0, 1 - e)) * 60); // (a foot just sinks: melting it pulled in the drop beside it) // (melts strongly as soon as it starts sinking: a little smoothing left ripples)
    if (rr > 0) {
      let st = 0, sb = 0, n = 0;
      for (let k = -rr; k <= rr; k++) { const j = sc + k; if (j >= 0 && j < C.top.length && C.top[j] >= 0) { st += C.top[j]; sb += C.bot[j]; n++; } }
      top = ay + st / n; bot = ay + sb / n;
    }
    const hh = C.bot[sc] - C.top[sc], LN = lineAt(x), fl = LN.w, fT = LN.c - fl / 2, fB = LN.c + fl / 2;
    let T2 = fT + (top - fT) * amp * amp + wig, B2 = fB + (bot - fB) * amp + wig;
    const G = 1 + (Math.min(1.05, stepGrow(t)) - 1) * (x >= wa && x <= wb ? ease((x - wa) / 120) * ease((wb - x) / 120) : 0), mid = (T2 + B2) / 2, half = fl / 2 + ((B2 - T2) / 2 - fl / 2) * G; // still filling out from the line's weight, as the drawn wave was
    if (rr > 0) { ctx.fillStyle = PINK; ctx.fillRect(cx, OY + (mid - half) * S, 1.5, Math.max(1, half * 2) * S); } // a melting column is plain paint
    else ctx.drawImage(ART, sc, C.top[sc], 1, hh, cx, OY + (mid - half) * S, 1.5, Math.max(1, half * 2) * S);
  }
  ctx.restore();
}
function draw(ctx, opt, t) {
  const o = OPTS[opt];
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  const { pts, wd, on } = o.wave(t);
  const T = o.roundOne ? t + D0_START : -1; // round-1 time, for the stepped logo's painting roll
  // the stepped logo's 'edges' version (DSTYLE '<text>.edges', Chris 2026-11-10): only the humped middle rolls, pinned at its ends, and
  // the flat lines stretch out to the sides as it settles (round ends on them while they grow)
  const edges = ART && ROLL && o.roundOne && /\.edges/.test(DSTYLE);
  let ext = 1;
  if (edges) {
    ext = 1 - (1 - clamp((T - 3.5) / 0.5, 0, 1)) ** 3;
    if (ext < 1) {
      const wa = ROLL.xa + 25, wb = ROLL.xb + 25, aL = LOGO.art[0] + 9, aR = LOGO.art[0] + ART.width - 9; // (the painting's own ends, less their roundness)
      const L = OX + (wa + (aL - wa) * ext) * S, Rr = OX + (wb + (aR - wb) * ext) * S;
      const g = T >= ART_ROLL[0] ? Math.min(1.05, stepGrow(T)) * ROLL.flatw : null;
      ctx.save();
      ctx.beginPath();
      ctx.rect(L, 0, Rr - L, H);
      ctx.clip();
      ctx.__edges = { L, Rr, g };
    }
  }
  if (ART && ROLL && o.roundOne && T >= ART_ROLL[0]) {
    const c = 1;
    if (c < 1) { ctx.globalAlpha = 1 - c; stroke(ctx, pts, wd, PINK, 0); } // under the painting, which comes in solid
    if (T >= 3.8) ctx.drawImage(ART, OX + LOGO.art[0] * S, OY + LOGO.art[1] * S, ART.width * S, ART.height * S); // landed: the painting as it is
    else { stillLines(ctx, 1); drawArtRoll(ctx, T, 1); }
  } else if (ART && ROLL && o.roundOne && !edges) {
    // the painted straight lines, still, and the drawn wave only between them
    // drawn whole at full strength on a layer, then faded in as one piece (faded separately, the drawn wave's overlapping pieces
    // came out brighter than the painted lines)
    const cl = Math.round(OX + (ROLL.xa - 20) * S), cr = Math.round(OX + (ROLL.xb + 54) * S);
    const lay = layer(), lc = lay.getContext('2d');
    lc.clearRect(0, 0, W, H);
    stillLines(lc, 1);
    lc.save();
    lc.beginPath();
    lc.rect(cl, 0, cr - cl, H);
    lc.clip();
    stroke(lc, pts, wd, PINK, 0);
    lc.restore();
    ctx.globalAlpha = on;
    ctx.drawImage(lay, 0, 0);
    ctx.globalAlpha = 1;
  } else {
    ctx.globalAlpha = on;
    stroke(ctx, pts, wd, PINK, o.glow ? 18 * (1 - ease((t - 3) / 1.2)) : 0);
  }
  if (edges && ext < 1) { // round ends on the clipped line, as thick as the line is there
    const { L, Rr } = ctx.__edges;
    ctx.restore();
    const yl = OY + ROLL.yl * S, at = xx => { let best = pts[0], bd = 1e9; for (const p of pts) { const d = Math.abs(OX + p[0] * S - xx); if (d < bd) { bd = d; best = p; } } return best; };
    ctx.fillStyle = PINK;
    ctx.globalAlpha = on;
    for (const xx of [L, Rr]) {
      let r;
      if (T >= ART_ROLL[0]) r = (Math.min(1.05, stepGrow(T)) * ROLL.flatw * S) / 2;
      else { const i = pts.indexOf(at(xx)); r = (wd[i] * S) / 2; }
      ctx.beginPath();
      ctx.arc(xx, T >= ART_ROLL[0] ? yl : OY + at(xx)[1] * S, r, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.globalAlpha = 1;
  const [p, style] = o.text(t);
  text(ctx, p, style);
}

// ---------- ways of finishing (Chris 2026-11-10: "the intro never goes to black before we switch"): drawOutro(ctx, name, u) draws the
// finished logo going away, u seconds after the hold ends; OUTROS[name].dur is how long it takes to reach black ----------
const OUTROS = { fade: { dur: 0.6 }, tv: { dur: 0.6 }, scatter: { dur: 0.9 }, roll: { dur: 0.95 } };
let OUTL = null;
function outLayer() {
  if (!OUTL) { OUTL = document.createElement('canvas'); OUTL.width = W; OUTL.height = H; }
  return OUTL;
}
// the stepped logo's paint with the humps rolled on by shift px and sunk toward the line by a (1 = as painted, 0 = a flat line)
function artColumns(ctx, shift, a) {
  const R = ROLL, span = R.xb - R.xa, wa = R.xa + 25, wb = R.xb + 25, ax = LOGO.art[0], ay = LOGO.art[1], C = artCols();
  const x0 = Math.floor(OX + ax * S), x1 = Math.ceil(OX + (ax + ART.width) * S), wS = 120 * clamp(Math.abs(shift) / 160, 0, 1);
  stillLines(ctx, 1);
  for (let cx = x0; cx < x1; cx++) {
    const x = (cx - OX) / S;
    if (x < R.xa - 20 || x > R.xb + 54) continue;
    const xs = x >= wa && x <= wb ? wa + ((((x - wa + shift) % span) + span) % span) : x, sc = Math.round(xs - ax);
    if (sc < 0 || sc >= C.top.length || C.top[sc] < 0) continue;
    const foot = x < wa || x > wb, edge = foot ? 1 - wS / 120 : wS < 0.5 ? 1 : ease((x - wa) / wS) * ease((wb - x) / wS), e = a * edge;
    let top = ay + C.top[sc], bot = ay + C.bot[sc];
    const rr = foot ? 0 : Math.round(Math.sqrt(Math.max(0, 1 - e)) * 60);
    if (rr > 0) {
      let st = 0, sb = 0, n = 0;
      for (let k = -rr; k <= rr; k++) { const j = sc + k; if (j >= 0 && j < C.top.length && C.top[j] >= 0) { st += C.top[j]; sb += C.bot[j]; n++; } }
      top = ay + st / n; bot = ay + sb / n;
    }
    const LN = lineAt(x), fT = LN.c - LN.w / 2, fB = LN.c + LN.w / 2, T2 = fT + (top - fT) * e * e, B2 = fB + (bot - fB) * e;
    if (rr > 0) { ctx.fillStyle = PINK; ctx.fillRect(cx, OY + T2 * S, 1.5, Math.max(1, B2 - T2) * S); }
    else ctx.drawImage(ART, sc, C.top[sc], 1, C.bot[sc] - C.top[sc], cx, OY + T2 * S, 1.5, Math.max(1, B2 - T2) * S);
  }
}
function finalText(ctx, alpha) {
  const x = OX + LOGO.text[0] * S, y = OY + LOGO.text[1] * S;
  ctx.globalAlpha = alpha;
  ctx.drawImage(TEXT, x, y, TEXT.width * S, TEXT.height * S);
  ctx.globalAlpha = 1;
}
// the flat line, as one round-ended stroke, pulled in toward its middle to k of its length (1 = end to end)
function lineStroke(ctx, k, alpha) {
  const R = ROLL, ax = LOGO.art[0], l = ax + 9, r = ax + ART.width - 9, mid = (l + r) / 2, A = lineAt(l + 20), B = lineAt(r - 20);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = PINK;
  ctx.lineCap = 'round';
  ctx.lineWidth = ((A.w + B.w) / 2) * S;
  const hl = ((r - l) / 2) * k, cy = (A.c + B.c) / 2;
  ctx.beginPath();
  ctx.moveTo(OX + (mid - hl) * S, OY + cy * S);
  ctx.lineTo(OX + (mid + hl) * S, OY + cy * S);
  ctx.stroke();
  ctx.restore();
}
function drawOutro(ctx, name, u) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  const end = OPTS.D.len + 1.0;
  if (name === 'fade') {
    // a plain, smooth fade
    draw(ctx, 'D', end);
    ctx.fillStyle = '#000';
    ctx.globalAlpha = ease(u / 0.6);
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  } else if (name === 'tv') {
    // an old set switching off: the picture squashes to a bright line, the line to a dot, the dot winks out
    const L = outLayer(), lc = L.getContext('2d');
    draw(lc, 'D', end);
    const a = clamp(u / 0.2, 0, 1), b = clamp((u - 0.2) / 0.18, 0, 1), c = clamp((u - 0.38) / 0.22, 0, 1);
    const sy = Math.max(0.004, 1 - a * a), sx = 1 - (1 - (1 - b) ** 2) * 0.995;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(sx, sy);
    ctx.drawImage(L, -W / 2, -H / 2);
    ctx.restore();
    const glow = a * (1 - c), lw = 2 + 3 * (1 - b);
    if (glow > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,240,250,${(glow * 0.9).toFixed(3)})`;
      ctx.filter = 'blur(3px)';
      ctx.fillRect(W / 2 - (W / 2) * sx, H / 2 - lw, W * sx, lw * 2);
      ctx.filter = 'none';
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 3 + 5 * (1 - c), 0, 6.2832);
      ctx.fill();
      ctx.restore();
    }
  } else if (name === 'scatter') {
    // the reverse of the way in: the letters break back into specks that drift off, the wave sinks into a flat line, and the line
    // pulls in to nothing
    const sink = 1 - ease((u - 0.05) / 0.4), pull = ease((u - 0.45) / 0.4);
    const L = outLayer(), lc = L.getContext('2d');
    lc.clearRect(0, 0, W, H);
    if (pull <= 0) artColumns(lc, 0, sink);
    else lineStroke(lc, 1 - pull, 1);
    ctx.globalAlpha = 1 - ease((u - 0.7) / 0.2);
    ctx.drawImage(L, 0, 0);
    ctx.globalAlpha = 1;
    const p = 1 - ease(u / 0.55);
    if (p > 0) gather(ctx, p, 'scatter', OX + LOGO.text[0] * S, OY + LOGO.text[1] * S, TEXT.width * S, TEXT.height * S);
  } else if (name === 'roll') {
    // the wave sets off again, rolling right and sinking into the line as it goes; the name wipes out to the right after it; the
    // line fades
    const go = clamp(u / 0.7, 0, 1), shift = -1.4 * (ROLL.xb - ROLL.xa) * go * go * go, sink = 1 - ease(u / 0.6);
    const L = outLayer(), lc = L.getContext('2d');
    lc.clearRect(0, 0, W, H);
    artColumns(lc, shift, sink);
    ctx.globalAlpha = 1 - ease((u - 0.6) / 0.35);
    ctx.drawImage(L, 0, 0);
    ctx.globalAlpha = 1;
    const wx = ease(clamp((u - 0.1) / 0.5, 0, 1)), x = OX + LOGO.text[0] * S, w = TEXT.width * S;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + w * wx, 0, W, H);
    ctx.clip();
    finalText(ctx, 1);
    ctx.restore();
  }
}
