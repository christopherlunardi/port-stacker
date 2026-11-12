// ---------- shift 3: the STORM SHIFT, a stormy harbor at dusk (Chris 2026-11-09) ----------
// ChatGPT's dusk painting lines up with the day and night ones; stormsplit.py cut its striped sky out (Chris: the stripes were lame), so the
// sky here is drawn smooth, top to horizon, and printed by the riso pass like everything else. Storm clouds drift across it, rain falls over
// the harbor, and every so often lightning forks down behind the crane and flashes the whole dock, with thunder a moment later.
// Lights (windows, the quay lamps' cones, the red beacons) are their own layer, laid on top so they read; the sign on the warehouse says
// which dock this is. Sounds come from stormTick (update), never from drawing.
const STORM_SKY = [
  [0, [215, 250, 0]], // deep indigo over the stage, so the pink crane and the containers stand out
  [300, [225, 215, 0]],
  [470, [240, 150, 0]], // purple
  [560, [255, 60, 0]], // the sunset only low down, behind the skyline: pink,
  [620, [190, 0, 140]],
  [655, [120, 0, 255]], // orange,
  [690, [20, 0, 255]] // and a last strip of yellow at the horizon
];
const STORM_LAMPS = [
  [442, 688],
  [720, 688],
  [1246, 688]
]; // the quay lamps' bulbs, in the painting's pixels
const STORM_SIGN = { x: 857, y: 587, text: 'DOCK 3' }; // the blank board on the warehouse roof
function stormSky() {
  const { LW, LH, ox, oy } = LAY,
    b = harborBox(),
    y0 = hbP(0, 0, b)[1],
    y1 = hbP(0, 948, b)[1],
    g = pg.createLinearGradient(0, y0, 0, y1);
  for (const [py, c] of STORM_SKY) g.addColorStop(py / 948, ink(c));
  g.addColorStop(1, ink(STORM_SKY[STORM_SKY.length - 1][1]));
  pg.fillStyle = g;
  pg.fillRect(-ox, -oy, LW, LH);
}
// the clouds (Chris 2026-11-09: the shapes from ChatGPT's first storm painting, in greys): cut from its open sky right of the crane
// (stormsplit.py), laid right of the hook and mirrored, a little lower, to its left; they sway slowly to and fro and darken as they're lit
const STORM_DIM = [150, 170, 130], // the grey the storm's backdrop is washed toward
  STORM_DIM_A = 0.5;
function stormDim() {
  const { LW, LH, ox, oy } = LAY;
  pg.save();
  pg.globalAlpha = STORM_DIM_A;
  rect(-ox, -oy, LW, LH, STORM_DIM);
  pg.restore();
}
function drawStormClouds(alpha) {
  const b = harborBox(),
    u = HB.px * b.k,
    flash = stormFlash(),
    a = ART['stormclouds.band'],
    im = IMG['stormclouds.band'];
  pg.save();
  pg.globalAlpha = alpha;
  boltDraw(b, u, flash); // the bolt is far off, behind the clouds
  if (a && im && im.complete) {
    const sw = Math.sin(G.frame * 0.0021) * 30, // painting px
      w = 819 * u,
      h = 560 * u;
    const [rx, ry] = hbP(840 + sw, 0, b);
    pg.drawImage(im, rx, ry, w, h);
    const [lx, ly] = hbP(840 - 819 - sw * 0.6, 34, b);
    pg.save();
    pg.translate(lx + w, ly);
    pg.scale(-1, 1);
    pg.drawImage(im, 0, 0, w, h);
    pg.restore();
    if (flash > 0.3) {
      pg.globalAlpha = alpha * (flash - 0.3) * 0.7;
      rect(-LAY.ox, ry, LAY.LW, h, C.cream); // lit from inside
    }
  }
  pg.restore();
}
// lightning: when, where and how bright; kept on G so a stage restart clears it
function stormTick() {
  const s = G.storm || (G.storm = { next: G.frame + 240, age: 999, x: 1200, seed: 7 });
  s.age++;
  if (G.frame >= s.next && ['play', 'intro', 'clear', 'dying', 'howto'].includes(G.state)) {
    s.seed = (s.seed * 16807) % 2147483647;
    const r = s.seed / 2147483647;
    s.age = 0;
    s.x = 900 + r * 700; // out over the water, right of the crane
    s.next = G.frame + 420 + Math.floor(r * 540); // every 7 to 16 seconds
    s.thunder = G.frame + 14 + Math.floor(r * 20);
  }
  if (s.thunder === G.frame) SFX.thunder();
}
function stormFlash() {
  const a = G.storm ? G.storm.age : 999;
  return a < 3 ? 1 : a < 6 ? 0.25 : a < 9 ? 0.75 : a < 34 ? 0.75 * (1 - (a - 9) / 25) : 0;
}
function boltDraw(b, u, flash) {
  if (flash <= 0.2 || !G.storm) return;
  const s = G.storm;
  let px = s.x,
    py = 60,
    k = s.seed;
  pg.save();
  pg.lineCap = 'round';
  pg.lineJoin = 'round';
  pg.beginPath();
  pg.moveTo(...hbP(px, py, b));
  while (py < 560) {
    k = (k * 16807) % 2147483647;
    px += ((k / 2147483647) * 2 - 1) * 60;
    py += 50 + (k % 30);
    pg.lineTo(...hbP(px, py, b));
  }
  pg.lineWidth = 7 * u;
  pg.strokeStyle = ink(C.indigo);
  pg.stroke();
  pg.lineWidth = 3.5 * u;
  pg.strokeStyle = ink(C.yel);
  pg.stroke();
  pg.lineWidth = 1.4 * u;
  pg.strokeStyle = ink(C.cream);
  pg.stroke();
  pg.restore();
}
function drawStormBack() {
  // over the painting, behind the stage: the lights, the sign's words, the rain
  const b = harborBox(),
    u = HB.px * b.k,
    f = G.frame;
  {
    const a = ART['stormlights.lit'],
      im = IMG['stormlights.lit'];
    if (a && im && im.complete) pg.drawImage(im, b.x, b.y, a.w * b.k, a.h * b.k);
  }
  STORM_LAMPS.forEach(([lx, ly], i) => {
    const [x, y] = hbP(lx, ly, b),
      fl = 1 + 0.08 * Math.sin(f * 0.09 + i * 2) + ((f + i * 131) % 377 < 4 ? -0.4 : 0); // the wind rocks the lamps; now and then one dips
    glowAt(x, y, 10 * b.k * fl, C.yel, 0.38 * fl);
  });
  {
    const [x, y] = hbP(STORM_SIGN.x, STORM_SIGN.y, b);
    textF(FONT_MAIN, STORM_SIGN.text, x, y, 26 * u, C.cream, 'center', C.indigo);
  }
  // rain: long thin slanted streaks, two speeds (near and far), wrapping round the screen
  const { LW, LH, ox, oy } = LAY;
  pg.save();
  pg.lineCap = 'round';
  for (const [n, sp, len, wid, col, al] of [
    [70, 5.2, 9, 0.5, C.sky, 0.45],
    [40, 7.5, 14, 0.7, C.cream, 0.4]
  ]) {
    pg.globalAlpha = al;
    pg.strokeStyle = ink(col);
    pg.lineWidth = wid;
    pg.beginPath();
    for (let i = 0; i < n; i++) {
      const hx = (i * 7919) % 997,
        hy = (i * 4513) % 991,
        x = -ox + (((((hx / 997) * (LW + 40) - f * sp * 0.35) % (LW + 40)) + LW + 40) % (LW + 40)) - 20,
        y = -oy + (((((hy / 991) * (LH + 40) + f * sp) % (LH + 40)) + LH + 40) % (LH + 40)) - 20;
      pg.moveTo(x, y);
      pg.lineTo(x - len * 0.35, y + len);
    }
    pg.stroke();
  }
  pg.restore();
}
function drawStormFlash() {
  // over everything on the stage: the dock goes white for an instant
  const fl = stormFlash();
  if (fl <= 0) return;
  const { LW, LH, ox, oy } = LAY;
  pg.save();
  pg.globalAlpha = fl * 0.32;
  rect(-ox, -oy, LW, LH, C.cream);
  pg.restore();
}
