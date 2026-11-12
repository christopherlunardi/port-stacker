// ---------- the harbor backdrop, in layers so parts of it move (Chris 2026-11-07) ----------
// art/tools/bgsplit.py cuts the painting into: the sky (drawn here as flat sky ink), clouds that drift, the painting itself with the sky
// see-through (bg.fore), and the big crane's hook, which hangs on code-drawn cables from the pulley at the boom's tip and goes up and down.
// Everything is placed in the painting's own pixels (1659x948) and mapped onto the screen the same way drawHarbor places the painting.
const HB = { px: 240 / 948, cableX: [741, 782], pulleyY: 122, blockY: 222, hookW: 90, hookH: 168, tipY: 390 };
function harborBox() {
  const { LW, LH, ox, oy } = LAY,
    a = ART['bg.harbor'] || { w: 420, h: 240 },
    hp = 762 * HB.px,
    k = Math.max(LW / a.w, LH / a.h, LW / 2 / Math.min(hp, a.w - hp)),
    w = a.w * k; // big enough that the hook can sit mid-screen (wide screens zoom in a little)
  // slid sideways so the big crane's hook hangs in the middle of the field (Chris 2026-11-07: the intro happened left of centre), with the
  // painting still covering the screen
  const x = Math.min(-ox, Math.max(-ox + LW - w, PW / 2 - 762 * HB.px * k));
  return { x, y: -oy + (LH - a.h * k), k, w };
}
function hbP(ix, iy, b) {
  b = b || harborBox();
  return [b.x + ix * HB.px * b.k, b.y + iy * HB.px * b.k];
}
function hookTip(len) {
  return hbP(762, HB.tipY + (len || 0));
} // where a load hangs from
function drawHarborSky(alpha) {
  const { LW, LH, ox, oy } = LAY;
  pg.save();
  rect(-ox, -oy, LW, LH, C.paper);
  pg.globalAlpha = alpha;
  if (STORM()) stormSky();
  else rect(-ox, -oy, LW, LH, NIGHT() ? NIGHT_SKY : [0, 128, 0]);
  pg.restore();
}
function drawClouds(alpha) {
  // a few clouds cut from the painting, drifting left at different speeds and wrapping round (at night: stars and the moon)
  if (NIGHT()) {
    drawNightSky(alpha);
    return;
  }
  if (STORM()) {
    drawStormClouds(alpha);
    return;
  }
  const b = harborBox();
  pg.save();
  pg.globalAlpha = alpha;
  // each cloud has its own band of sky (painting px), so they never cross each other (Chris 2026-11-08); the lower, smaller ones are further off and slower
  for (const [nm, iy, x0, sp, sc, flip] of [
    ['cloud1', 8, 1080, 0.05, 1, false],
    ['cloud2', 172, 300, 0.03, 0.6, true],
    ['cloud2', 256, 510, 0.04, 1, false],
    ['cloud1', 384, 1500, 0.022, 0.72, true]
  ]) {
    const a = ART['bgparts.' + nm],
      im = IMG['bgparts.' + nm];
    if (!a || !im || !im.complete) continue;
    const w = a.w * b.k * sc,
      h = a.h * b.k * sc,
      span = b.w + w;
    let x = ((((x0 * HB.px * b.k - G.frame * sp) % span) + span) % span) - w;
    const y = b.y + iy * HB.px * b.k;
    if (flip) {
      pg.save();
      pg.translate(b.x + x + w, y);
      pg.scale(-1, 1);
      pg.drawImage(im, 0, 0, w, h);
      pg.restore();
    } else pg.drawImage(im, b.x + x, y, w, h);
  }
  pg.restore();
}
function drawHarborFore(alpha) {
  const nm = NIGHT() && ART['night.fore'] ? 'night.fore' : STORM() && ART['storm.fore'] ? 'storm.fore' : 'bg.fore',
    a = ART[nm],
    im = IMG[nm];
  if (!a || !im || !im.complete) return;
  const b = harborBox();
  pg.save();
  pg.globalAlpha = alpha;
  pg.drawImage(im, b.x, b.y, a.w * b.k, a.h * b.k);
  pg.restore();
}
// the hook and what it carries are printed faded like the painting, but solid (Chris 2026-11-09: the lifted container showed the crane and
// buildings through it): drawn at full strength on their own layer, then laid down as a paper-coloured cut-out with the faded print on top
let hookCv = null,
  hookSil = null;
function drawHook(len, sway, alpha, load) {
  const la = load && load.alpha != null ? load.alpha : null;
  if (alpha >= 0.99 || typeof document === 'undefined' || !plate) {
    drawHookRaw(len, sway, alpha, load);
    return;
  }
  const pw = plate.width,
    ph = plate.height;
  if (!hookCv) {
    hookCv = document.createElement('canvas');
    hookSil = document.createElement('canvas');
  }
  if (hookCv.width !== pw || hookCv.height !== ph) {
    hookCv.width = hookSil.width = pw;
    hookCv.height = hookSil.height = ph;
  }
  const m = pg.getTransform(),
    hc = hookCv.getContext('2d'),
    saved = pg;
  hc.setTransform(1, 0, 0, 1, 0, 0);
  hc.clearRect(0, 0, pw, ph);
  hc.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
  pg = hc;
  try {
    drawHookRaw(len, sway, 1, load && la != null ? Object.assign({}, load, { alpha: 1 }) : load);
  } finally {
    pg = saved;
  }
  const sc = hookSil.getContext('2d');
  sc.setTransform(1, 0, 0, 1, 0, 0);
  sc.globalCompositeOperation = 'copy';
  sc.drawImage(hookCv, 0, 0);
  sc.globalCompositeOperation = 'source-in';
  sc.fillStyle = ink(C.paper);
  sc.fillRect(0, 0, pw, ph);
  sc.globalCompositeOperation = 'source-over';
  pg.save();
  pg.setTransform(1, 0, 0, 1, 0, 0);
  const k = la != null ? la : 1; // a load fading in (the title) fades as a whole
  pg.globalAlpha = k;
  pg.drawImage(hookSil, 0, 0);
  pg.globalAlpha = alpha * k;
  pg.drawImage(hookCv, 0, 0);
  pg.restore();
}
// the title's reset lifts the container off the dock: it's drawn in front of the water and the dock, where the hook holds it (Chris
// 2026-11-10: drawn with the crane, in the backdrop, it snapped behind them the moment the hook took it)
let HOOK_FRONT = null;
function drawHookRaw(len, sway, alpha, load) {
  // cables from the pulley down to the hook block; len = how far below where it's painted (painting px)
  const b = harborBox(),
    im = IMG['bgparts.hook'],
    a = ART['bgparts.hook'];
  if (!im || !a || !im.complete) return;
  const top = HB.blockY + len,
    dx = sway || 0;
  pg.save();
  pg.globalAlpha = alpha;
  pg.lineCap = 'round';
  for (const cx of HB.cableX) {
    const [x1, y1] = hbP(cx, HB.pulleyY, b),
      [x2, y2] = hbP(cx + dx, top + 8, b);
    pg.beginPath();
    pg.moveTo(x1, y1);
    pg.lineTo(x2, y2);
    pg.strokeStyle = ink(C.indigo);
    pg.lineWidth = 2.3 * b.k;
    pg.stroke();
    pg.strokeStyle = ink(C.cream);
    pg.lineWidth = 0.9 * b.k;
    pg.stroke();
  }
  const [hx, hy] = hbP(718 + dx, top, b);
  pg.drawImage(im, hx, hy, a.w * b.k, a.h * b.k);
  {
    const [cx, cy] = hbP(762 + dx, top + 37, b),
      r = 22 * HB.px * b.k,
      ang = len * 0.045; // the block is a pulley: an X that turns with the cable (one way lowering, the other rising)
    pg.lineCap = 'round';
    pg.strokeStyle = ink(C.indigo);
    pg.lineWidth = 3.4 * HB.px * b.k * 1.6;
    for (const q of [ang, ang + Math.PI / 2]) {
      pg.beginPath();
      pg.moveTo(cx - Math.cos(q) * r, cy - Math.sin(q) * r);
      pg.lineTo(cx + Math.cos(q) * r, cy + Math.sin(q) * r);
      pg.stroke();
    }
    pg.beginPath();
    pg.arc(cx, cy, 5 * HB.px * b.k, 0, 7);
    pg.fillStyle = ink(C.cream);
    pg.fill();
    pg.lineWidth = 1.6 * HB.px * b.k * 1.6;
    pg.stroke();
  }
  if (load) {
    const lk = load.k || 1,
      [tx, ty] = hbP(762 + dx, HB.tipY - 14 + len, b),
      w = load.w,
      h = load.h,
      cy = ty + load.drop;
    pg.strokeStyle = ink(C.indigo);
    pg.lineWidth = 1 * b.k;
    if (!load.drop) {
      pg.beginPath();
      pg.moveTo(tx - w * 0.38, ty + 9 * lk);
      pg.lineTo(tx, ty);
      pg.lineTo(tx + w * 0.38, ty + 9 * lk);
      pg.stroke();
    }
    const ca = ART['containers.' + load.c];
    if (ca && load.front)
      HOOK_FRONT = { c: load.c, x: load.x != null ? load.x : tx, y: cy + 9 * lk + h, w, h }; // drawn later, in front (the title's reset)
    else if (ca) {
      const ax = load.x != null ? load.x : tx;
      pg.globalAlpha = load.alpha != null ? load.alpha : alpha;
      art('containers.' + load.c, ax, cy + 9 * lk + h, { sx: (w / ca.w) * (load.sx || 1), sy: (h / ca.h) * (load.sy || 1) });
    }
  }
  pg.restore();
}
function craneCycle(f) {
  // in play: lower empty, hook a container off the stacks, lift it, hold, set it back down, lift empty (about 25 s)
  const P = 1480,
    t = f % P,
    ez = k => (k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k)),
    deep = 300,
    high = -70;
  let len,
    load = null;
  if (t < 200) len = 0;
  else if (t < 440) len = deep * ez((t - 200) / 240);
  else if (t < 500) len = deep;
  else if (t < 740) len = deep + (high - deep) * ez((t - 500) / 240);
  else if (t < 940) len = high;
  else if (t < 1180) len = high + (deep - high) * ez((t - 940) / 240);
  else if (t < 1240) len = deep;
  else len = deep * (1 - ez((t - 1240) / 240));
  if (t >= 470 && t < 1210) load = { c: ['pink', 'blue', 'yel', 'orange'][((f / P) | 0) % 4], w: 33, h: 10, drop: 0 };
  const moving = (t > 200 && t < 440) || (t > 500 && t < 740) || (t > 940 && t < 1180) || t > 1240;
  return { len, load, sway: Math.sin(f * 0.021) * (moving ? 3 : 1.2) * (0.4 + Math.max(0, len) / 300) };
}
let cloudCv = null,
  foreMask = null,
  foreMaskKey = '';
function drawCloudsBehind(alpha) {
  // the clouds pass behind the crane (Chris 2026-11-07: they showed through it): the painting is printed faded, so a
  // cloud drawn under it would show through the crane; instead the clouds are drawn on their own layer and cut out wherever the painting is solid
  const a = ART['bg.fore'],
    im = IMG['bg.fore'];
  if (typeof document === 'undefined' || !plate || !a || !im || !im.complete) {
    drawClouds(alpha);
    return;
  }
  const pw = plate.width,
    ph = plate.height,
    m = pg.getTransform ? pg.getTransform() : { a: LAY.k, b: 0, c: 0, d: LAY.k, e: LAY.ox * LAY.k, f: LAY.oy * LAY.k },
    key = [pw, ph, m.a, m.e, m.f, LOOK()].join(',');
  if (!cloudCv) {
    cloudCv = document.createElement('canvas');
    foreMask = document.createElement('canvas');
  }
  if (cloudCv.width !== pw || cloudCv.height !== ph) {
    cloudCv.width = foreMask.width = pw;
    cloudCv.height = foreMask.height = ph;
    foreMaskKey = '';
  }
  const saved = pg;
  if (foreMaskKey !== key) {
    const fm = foreMask.getContext('2d');
    fm.setTransform(1, 0, 0, 1, 0, 0);
    fm.clearRect(0, 0, pw, ph);
    fm.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
    pg = fm;
    try {
      drawHarborFore(1);
    } finally {
      pg = saved;
    }
    foreMaskKey = key;
  }
  const cc = cloudCv.getContext('2d');
  cc.setTransform(1, 0, 0, 1, 0, 0);
  cc.clearRect(0, 0, pw, ph);
  cc.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
  pg = cc;
  try {
    drawClouds(alpha);
  } finally {
    pg = saved;
  }
  cc.setTransform(1, 0, 0, 1, 0, 0);
  cc.globalCompositeOperation = 'destination-out';
  cc.drawImage(foreMask, 0, 0);
  cc.globalCompositeOperation = 'source-over';
  pg.save();
  pg.setTransform(1, 0, 0, 1, 0, 0);
  pg.drawImage(cloudCv, 0, 0);
  pg.restore();
}
function drawHarborLive(alpha, crane) {
  // the whole backdrop, every layer, for screens that aren't cached (the title)
  drawHarborSky(alpha);
  drawCloudsBehind(alpha);
  drawHarborFore(alpha);
  const c = crane || craneCycle(G.frame);
  drawHook(c.len, c.sway, c.hookAlpha || alpha, c.load);
}
