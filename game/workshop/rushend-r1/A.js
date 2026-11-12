// A: over Buck: a big number riding just above his hat, landing big and settling, gone the moment the next one comes
RUSHN.draw = (n, age, p) => {
  const s = 26 * rnPop(age), a = age > 50 ? 1 - (age - 50) / 10 : 1;
  pg.globalAlpha = a;
  textF(FONT_MAIN, String(n), p.x, p.y - 44, s, n === 1 ? C.pink : C.yel, 'center', C.indigo);
  pg.globalAlpha = 1;
};
