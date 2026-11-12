// C: CORNER BADGES. A rope-edged badge in each bottom corner, like the menus: Buck x3 on the left, horn x5 on the right.
function drawCorners(lives, horn, pop) {
  const badge = (x, flip, icon, n, s) => { pg.save(); pg.translate(x, PH - 22); pg.scale(s, s); ropePanel(-22, -11, 44, 20); icon(flip ? 10 : -10); textF(FONT_MAIN, 'x' + n, flip ? -8 : 8, 0, 9, C.pink, 'center', C.indigo); pg.restore(); };
  badge(30, false, ix => art('buck.stand', ix, 7, { scale: 0.42 }), lives, pop.l);
  badge(PW - 30, true, ix => hornIcon(ix, -1, 1.2), horn, pop.h);
}
