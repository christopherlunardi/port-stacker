// C: steel towers. The painting at the sides is washed pale (so the stage stands out and doesn't look cut off), and a pink steel tower
// stands in each, like the stage's own frame, down into the water. Lives hang on the left tower in round yellow plates, a Buck in each,
// with the next-life bar on a plate under them; horns on the right tower. Up to six, then +N.
SIDES.draw = pop => {
  const { ox, oy } = LAY;
  sideWash();
  const tower = (cx, n, icon, s, bar) => {
    const tw = Math.min(ox - 26, 30),
      y0 = oy + 4,
      y1 = oy + PH - 2;
    // the legs and their cross braces
    pg.lineWidth = 1.2;
    pg.strokeStyle = ink(C.yel);
    pg.beginPath();
    for (let y = y0; y < y1 - 12; y += 16) {
      pg.moveTo(cx - tw / 2, y);
      pg.lineTo(cx + tw / 2, y + 16);
      pg.moveTo(cx + tw / 2, y);
      pg.lineTo(cx - tw / 2, y + 16);
    }
    pg.stroke();
    for (const x of [cx - tw / 2, cx + tw / 2]) rrect(x - 2.5, y0, 5, y1 - y0, 1.5, C.pink, C.indigo, 1);
    for (let y = y0 + 8; y < y1; y += 16) for (const x of [cx - tw / 2, cx + tw / 2]) rect(x - 0.7, y - 0.7, 1.4, 1.4, C.indigo);
    rrect(cx - tw / 2 - 5, y0 - 2, tw + 10, 6, 2, C.pink, C.indigo, 1); // the cap
    const r = iconRun(n, 6),
      ys = i => oy + 46 + i * 26;
    pg.save();
    pg.translate(cx, oy + 110);
    pg.scale(s, s);
    pg.translate(-cx, -(oy + 110));
    const slots = Math.max(1, r.show + (r.more ? 1 : 0));
    for (let i = 0; i < slots; i++) {
      pg.beginPath();
      pg.arc(cx, ys(i), 11, 0, 7);
      pg.fillStyle = ink(C.yel);
      pg.fill();
      pg.lineWidth = 1.2;
      pg.strokeStyle = ink(C.indigo);
      pg.stroke();
      if (i < r.show) icon(cx, ys(i));
      else textF(FONT_MAIN, r.more ? '+' + r.more : '0', cx, ys(i), 9, C.pink, 'center', C.indigo);
    }
    pg.restore();
    if (bar) {
      rrect(cx - 18, oy + 232, 36, 12, 3, C.cream, C.indigo, 1);
      lifeBarAt(cx, oy + 238 + 1.4, 30);
    }
  };
  tower(ox / 2, Math.max(0, G.lives), lifeIcon, pop.l, true);
  tower(ox + PW + ox / 2, G.p.horns, hornIc, pop.h, false);
  sideWater();
};
