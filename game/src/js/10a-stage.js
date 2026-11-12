// ---------- the stage and the harbor behind it: catwalks, ladders, doors, the backdrop painting, mist, water, containers and their lamps ----------
// ---------- the stage ----------
function girder(y, a, b) {
  // a yellow riveted catwalk, feet on its top edge
  rrect(a, y, b - a, 5, 1, C.yel, C.indigo, 0.9);
  rect(a + 0.5, y + 3.6, b - a - 1, 1, C.yelD);
  pg.fillStyle = ink(C.indigo);
  for (let x = a + 4; x < b - 2; x += 8) {
    pg.beginPath();
    pg.arc(x, y + 2, 0.7, 0, 7);
    pg.fill();
  }
}
function post(x, y0, y1) {
  rrect(x - 2.5, y0, 5, y1 - y0, 1, C.pink, C.indigo, 0.8);
  pg.fillStyle = ink(C.indigo);
  for (let y = y0 + 4; y < y1 - 2; y += 7) {
    pg.beginPath();
    pg.arc(x, y, 0.6, 0, 7);
    pg.fill();
  }
}
function ladder(x, y0, y1) {
  for (const rx of [x - 5, x + 5]) rrect(rx - 1.2, y0 - 2, 2.4, y1 - y0 + 2, 1, C.pink, C.indigo, 0.7);
  for (let y = y0 + 3; y < y1; y += 4.5) rrect(x - 4, y - 0.7, 8, 1.6, 0.5, C.cream, C.indigo, 0.6);
}
function drawDoors(front) {
  // the roll-up doors at the top corners, standing on the top catwalk (Chris 2026-11-07): three lamps on the header light
  // one by one as an enemy gets close, then flash and the shutter shakes; it rolls up, the enemy steps out, it rolls down. front: the shutter
  // and header drawn again over an enemy still in the doorway, so it's hidden until the shutter has gone up past it
  if (!L || !L.def.doors) return;
  const warn = PLAYING() ? spawnWarn() : [];
  L.def.spawns.forEach((s, i) => {
    const d = doorRect(i),
      inside = G.enemies.some(e => e.door === i && e.state === 'spawn');
    if (front && !inside) return;
    const w = warn.filter(q => q.at.door === i).sort((a, b) => a.t - b.t)[0],
      open = (L.doorOpen && L.doorOpen[i]) || 0,
      H = DOOR_H - 4,
      top = d.top + 4;
    const shake = w && w.t < 36 ? Math.sin(G.frame * 2.1) * 0.6 : 0,
      x = d.x + 2;
    if (!front) {
      rrect(d.x, d.top, DOOR_W, DOOR_H + 1, 1.5, C.blue, C.indigo, 1.2);
      rect(x, top, DOOR_W - 4, H, C.indigo); // frame and the dark inside
      rect(x + 1, top + 2, DOOR_W - 6, 1.2, C.blueD || C.blue);
    }
    const sh = H * (1 - open); // the shutter, rolled down to sh
    if (sh > 0.5) {
      pg.save();
      pg.beginPath();
      pg.rect(x, top, DOOR_W - 4, sh);
      pg.clip();
      rect(x + shake, top, DOOR_W - 4, sh, C.blueD || C.blue);
      for (let y = top + sh - 3; y > top; y -= 3) rect(x + shake, y, DOOR_W - 4, 0.9, C.indigo);
      pg.restore();
      for (let k = 0; k < DOOR_W - 4; k += 4) {
        pg.beginPath();
        pg.moveTo(x + shake + k, top + sh - 2.2);
        pg.lineTo(x + shake + k + 2, top + sh - 2.2);
        pg.lineTo(x + shake + k + 4, top + sh);
        pg.lineTo(x + shake + k + 2, top + sh);
        pg.fillStyle = ink(C.yel);
        pg.fill();
      } // hazard stripes on its bottom bar
      rect(x + shake, top + sh - 0.6, DOOR_W - 4, 0.8, C.indigo);
    }
    if (open > 0) rrect(x - 0.5, top - 0.5, DOOR_W - 3, 2.6 + open * 1.4, 1.2, C.blueD || C.blue, C.indigo, 0.7); // the roll at the top
    rrect(d.x, d.top, DOOR_W, 5, 1.5, C.indigo); // the header with its three lamps
    const lit = w ? Math.min(3, Math.floor(w.k * 4)) : 0,
      flash = w && w.t < 36,
      on = flash ? (G.frame >> 2) & 1 : 1;
    for (let k = 0; k < 3; k++) {
      const lx = d.x + 6 + k * 6,
        isOn = flash ? on : k < lit;
      if (isOn && NIGHT()) nightGlow(lx, d.top + 2.5, 9, flash ? C.pink : C.yel, 0.6); // at night the lamps light up the wall
      if (isOn) {
        pg.save();
        pg.globalAlpha = 0.35;
        pg.beginPath();
        pg.arc(lx, d.top + 2.5, 3.6, 0, 7);
        pg.fillStyle = ink(flash ? C.pink : C.yel);
        pg.fill();
        pg.restore();
      }
      pg.beginPath();
      pg.arc(lx, d.top + 2.5, 1.5, 0, 7);
      pg.fillStyle = ink(isOn ? (flash ? C.pink : C.yel) : C.blue);
      pg.fill();
    }
    if (front && stageCanvas) {
      // the shutter just covered the enemy in the doorway; lay the catwalks and ladders back over it, so the door stays behind them
      pg.save();
      pg.beginPath();
      pg.rect(d.x, d.top, DOOR_W, 4 + Math.max(sh, 2.6 + open * 1.4) + 0.5);
      pg.clip();
      pg.setTransform(1, 0, 0, 1, 0, 0);
      pg.drawImage(stageCanvas, 0, 0);
      pg.restore();
    }
  });
}
function drawCrabWarnings() {
  // a crab about to drop in: a shadow on the catwalk where he'll land, growing and darkening as he nears
  if (!PLAYING()) return;
  for (const w of spawnWarn()) {
    if (!w.at.crab || w.k < 0.2) continue;
    const k = (w.k - 0.2) / 0.8;
    pg.save();
    pg.globalAlpha = 0.25 + k * 0.4;
    pg.beginPath();
    pg.ellipse(w.at.x, w.at.y + 0.5, 3 + k * 9, 1 + k * 1.8, 0, 0, 7);
    pg.fillStyle = ink(C.indigo);
    pg.fill();
    pg.restore();
  }
}
function drawHarbor() {
  // ChatGPT's harbor painting behind everything, covering the whole screen (16:9 screens see more of it)
  const a = ART['bg.harbor'],
    im = IMG['bg.harbor'];
  if (!a || !im || !im.complete) {
    rect(-LAY.ox, -LAY.oy, LAY.LW, LAY.LH, C.paper);
    return;
  }
  const { LW, LH, ox, oy } = LAY,
    s = harborBox().k,
    w = a.w * s,
    h = a.h * s;
  pg.save();
  rect(-ox, -oy, LW, LH, C.paper);
  pg.globalAlpha = DEV.bgInk != null ? DEV.bgInk : BG_INK;
  pg.drawImage(im, harborBox().x, -oy + (LH - h), w, h);
  pg.restore(); // printed paler so the stage and characters pop
}
const BG_INK = 0.5,
  BG_INK_NIGHT = 1,
  BG_INK_STORM = 0.8,
  BG_ALPHA = () => (DEV.bgInk != null ? DEV.bgInk : NIGHT() ? BG_INK_NIGHT : STORM() ? BG_INK_STORM : BG_INK);
/* the night is printed nearly full strength, so it reads dark */ let foreCanvas = null,
  foreLive = false; // how much ink the backdrop gets (1 = as painted); mono = printed in blue only
function drawStageBG() {
  // the catwalks and ladders (cached on their own layer, over the mist); the doors are drawn live (drawDoors)
  const ys = L.def.floors.map(f => rowY(f[0]));
  for (const x of [3, PW - 3]) post(x, ys[0], ys[ys.length - 1] + 5);
  for (const l of L.ladders) ladder(l.x, l.top, l.bot);
  for (const [r, a, b] of L.def.floors) girder(rowY(r), a * T, (b + 1) * T);
}
const MIST = [
  [150, 30, 0.13, 0.75],
  [184, 24, -0.08, 0.6],
  [112, 22, 0.06, 0.5],
  [74, 18, -0.04, 0.38]
]; // y, height, speed (px/frame), strength
let fogStrip = null;
function makeFog() {
  if (typeof document === 'undefined') return null;
  const W = 512,
    H = 48,
    c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  let s = 11;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 70; i++) {
    const cx = r() * W,
      cy = H / 2 + (r() - 0.5) * H * 0.45,
      rx = 40 + r() * 110,
      ry = 2.5 + r() * 6,
      a = 0.06 + r() * 0.12;
    for (const ox of [-W, 0, W]) {
      x.save();
      x.translate(cx + ox, cy);
      x.scale(rx, ry);
      const g = x.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0, 'rgba(0,0,0,' + a + ')');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g;
      x.beginPath();
      x.arc(0, 0, 1, 0, 7);
      x.fill();
      x.restore();
    }
  }
  return c;
}
function drawMist() {
  drawFarWater();
  if (!fogStrip) fogStrip = makeFog();
  if (!fogStrip) return;
  const { LW, ox } = LAY,
    night = NIGHT() ? 0.35 : 1;
  for (let i = 0; i < MIST.length; i++) {
    const [y, h, sp, a] = MIST[i],
      fade = Math.max(0, Math.min(1, (farWaterTop() - 24 - y) / 50));
    if (!fade) continue; // gone well above the water
    const w = ((h * 512) / 48) * 1.6,
      yy = y + Math.sin(G.frame * 0.006 + i * 2) * 2;
    let x = -ox - ((((G.frame * sp + i * 173) % w) + w) % w);
    pg.save();
    pg.globalAlpha = a * fade * night;
    for (; x < -ox + LW; x += w) pg.drawImage(fogStrip, x, yy - h / 2, w, h);
    pg.restore();
  }
}
function farWaterTop() {
  const a = ART['bg.harbor'];
  if (!a) return 205;
  const { LW, LH, oy } = LAY,
    sc = harborBox().k,
    h = a.h * sc;
  return -oy + LH - h + h * 0.835;
}
function drawFarWater() {
  if (NIGHT()) {
    drawNightWater();
    return;
  } // the harbor painting's water is covered with clean, unfaded water (so it reads as close, Chris 2026-11-07), with a soft
  // blend above it, and only slow moving wave marks on it (the painting's own marks are covered)
  const { LW, LH, ox, oy } = LAY,
    top = farWaterTop(),
    bot = -oy + LH,
    x0 = -ox,
    w = LW;
  const g = pg.createLinearGradient(0, top - 26, 0, top);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  const storm = STORM(),
    wcol = storm ? [120, 230, 0] : [0, 200, 0]; // the storm's water is darker and choppier (Chris 2026-11-09)
  g.addColorStop(1, ink(wcol));
  pg.fillStyle = g;
  pg.fillRect(x0, top - 26, w, 26);
  rect(x0, top, w, bot - top, wcol);
  pg.save();
  pg.strokeStyle = ink(C.cream);
  pg.lineCap = 'round';
  for (let row = 0; row < 4; row++) {
    const y = top + 4 + (row * (bot - top - 6)) / 4,
      sp = (0.08 + row * 0.04) * (storm ? 3.2 : 1),
      gap = (24 + row * 7) * (storm ? 0.8 : 1);
    pg.lineWidth = 0.7 + row * 0.25;
    pg.globalAlpha = 0.5 + row * 0.12;
    for (let x = x0 - gap + ((G.frame * sp + row * 13) % gap); x < x0 + w; x += gap) {
      const b = Math.sin(G.frame * (storm ? 0.11 : 0.035) + x * 0.1 + row) * (storm ? 1.8 : 0.7);
      pg.beginPath();
      pg.moveTo(x, y + b);
      pg.quadraticCurveTo(x + 3 + row, y + b - 1.5 - row * 0.3, x + 6 + row * 2, y + b);
      pg.stroke();
    }
  }
  pg.restore();
}
function drawContainer(pc, sx = 0) {
  const b = pc.bounce > 0 ? Math.sin((pc.bounce / 8) * Math.PI) : 0,
    x = pc.x + sx,
    y = pc.y,
    W = PIECE_W * T,
    H = PIECEDEF[pc.type].h;
  const sqy = 1 - b * 0.12,
    sqx = 1 + b * 0.04;
  if (pc.gold && !goldVisible(pc)) return;
  artHolo = pc.gold ? 2 : 0; // the power crate: its holographic look, all foil (10g-actors)
  art('containers.' + pc.type, x + W / 2, y, {
    sx: (sqx * W) / ART['containers.' + pc.type].w,
    sy: (sqy * H) / ART['containers.' + pc.type].h
  });
  artHolo = 0;
  if (pc.gold) rrect(x + W * (1 - sqx) * 0.5, y - H * sqy, W * sqx, H * sqy, 1.5, null, C.indigo, 1); // its edge, crisp over the foil
  if (pc.state === 'rest')
    for (let i = 0; i < PANELS; i++) {
      // a lamp on top of each panel: lit once walked across
      const on = pc.segs[i];
      pc.litT = pc.litT || [];
      if (on && pc.litT[i] == null) pc.litT[i] = G.frame;
      if (!on) pc.litT[i] = null; // when it lit, for the animations
      drawLamp(pc, i, x + ((i + 0.5) * W) / PANELS, y - H, x + (i * W) / PANELS, W / PANELS, H, on, on ? G.frame - pc.litT[i] : -1);
    }
}
// the container lamps (Chris's pick, Workshop lamps round 1, 2026-11-08: D, the work light, with C's marquee chase): a caged work lamp on each
// panel; walking across it flickers on and pours a soft cone of light down over the panel, and the lit lamps on a container chase brightness
// along the row like theatre lights
function drawLamp(pc, i, lx, top, px, pw, H, on, age) {
  // age: frames since it lit (-1: not lit)
  const wave = on ? 0.5 + 0.5 * Math.sin(G.frame * 0.12 - i * 1.4) : 0,
    fl = !on ? 0 : age < 12 ? (age % 4 < 2 ? 0.4 : 1) : 0.75 + 0.25 * wave;
  if (on) {
    const g = pg.createLinearGradient(0, top, 0, top + H),
      c = C.yel.join(',');
    g.addColorStop(0, 'rgba(' + c + ',' + 0.6 * fl + ')');
    g.addColorStop(1, 'rgba(' + c + ',0)');
    pg.fillStyle = g;
    pg.beginPath();
    pg.moveTo(lx - 2.5, top);
    pg.lineTo(lx + 2.5, top);
    pg.lineTo(px + pw - 1.5, top + H - 1);
    pg.lineTo(px + 1.5, top + H - 1);
    pg.closePath();
    pg.fill();
    glowAt(lx, top - 1.6, 5 + 3 * fl, C.yel, 0.55 * fl);
  }
  // (Chris 2026-11-10, from the new-player review: a lit lamp was hard to see, yellow on a yellow or orange container) a lit lamp is a
  // bit bigger, with a white-hot middle and a brighter halo, so a half-walked container reads at a glance
  if (on) glowAt(lx, top - 1.8, 8 + 3 * fl, C.cream, 0.7 * fl);
  if (on) rrect(lx - 3.6, top - 4, 7.2, 3.8, 1.2, C.yel, C.indigo, 0.7);
  else rrect(lx - 3, top - 3.4, 6, 3.2, 1, C.blue, C.indigo, 0.6);
  if (on) rrect(lx - 2.2, top - 3.2, 4.4, 1.6, 0.8, C.cream);
  pg.strokeStyle = ink(C.indigo);
  pg.lineWidth = 0.45;
  pg.beginPath();
  pg.moveTo(lx - 1, top - 3.4);
  pg.lineTo(lx - 1, top - 0.2);
  pg.moveTo(lx + 1, top - 3.4);
  pg.lineTo(lx + 1, top - 0.2);
  pg.stroke(); // the cage
  if (on && wave > 0.85 && age >= 12) {
    pg.beginPath();
    pg.arc(lx + 1.8, top - 2.6, 0.8, 0, 7);
    pg.fillStyle = ink(C.cream);
    pg.fill();
  } // the chase's bright moment
  if (on && NIGHT()) nightGlow(lx, top - 1.2, 9, C.yel, 0.35 + 0.25 * fl); // a lit lamp is a light
}
function shipOffset() {
  if (G.state === 'intro') {
    const k = Math.max(0, 1 - G.t / 90);
    return -340 * k * k;
  }
  if (G.state === 'clear') {
    const k = Math.max(0, (G.t - 70) / 140);
    return 380 * k * k;
  }
  return 0;
}
