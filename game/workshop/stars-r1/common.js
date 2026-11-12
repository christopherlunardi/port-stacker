// Workshop stars round 1 (Chris 2026-11-11: "for the stun animations, the stars just sit there... use the real stars from the picture"; "the
// bird has feathers, you could animate the feathers too"): the stars (and the gull's feathers) are lifted out of each dizzy picture at load
// (the pieces not joined to the body: big enough, Pratt's, the Watchman's and the Forklift's up top), the rest is drawn as it was, and each
// option moves the lifted pieces. DIZ.move(b, i, n, t) returns {dx, dy, rot, s, back} for piece i of n (dx/dy in field px from its home).
const DIZ = { move: null, crab: false };
const DIZ_ART = { 'pratt.dizzy': 'top', 'watch.dizzy': 'top', 'forklift.dizzy': 'top', 'gull.dizzy': 'any' };
const DIZ_CUT = {};
function dizCut(name) {
  if (name in DIZ_CUT) return DIZ_CUT[name];
  const im = IMG[name];
  if (!im || !im.complete || !im.width) return null;
  const W = im.width, H = im.height, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const cx = cv.getContext('2d');
  cx.drawImage(im, 0, 0);
  const d = cx.getImageData(0, 0, W, H), A = i => d.data[i * 4 + 3] > 128, lab = new Int32Array(W * H), comps = [];
  for (let i = 0; i < W * H; i++) {
    if (!A(i) || lab[i]) continue;
    const id = comps.length + 1, st = [i], px = [];
    lab[i] = id;
    while (st.length) {
      const j = st.pop(); px.push(j);
      const x = j % W, y = (j / W) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy, k = yy * W + xx;
        if (xx >= 0 && yy >= 0 && xx < W && yy < H && !lab[k] && A(k)) { lab[k] = id; st.push(k); }
      }
    }
    comps.push(px);
  }
  const main = comps.reduce((m, c, i) => (c.length > comps[m].length ? i : m), 0), bits = [];
  comps.forEach((px, i) => {
    if (i === main || px.length < 150) return;
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (const j of px) { const x = j % W, y = (j / W) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    if (DIZ_ART[name] === 'top' && y0 > H * 0.35) return;
    const b = document.createElement('canvas');
    b.width = x1 - x0 + 1; b.height = y1 - y0 + 1;
    const bx = b.getContext('2d'), bd = bx.createImageData(b.width, b.height);
    for (const j of px) {
      const x = j % W, y = (j / W) | 0, o = ((y - y0) * b.width + (x - x0)) * 4;
      for (let c = 0; c < 4; c++) bd.data[o + c] = d.data[j * 4 + c];
      d.data[j * 4 + 3] = 0; // lifted out of the picture
    }
    bx.putImageData(bd, 0, 0);
    bits.push({ cv: b, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: b.width, h: b.height });
  });
  bits.sort((a, b) => a.cx - b.cx);
  cx.putImageData(d, 0, 0);
  return (DIZ_CUT[name] = { base: cv, bits, W, H });
}
const _diza = art;
art = function (name, x, y, o = {}) {
  if (!DIZ.move || !DIZ_ART[name]) return _diza(name, x, y, o);
  const cut = dizCut(name);
  if (!cut || !cut.bits.length) return _diza(name, x, y, o);
  const a = ART[name], sc = o.scale || 1, w = a.w * sc * (o.sx || 1), h = a.h * sc * (o.sy || 1), ax = (a.ax || 0) * sc * (o.sx || 1),
    kx = w / cut.W, ky = h / cut.H, f = o.flip ? -1 : 1, n = cut.bits.length, t = G.frame;
  const homes = cut.bits.map(b => [x + f * (-w / 2 - ax + b.cx * kx), y - h + b.cy * ky]),
    mx = homes.reduce((s, p) => s + p[0], 0) / n,
    my = homes.reduce((s, p) => s + p[1], 0) / n,
    R = Math.max(6, ...homes.map(p => Math.abs(p[0] - mx)));
  const piece = (b, i, back) => {
    const [hx, hy] = homes[i],
      m = DIZ.move(b, i, n, t, { ox: hx - mx, oy: hy - my, R }) || {};
    if (!!m.back !== back) return;
    pg.save();
    pg.translate(hx + (m.dx || 0), hy + (m.dy || 0));
    if (m.rot) pg.rotate(m.rot);
    const s = m.s || 1;
    pg.scale(f * s, s);
    if (m.alpha != null) pg.globalAlpha = m.alpha;
    pg.drawImage(b.cv, (-b.w * kx) / 2, (-b.h * ky) / 2, b.w * kx, b.h * ky);
    pg.restore();
  };
  cut.bits.forEach((b, i) => piece(b, i, true));
  const keep = IMG[name];
  IMG[name] = cut.base;
  IMG[name].complete = true;
  _diza(name, x, y, o);
  IMG[name] = keep;
  cut.bits.forEach((b, i) => piece(b, i, false));
};
