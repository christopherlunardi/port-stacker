// D: A plate on the water: no starburst, just COMBO 12 and the multiplier on a yellow plate at the bottom between your lives and horns,
// jumping on every move, the bar draining under it
drawComboHud = function () {
  const m = comboMult(),
    win = G.comboWin || 150,
    age = win - G.comboT,
    pop = age < 10 ? 1 + 0.3 * Math.sin((age / 10) * Math.PI) : 1,
    cx = PW / 2,
    cy = PH - 12;
  pg.save();
  pg.translate(cx, cy);
  pg.scale(pop, pop);
  rrect(-44, -8, 88, 15, 4, C.yel, C.indigo, 1.2);
  textF(FONT_MAIN, 'COMBO', -22, 0, 7, C.indigo, 'center');
  textF(FONT_MAIN, String(G.combo), 4, -0.5, 11, C.pink, 'center', C.indigo);
  if (m > 1) {
    rrect(16, -5.5, 24, 10, 3, C.pink, C.indigo, 1);
    textF(FONT_MAIN, 'X' + m, 28, -0.4, 7, C.cream, 'center');
  }
  pg.restore();
  rrect(cx - 30, cy + 8, 60, 2.6, 1.3, C.cream, C.indigo, 0.7);
  rect(cx - 29.5, cy + 8.5, 59 * (G.comboT / win), 1.6, C.pink);
};
