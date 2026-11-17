// C: one frame. The cream score bar grows down both sides into a single frame around the stage, so the stage sits in a window instead of
// stopping at a line. The columns carry lives and horns plus things the screen doesn't show anywhere else during play: the score the
// next life comes at, the high score, the dock's name and shift, and how much of the cargo is on the ship.
function frameShape() {
  const { ox, oy } = LAY,
    cw = Math.min(ox, 80),
    r = 4,
    y1 = oy + 21,
    xa = ox,
    xb = ox + PW;
  rect(xa - cw, oy, cw + 0.4, PH, C.cream);
  rect(xb - 0.4, oy, cw + 0.4, PH, C.cream);
  rect(xa, oy, PW, 2.3, C.cream); // over the bar's own top line and end caps: the bar is part of the frame now
  rect(xa, oy, 9, 21.7, C.cream);
  rect(xb - 9, oy, 9, 21.7, C.cream);
  pg.fillStyle = ink(C.cream);
  for (const [x, d] of [
    [xa, 1],
    [xb, -1]
  ]) {
    pg.beginPath();
    pg.moveTo(x, y1);
    pg.lineTo(x, y1 + r);
    pg.quadraticCurveTo(x, y1, x + d * r, y1);
    pg.closePath();
    pg.fill();
  }
  // a soft shadow just inside the window, so the frame sits in front of the stage
  for (const [x, d] of [
    [xa, 1],
    [xb, -1]
  ]) {
    const g = pg.createLinearGradient(x, 0, x + d * 5, 0);
    g.addColorStop(0, 'rgba(255,255,0,0.3)');
    g.addColorStop(1, 'rgba(255,255,0,0)');
    pg.fillStyle = g;
    pg.fillRect(Math.min(x, x + d * 5), y1 + 1, 5, PH - 22);
  }
  pg.beginPath();
  pg.moveTo(xa, oy + PH + 2);
  pg.lineTo(xa, y1 + r);
  pg.quadraticCurveTo(xa, y1, xa + r, y1);
  pg.lineTo(xb - r, y1);
  pg.quadraticCurveTo(xb, y1, xb, y1 + r);
  pg.lineTo(xb, oy + PH + 2);
  if (ox > cw + 1) {
    pg.moveTo(xa - cw, oy - 2);
    pg.lineTo(xa - cw, oy + PH + 2);
    pg.moveTo(xb + cw, oy - 2);
    pg.lineTo(xb + cw, oy + PH + 2);
  }
  pg.lineWidth = 1.5;
  pg.lineJoin = 'round';
  pg.strokeStyle = ink(C.indigo);
  pg.stroke();
  return cw;
}
function frameRule(cx, y, w) {
  leader(cx - w / 2, cx + w / 2 + 0.1, y, C.blue);
}
// the cargo list: one small container per container in the stage, in its color; filled in once it's on the ship
function cargoPips(cx, y, w) {
  const all = G.pieces.filter(pc => !pc.gold),
    per = all.length > 12 ? 4 : 3,
    gap = 2.5,
    bw = (w - gap * (per - 1)) / per,
    bh = 6;
  all.forEach((pc, i) => {
    const x = cx - w / 2 + (i % per) * (bw + gap),
      yy = y + Math.floor(i / per) * (bh + gap),
      on = pc.state === 'plate',
      col = C[pc.type] || C.pink;
    if (on) {
      rrect(x, yy, bw, bh, 1, col, C.indigo, 0.8);
      pg.fillStyle = ink(C.indigo);
      for (let k = 1; k < 4; k++) pg.fillRect(x + (bw * k) / 4 - 0.25, yy + 1.2, 0.5, bh - 2.4);
    } else {
      pg.save();
      pg.globalAlpha = 0.45;
      rrect(x, yy, bw, bh, 1, null, C.blue, 0.8);
      pg.restore();
    }
  });
  return Math.ceil(all.length / per) * (bh + gap);
}
const ROSTER_ART = { pratt: 'pratt.stomp1', crab: 'crab.scuttle1', fork: 'forklift.drive1', gull: 'gull.stand', watch: 'watch.w1' };
SIDES.draw = pop => {
  const { ox, oy } = LAY,
    cw = frameShape(),
    cl = ox - cw / 2,
    cr = ox + PW + cw / 2,
    inW = cw - 14,
    lab = (s, x, y) => text(s, x, y, 5.6, C.blue, 'center', null, { maxW: inW, track: 0.4 }),
    big = (s, x, y, sz = 15) => text(s, x, y, sz, C.pink, 'center', C.indigo, { maxW: inW });
  // a pale tint rising from the foot of each column, the color of the water beside it
  for (const x of [ox - cw, ox + PW]) {
    const g = pg.createLinearGradient(0, oy + PH - 70, 0, oy + PH);
    g.addColorStop(0, 'rgba(0,150,0,0)');
    g.addColorStop(1, 'rgba(0,150,0,0.55)');
    pg.fillStyle = g;
    pg.fillRect(x + (x < ox ? 0 : 0.8), oy + PH - 70, cw - 0.8, 70);
  }
  // ----- left: lives and the next life, the high score, where we are
  let y = oy + 36;
  lab('LIVES', cl, y);
  popAt(cl, y + 34, pop.l, () => {
    art('buck.stand', cl - 13, y + 50, { scale: 1.25 });
    big('x' + livesNow(), cl + 13, y + 33, 15);
  });
  lifeBarAt(cl, y + 60, inW);
  text('NEXT LIFE AT ' + fmtNum(G.nextLife || 0), cl, y + 69, 4.4, C.blue, 'center', null, { maxW: inW });
  frameRule(cl, y + 82, inW);
  y = oy + 132;
  lab('HIGH SCORE', cl, y);
  const hi = Math.max(G.hi || 0, G.score || 0),
    beat = G.score > 0 && G.score >= (G.hi || 0);
  big(fmtNum(hi), cl, y + 14, 12);
  if (beat) text('NEW BEST!', cl, y + 26, 4.8, (G.frame >> 4) & 1 ? C.orange : C.pink, 'center');
  frameRule(cl, y + 38, inW);
  y = oy + 184;
  lab('NOW LOADING AT', cl, y);
  text(L.def.name, cl, y + 12, 8.5, C.indigo, 'center', null, { maxW: inW });
  const look = LOOK();
  rrect(cl - 23, y + 21, 46, 10, 3, look === 'night' ? C.indigo : look === 'storm' ? C.blue : C.yel, C.indigo, 0.9);
  text(look.toUpperCase() + ' SHIFT', cl, y + 26.2, 4.8, look === 'day' ? C.indigo : C.cream, 'center', null, { maxW: 42 });
  // ----- right: horns, the cargo, who's about
  y = oy + 36;
  lab('HORNS', cr, y);
  popAt(cr, y + 34, pop.h, () => {
    hornIcon(cr - 12, y + 33, 2.7);
    big('x' + hornsNow(), cr + 14, y + 33, 15);
  });
  frameRule(cr, y + 82, inW);
  y = oy + 132;
  lab('CARGO ON BOARD', cr, y);
  const all = G.pieces.filter(pc => !pc.gold),
    on = all.filter(pc => pc.state === 'plate').length;
  big(on + '/' + all.length, cr, y + 14, 12);
  const ph = cargoPips(cr, y + 25, inW);
  y = Math.max(oy + 214, y + 25 + ph + 6);
  frameRule(cr, y, inW);
  lab('ON THE PROWL', cr, y + 12);
  const who = [...new Set(stageRoster())].filter(t => ROSTER_ART[t]),
    step = Math.min(24, inW / Math.max(1, who.length));
  who.forEach((t, i) => {
    const a = ART[ROSTER_ART[t]],
      sc = Math.min(0.85, 24 / a.w, 26 / a.h);
    art(ROSTER_ART[t], cr + (i - (who.length - 1) / 2) * step, y + 46, { scale: sc });
  });
};
