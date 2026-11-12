// B: centre stage: a huge number in the middle of the field, see-through so you can still play under it, pulsing on each second
RUSHN.draw = (n, age, p) => {
  const s = 92 * rnPop(age), a = (age > 45 ? 0.55 * (1 - (age - 45) / 15) : 0.55);
  pg.globalAlpha = a;
  textF(FONT_MAIN, String(n), PW / 2, 128, s, n === 1 ? C.pink : C.yel, 'center', C.indigo);
  pg.globalAlpha = 1;
};
