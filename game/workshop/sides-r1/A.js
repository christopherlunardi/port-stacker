// A: icon columns. The harbor painting stays at the sides; lives hang down the left on a rope tag, one Buck each, with the next-life bar
// under them; horns hang down the right, one horn each. Up to six, then +N.
SIDES.draw = pop => {
  const { ox, oy } = LAY,
    w = Math.min(ox - 16, 40),
    col = (cx, n, icon, s, bar) => {
      const r = iconRun(n, 6),
        rows = r.show + (r.more ? 1 : 0),
        h = 12 + Math.max(1, rows) * 22 + 4 + (bar ? 10 : 0),
        top = oy + 150 - h / 2;
      pg.save();
      pg.translate(cx, oy + 150);
      pg.scale(s, s);
      pg.translate(-cx, -(oy + 150));
      ropePanel(cx - w / 2, top, w, h);
      for (let i = 0; i < r.show; i++) icon(cx, top + 17 + i * 22, 1.3);
      if (r.more) textF(FONT_MAIN, '+' + r.more, cx, top + 17 + r.show * 22, 10, C.pink, 'center', C.indigo);
      if (!rows) textF(FONT_MAIN, '0', cx, top + 17, 10, C.pink, 'center', C.indigo);
      if (bar) lifeBarAt(cx, top + h - 7, w - 12);
      pg.restore();
    };
  col(ox / 2, Math.max(0, G.lives), lifeIcon, pop.l, true);
  col(ox + PW + ox / 2, G.p.horns, hornIc, pop.h, false);
  sideWater();
};
