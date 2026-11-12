// D: over Buck and a send-off: as A, then OVER! pops up when the rush ends, so you know you're back to normal
RUSHN.draw = (n, age, p) => {
  const s = 26 * rnPop(age), a = age > 50 ? 1 - (age - 50) / 10 : 1;
  pg.globalAlpha = a;
  textF(FONT_MAIN, String(n), p.x, p.y - 44, s, n === 1 ? C.pink : C.yel, 'center', C.indigo);
  pg.globalAlpha = 1;
};
RUSHN.drawEnd = (t, p) => {
  pg.globalAlpha = t > 20 ? 1 - (t - 20) / 10 : 1;
  textF(FONT_MAIN, 'RUSH OVER', p.x, p.y - 40 - t * 0.4, 11 * rnPop(t), C.cream, 'center', C.indigo);
  pg.globalAlpha = 1;
};
