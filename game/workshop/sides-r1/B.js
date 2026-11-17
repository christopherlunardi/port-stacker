// B: side boards. Tall rope-edged boards fill both sides from the top bar down to the water: LIVES on the left (a Buck per life, two to a
// row, and the next-life bar at the foot), HORNS on the right (a horn per blast, two to a row). Up to ten, then +N.
SIDES.draw = pop => {
  const { ox, oy } = LAY,
    w = Math.min(ox - 12, 72),
    top = oy + 4,
    h = PH - 34,
    board = (cx, label, n, icon, s, bar) => {
      const per = w >= 44 ? 2 : 1,
        r = iconRun(n, per * 5),
        dx = per === 2 ? 11 : 0;
      ropePanel(cx - w / 2, top, w, h);
      textF(FONT_MAIN, label, cx, top + 12, 7, C.blue, 'center', null, { maxW: w - 10 });
      rect(cx - w / 2 + 8, top + 19, w - 16, 0.8, C.blue);
      pg.save();
      pg.translate(cx, top + 30);
      pg.scale(s, s);
      pg.translate(-cx, -(top + 30));
      for (let i = 0; i < r.show; i++) icon(cx + (per === 2 ? (i % 2 ? dx : -dx) : 0), top + 32 + Math.floor(i / per) * 24, 1.2);
      const k = r.show;
      if (r.more) textF(FONT_MAIN, '+' + r.more, cx + (per === 2 ? (k % 2 ? dx : -dx) : 0), top + 32 + Math.floor(k / per) * 24, 10, C.pink, 'center', C.indigo);
      pg.restore();
      if (bar) {
        textF(FONT_MAIN, 'NEXT', cx, top + h - 20, 5.5, C.blue, 'center');
        lifeBarAt(cx, top + h - 10, w - 16);
      }
    };
  board(ox / 2, 'LIVES', Math.max(0, G.lives), lifeIcon, pop.l, true);
  board(ox + PW + ox / 2, 'HORNS', G.p.horns, hornIc, pop.h, false);
  sideWater();
};
