// A: dockside. The harbor painting stays, and the dock itself carries on past the stage: a little pier on each side, built from the
// same catwalk and posts as the stage, standing in the same water. The crew shelter on the left holds one Buck per life waiting for
// his turn (the next-life bar hangs under the pier); the horn locker on the right holds one horn per horn. A line of flags runs from
// each pier's mast to the stage, tying the three together. Up to five of each, then four and a +N tag.
function shelter(cx, base, w, h, roofCol, label) {
  const x = cx - w / 2,
    top = base - h;
  rect(x + 2.5, top + 4, w, h - 4, C.indigo); // its shadow on the painting
  rrect(x, top + 3, w, h - 3, 1, C.cream, C.indigo, 1.1); // the back wall
  pg.fillStyle = ink(C.sky);
  for (let px = x + 5; px < x + w - 2; px += 5) pg.fillRect(px, top + 9, 0.6, h - 10); // planks
  rrect(x - 0.5, top + 3, 3.4, h - 3, 1, C.pink, C.indigo, 0.8);
  rrect(x + w - 2.9, top + 3, 3.4, h - 3, 1, C.pink, C.indigo, 0.8);
  rrect(x - 2, top - 4, w + 4, 9, 2, roofCol, C.indigo, 1.2); // the roof and its sign
  textF(FONT_MAIN, label, cx, top + 0.7, 5.4, C.cream, 'center', C.indigo, { track: 0.5 });
}
function plusTag(x, y, n) {
  rrect(x - 8, y - 5.5, 16, 11, 3, C.yel, C.indigo, 1);
  textF(FONT_MAIN, '+' + n, x, y + 0.2, 7, C.indigo, 'center', null, { maxW: 13 });
}
function pier(x0, x1, y) {
  for (let x = x0 + 7; x < x1 - 3; x += 17) post(x, y + 3, LAY.oy + PH + 2);
  post(x1 - 4, y + 3, LAY.oy + PH + 2);
  girder(y, x0 - 2, x1);
}
function flagLine(xa, ya, xb, yb, sag, n) {
  const pt = t => [xa + (xb - xa) * t, ya + (yb - ya) * t + Math.sin(t * Math.PI) * sag];
  pg.beginPath();
  for (let i = 0; i <= 20; i++) pg.lineTo(...pt(i / 20));
  pg.lineWidth = 0.8;
  pg.strokeStyle = ink(C.indigo);
  pg.stroke();
  const cols = [C.pink, C.yel, C.blue, C.cream];
  for (let i = 0; i < n; i++) {
    const [x, y] = pt((i + 0.5) / n),
      w = 2.6,
      sw = Math.sin(G.frame * 0.05 + i * 1.3) * 0.7;
    pg.beginPath();
    pg.moveTo(x - w, y);
    pg.lineTo(x + w, y);
    pg.lineTo(x + sw, y + 6.5);
    pg.closePath();
    pg.fillStyle = ink(cols[i % cols.length]);
    pg.fill();
    pg.lineWidth = 0.7;
    pg.lineJoin = 'round';
    pg.stroke();
  }
}
function mast(x, base, top) {
  rrect(x - 1.3, top, 2.6, base - top, 1, C.pink, C.indigo, 0.8);
  pg.beginPath();
  pg.arc(x, top - 1.5, 2.4, 0, 7);
  pg.fillStyle = ink(C.yel);
  pg.fill();
  pg.lineWidth = 0.8;
  pg.strokeStyle = ink(C.indigo);
  pg.stroke();
}
SIDES.draw = pop => {
  const { ox, oy, LW } = LAY,
    qy = oy + 240,
    wide = Math.min(ox - 6, 86),
    sw = Math.min(wide - 6, 60),
    sh = 46,
    xl = ox - 6 - wide / 2 - 0.5, // the middle of each pier (each ends a little short of the stage, where the ship ties up)
    xr = ox + PW + 6 + wide / 2 + 0.5,
    topY = oy + 23;
  // masts and flags first, behind the shelters
  const ml = ox - 6 - wide + 5,
    mr = ox + PW + 6 + wide - 5;
  mast(ml, qy, oy + 96);
  mast(mr, qy, oy + 96);
  flagLine(ml, oy + 96, ox + 1, topY, 16, 7);
  flagLine(mr, oy + 96, ox + PW - 1, topY, 16, 7);
  // ----- the crew shelter: a Buck per life
  shelter(xl, qy, sw, sh, C.pink, 'CREW');
  const n = livesNow(),
    show = n > 5 ? 4 : n,
    slots = show + (n > 5 ? 1 : 0),
    gap = Math.min(15.5, (sw - 20) / Math.max(1, slots - 1));
  for (let i = 0; i < show; i++) {
    const x = xl + (i - (slots - 1) / 2) * gap,
      last = i === show - 1 && n <= 5,
      bob = Math.sin(G.frame * 0.06 + i * 2.1) > 0.92 ? -0.6 : 0;
    art('buck.stand', x, qy + bob, { scale: 0.77 * (last ? pop.l : 1) });
  }
  if (n > 5) popAt(xl + ((slots - 1) / 2) * gap, qy - 12, pop.l, () => plusTag(xl + ((slots - 1) / 2) * gap, qy - 12, n - 4));
  // ----- the horn locker: a horn per horn, on pegs
  shelter(xr, qy, sw, sh, C.blue, 'HORNS');
  const h = hornsNow(),
    hshow = h > 6 ? 5 : h;
  for (let i = 0; i < hshow + (h > 6 ? 1 : 0); i++) {
    const x = xr + ((i % 3) - 1) * Math.min(15.5, (sw - 20) / 2) - 0.5,
      y = qy - sh + 18 + Math.floor(i / 3) * 14.5;
    rect(x - 0.4, y - 6.5, 0.8, 3, C.indigo); // its peg
    if (i < hshow) hornIcon(x + 1.2, y, 1.55 * (i === hshow - 1 && h <= 6 ? pop.h : 1));
    else popAt(x, y, pop.h, () => plusTag(x, y, h - 5));
  }
  pier(ox - 6 - wide, ox - 6, qy);
  pier(ox + PW + 6, ox + PW + 6 + wide, qy);
  // the next-life bar on a plate under the crew's pier
  rrect(xl - 24, qy + 9, 48, 9, 3, C.cream, C.indigo, 1);
  lifeBarAt(xl, qy + 13.5, 38);
  sideWater();
};
