// D: the badges move up. The two badges from the bottom corners (Buck x3 with the next-life bar, horn x5) move to the middle of each
// side, bigger; the painting at the sides is washed pale so they stand out and the stage doesn't look cut off.
SIDES.draw = pop => {
  const { ox, oy } = LAY;
  sideWash();
  const k = Math.min(1.25, (ox - 8) / 44),
    badge = (cx, flip, icon, n, s, bar) => {
      pg.save();
      pg.translate(cx, oy + 150);
      pg.scale(s * k, s * k);
      ropePanel(-22, -14, 44, 26);
      const ty = bar ? -3.6 : -1;
      icon(flip ? 10 : -10, ty);
      textF(FONT_MAIN, 'x' + n, flip ? -6 : 6, ty, 9, C.pink, 'center', C.indigo, { maxW: 20 });
      if (bar) lifeBar();
      pg.restore();
    };
  badge(ox / 2, false, (ix, ty) => art('buck.stand', ix - 1, ty + 6.4, { scale: 0.4 }), Math.max(0, G.lives), pop.l, true);
  badge(ox + PW + ox / 2, true, (ix, ty) => hornIcon(ix, ty - 1, 1.2), G.p.horns, pop.h, false);
  sideWater();
};
