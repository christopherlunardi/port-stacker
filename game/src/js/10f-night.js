// ---------- World 2: the night harbor (Chris 2026-11-07) ----------
// The night painting (ChatGPT) lines up with the day one, so the crane, hook and framing code is shared; this file adds what moves and glows.
// Lights are marked as lights, like Hereafter Man's haze (Chris: "marking lights as lights... a mist filter that effects lights for a glow"):
// only things that give off light glow: the town's windows and the PIER 9 neon (glows pre-blurred from the painting by nightsplit.py), the
// quay lamps, the red beacons on the cranes, and in the game the door lamps and the ship's windows. Glows are mixed in ink, so they print.
const NIGHT_SKY = [185, 250, 0],
  NIGHT_WATER = [150, 255, 0];
// how far everything that isn't a light is pulled toward the night sky's navy (Chris 2026-11-08: the night was as bright as day, so the lights
// had nothing to glow against): the backdrop a lot, the stage and characters a little (they still have to read)
const NIGHT_DIM_BG = 0.42,
  NIGHT_DIM_FIELD = 0; // (Chris 2026-11-08: the stage and characters stay as bright as by day; the backdrop a bit less dark)
function nightDim(a) {
  const { LW, LH, ox, oy } = LAY;
  pg.save();
  pg.globalAlpha = a;
  rect(-ox, -oy, LW, LH, NIGHT_SKY);
  pg.restore();
}
let NIGHT_GLOWS = []; // lights in the stage (door lamps, ship windows): drawn after the stage is dimmed, so they stay bright
function nightGlow(x, y, r, col, a) {
  const m = pg.getTransform ? pg.getTransform() : null;
  NIGHT_GLOWS.push([m, x, y, r, col, a]);
}
function flushNightGlows() {
  for (const [m, x, y, r, col, a] of NIGHT_GLOWS) {
    pg.save();
    if (m) pg.setTransform(m);
    glowAt(x, y, r, col, a);
    pg.restore();
  }
  NIGHT_GLOWS = [];
}
const NIGHT_LAMPS = [
  [423, 683],
  [718, 688],
  [990, 688],
  [1244, 683],
  [1536, 690]
]; // the quay lamps' bulbs, in the painting's pixels
const NIGHT_BEACONS = [
  [111, 16, 0],
  [779, 22, 31],
  [1385, 507, 57],
  [1532, 531, 13]
]; // the red warning lights: x, y, blink phase
const NIGHT_NEON = [791, 568, 142, 49]; // the PIER 9 sign
function glowAt(x, y, r, col, a) {
  if (a <= 0 || r <= 0) return;
  const g = pg.createRadialGradient(x, y, 0, x, y, r),
    c = col.join(',');
  g.addColorStop(0, 'rgba(' + c + ',' + a + ')');
  g.addColorStop(0.35, 'rgba(' + c + ',' + a * 0.45 + ')');
  g.addColorStop(1, 'rgba(' + c + ',0)');
  pg.fillStyle = g;
  pg.fillRect(x - r, y - r, r * 2, r * 2);
}
const STARS = (() => {
  let s = 7;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: 70 }, () => [r() * 1659, r() * 520, r(), 0.4 + r() * 1.1]);
})(); // x, y (painting px), phase, size
function drawNightSky(alpha) {
  // stars that twinkle and a moon, in the sky layer (the painting covers them where it's solid)
  const b = harborBox(),
    f = G.frame;
  pg.save();
  pg.globalAlpha = alpha;
  for (const [sx, sy, ph, sz] of STARS) {
    const [x, y] = hbP(sx, sy, b),
      tw = 0.55 + 0.45 * Math.sin(f * (0.02 + ph * 0.04) + ph * 40);
    if (tw < 0.15) continue;
    const r = sz * (0.7 + tw * 0.5);
    pg.fillStyle = ink(tw > 0.85 ? C.yel : C.cream);
    pg.beginPath();
    pg.arc(x, y, r * 0.55, 0, 7);
    pg.fill();
    if (sz > 1.1 && tw > 0.7) {
      pg.strokeStyle = ink(C.cream);
      pg.lineWidth = 0.35;
      pg.beginPath();
      pg.moveTo(x - r * 1.6, y);
      pg.lineTo(x + r * 1.6, y);
      pg.moveTo(x, y - r * 1.6);
      pg.lineTo(x, y + r * 1.6);
      pg.stroke();
    }
  }
  const mx = 240,
    my = 39,
    mr = 7.5;
  glowAt(mx, my, mr * 3, C.cream, 0.25); // the moon: a cream crescent with a soft halo, in the field's clear patch of sky between the top row's containers
  pg.beginPath();
  pg.arc(mx, my, mr, 0, 7);
  pg.fillStyle = ink(C.cream);
  pg.fill();
  pg.lineWidth = 0.8;
  pg.strokeStyle = ink(C.indigo);
  pg.stroke();
  pg.beginPath();
  pg.arc(mx + mr * 0.45, my - mr * 0.2, mr * 0.85, 0, 7);
  pg.fillStyle = ink(NIGHT_SKY);
  pg.fill();
  pg.restore();
}
function nightImg(n, a) {
  const art_ = ART['nightglow.' + n],
    im = IMG['nightglow.' + n];
  if (!art_ || !im || !im.complete || a <= 0) return;
  const b = harborBox();
  pg.save();
  pg.globalAlpha = a;
  pg.drawImage(im, b.x, b.y, 420 * b.k, 240 * b.k);
  pg.restore();
}
function neonOn(f) {
  const c = f % 900;
  return !(c > 610 && c < 660 && (c * 7) % 11 < 4) && !(c > 760 && c < 768);
} // mostly on, with a buzzy stutter now and then
function drawNightLights() {
  // over the painting and its water, behind the stage
  const b = harborBox(),
    f = G.frame;
  {
    const a = ART['nightlights.lit'],
      im = IMG['nightlights.lit'];
    if (a && im && im.complete) pg.drawImage(im, b.x, b.y, 420 * b.k, 240 * b.k);
  } // the lights themselves, crisp and at full strength over the dimmed scene
  nightImg('windows', 0.85 + 0.08 * Math.sin(f * 0.013)); // the lights as bright as before the dimming (Chris)
  const neon = neonOn(f);
  if (neon) nightImg('neon', 0.95);
  else {
    const [x, y] = hbP(NIGHT_NEON[0], NIGHT_NEON[1], b);
    pg.save();
    pg.globalAlpha = 0.8;
    rect(x, y, NIGHT_NEON[2] * HB.px * b.k, NIGHT_NEON[3] * HB.px * b.k, NIGHT_SKY);
    pg.restore();
  } // switched off: the tubes go dark
  NIGHT_LAMPS.forEach(([lx, ly], i) => {
    const [x, y] = hbP(lx, ly, b),
      fl = 1 + 0.06 * Math.sin(f * 0.07 + i * 2) + ((f + i * 97) % 431 < 3 ? -0.3 : 0); // a lamp hums and now and then dips
    glowAt(x, y, 11 * b.k * fl, C.yel, 0.42 * fl);
    glowAt(x, y + 6 * b.k, 22 * b.k, C.yel, 0.13 * fl);
  }); // the bulb, and a wide pool down the cone
  for (const [bx, by, ph] of NIGHT_BEACONS) {
    const [x, y] = hbP(bx, by, b),
      on = (f + ph * 3) % 96 < 48,
      k = on ? 1 : 0.15; // slow blink, out of step
    if (on) glowAt(x, y, 9 * b.k, [255, 40, 150], 0.55);
    pg.beginPath();
    pg.arc(x, y, 1.6 * b.k, 0, 7);
    pg.fillStyle = ink(on ? [255, 0, 120] : [190, 120, 0]);
    pg.globalAlpha = 0.6 + 0.4 * k;
    pg.fill();
    pg.globalAlpha = 1;
  }
}
function drawNightWater() {
  // dark water with the lamps and the neon laid on it as long wobbly reflections, and a few wave marks
  const { LW, LH, ox, oy } = LAY,
    top = farWaterTop(),
    bot = -oy + LH,
    x0 = -ox,
    w = LW,
    f = G.frame,
    b = harborBox();
  const g = pg.createLinearGradient(0, top - 18, 0, top);
  g.addColorStop(0, 'rgba(' + NIGHT_WATER.join(',') + ',0)');
  g.addColorStop(1, ink(NIGHT_WATER));
  pg.fillStyle = g;
  pg.fillRect(x0, top - 18, w, 18);
  rect(x0, top, w, bot - top, NIGHT_WATER);
  const refl = NIGHT_LAMPS.map(([lx]) => [hbP(lx, 0, b)[0], C.yel, 1]);
  if (neonOn(f)) refl.push([hbP(NIGHT_NEON[0] + NIGHT_NEON[2] / 2, 0, b)[0], [255, 0, 60], 1.3]);
  pg.save();
  pg.lineCap = 'round';
  refl.forEach(([cx, col, wide], i) => {
    for (let k = 0; k < 12; k++) {
      const y = top + 2 + (k * (bot - top - 4)) / 12,
        d = k / 12; // dashes that sway and break up further down
      const sway = Math.sin(f * 0.045 + k * 1.7 + i) * (1.2 + d * 2.5),
        len = (7 + Math.sin(f * 0.06 + k * 2.3 + i * 3) * 3) * wide * (1 - d * 0.35);
      pg.globalAlpha = 0.85 - d * 0.55;
      pg.strokeStyle = ink(col);
      pg.lineWidth = 1.3 - d * 0.5;
      pg.beginPath();
      pg.moveTo(cx + sway - len / 2, y);
      pg.lineTo(cx + sway + len / 2, y);
      pg.stroke();
      if (k % 3 === 1) {
        pg.globalAlpha *= 0.6;
        pg.beginPath();
        pg.moveTo(cx - sway * 1.4 - len * 0.2, y + 1.6);
        pg.lineTo(cx - sway * 1.4 + len * 0.25, y + 1.6);
        pg.stroke();
      }
    }
    pg.globalAlpha = 1;
    glowAt(cx, top + (bot - top) * 0.3, 16, col, 0.14);
  });
  pg.strokeStyle = ink(C.cream);
  for (let row = 0; row < 3; row++) {
    const y = top + 6 + (row * (bot - top - 8)) / 3,
      sp = 0.06 + row * 0.03,
      gap = 38 + row * 9;
    pg.lineWidth = 0.6 + row * 0.2;
    pg.globalAlpha = 0.25 + row * 0.08;
    for (let x = x0 - gap + ((f * sp + row * 17) % gap); x < x0 + w; x += gap) {
      const bb = Math.sin(f * 0.035 + x * 0.1 + row) * 0.7;
      pg.beginPath();
      pg.moveTo(x, y + bb);
      pg.quadraticCurveTo(x + 3 + row, y + bb - 1.4, x + 6 + row * 2, y + bb);
      pg.stroke();
    }
  }
  pg.restore();
}
