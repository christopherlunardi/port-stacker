// B: poster panels. Each side is a loud printed poster with one huge icon: Buck in a sunburst on the left with his count and the
// next-life bar, the horn in a sunburst on the right with its count. The same two icons as before, just big enough to fill the room.
// A thick rule and a drop shadow set the stage in front of the posters.
function burst(cx, cy, r0, r1, n, a0, colA, colB, x0, x1, y0, y1) {
  pg.save();
  pg.beginPath();
  pg.rect(x0, y0, x1 - x0, y1 - y0);
  pg.clip();
  rect(x0, y0, x1 - x0, y1 - y0, colB);
  pg.fillStyle = ink(colA);
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * Math.PI * 2,
      b = a + Math.PI / n;
    pg.beginPath();
    pg.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    pg.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    pg.lineTo(cx + Math.cos(b) * r1, cy + Math.sin(b) * r1);
    pg.lineTo(cx + Math.cos(b) * r0, cy + Math.sin(b) * r0);
    pg.closePath();
    pg.fill();
  }
  pg.restore();
}
function posterDisc(cx, cy, r, col) {
  pg.beginPath();
  pg.arc(cx + 1.5, cy + 1.5, r, 0, 7);
  pg.fillStyle = ink(C.indigo);
  pg.fill();
  pg.beginPath();
  pg.arc(cx, cy, r, 0, 7);
  pg.fillStyle = ink(col);
  pg.fill();
  pg.lineWidth = 1.5;
  pg.strokeStyle = ink(C.indigo);
  pg.stroke();
}
SIDES.draw = pop => {
  const { ox, oy, LW } = LAY,
    k = Math.min(1.5, ox / 64),
    cl = ox / 2,
    cr = ox + PW + ox / 2,
    cy = oy + 130,
    turn = G.frame * 0.0015;
  // the posters: slow sunbursts, pink on the left, blue on the right
  burst(cl, cy, 0, 400, 14, turn, C.pinkL, [45, 0, 0], 0, ox, oy, oy + PH);
  burst(cr, cy, 0, 400, 14, -turn, [0, 120, 0], [0, 50, 0], ox + PW, LW, oy, oy + PH);
  // lives
  const R = 23 * k,
    yR = cy - R - 9 * k,
    yN = cy + R + 20 * k;
  posterDisc(cl, cy, R, C.yel);
  popAt(cl, cy, pop.l, () => art('buck.stand', cl, cy + 19.5 * k, { scale: 1.3 * k }));
  ribbon(cl, yR - 9 * k, 32 * k, 10 * k, C.pink, 'LIVES', FONT_MAIN, 6 * k);
  popAt(cl, yN, pop.l, () => text('x' + livesNow(), cl, yN, 24 * k, C.cream, 'center', C.indigo, { maxW: ox - 12 }));
  rrect(cl - 25 * k, yN + 17 * k, 50 * k, 11 * k, 4 * k, C.cream, C.indigo, 1.2);
  lifeBarAt(cl, yN + 22.5 * k, 40 * k);
  // horns
  posterDisc(cr, cy, R, C.cream);
  popAt(cr, cy, pop.h, () => hornIcon(cr + 5 * k, cy, 3.3 * k));
  ribbon(cr, yR - 9 * k, 32 * k, 10 * k, C.blue, 'HORNS', FONT_MAIN, 6 * k);
  popAt(cr, yN, pop.h, () => text('x' + hornsNow(), cr, yN, 24 * k, C.cream, 'center', C.indigo, { maxW: ox - 12 }));
  // the stage stands in front: a shadow down each edge and a thick rule
  for (const [x, d] of [
    [ox, -1],
    [ox + PW, 1]
  ]) {
    const g = pg.createLinearGradient(x, 0, x + d * 7, 0);
    g.addColorStop(0, 'rgba(255,255,0,0.38)');
    g.addColorStop(1, 'rgba(255,255,0,0)');
    pg.fillStyle = g;
    pg.fillRect(Math.min(x, x + d * 7), oy, 7, PH);
    rect(x - 1 + (d > 0 ? 0 : 0), oy, 2, PH, C.indigo);
  }
};
