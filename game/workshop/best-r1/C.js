// C: the ribbon turns over: the card's pink GAME OVER ribbon flips like a sign to a yellow one, NEW BEST! (or ON THE BOARD!)
BEST.draw = (top, t, best) => {
  const age = t - BEST.at;
  if (age < 0) return;
  const f = Math.min(1, age / 12),
    sy = Math.abs(Math.cos(f * Math.PI)),
    after = f >= 0.5;
  pg.save();
  pg.translate(0, top - 7);
  pg.scale(1, Math.max(0.04, sy));
  ribbon(0, 0, 110, 16, after ? C.yel : C.pink, after ? (best ? 'NEW BEST!' : 'ON THE BOARD!') : 'GAME OVER', FONT_MAIN, 10, after ? C.pink : C.cream);
  pg.restore();
};
