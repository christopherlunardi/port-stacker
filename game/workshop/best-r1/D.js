// D: where you placed: a tag on the rule under the score says the place on the board, NEW BEST! for first (with a crown), 2ND ON THE
// BOARD, 3RD ON THE BOARD...
BEST.draw = (top, t, best, rank) => {
  const age = t - BEST.at;
  if (age < 0) return;
  const s = age < 10 ? 0.4 + 0.6 * Math.sin(((age / 10) * Math.PI) / 2) * (1 + 0.25 * Math.sin((age / 10) * Math.PI)) : 1,
    label = best || rank === 1 ? 'NEW BEST!' : ord(rank) + ' ON THE BOARD',
    w = textW(FONT_MAIN, label, 7) + (best ? 24 : 14);
  pg.save();
  pg.translate(0, top + 53.5);
  pg.scale(s, s);
  rrect(-w / 2, -6, w, 12, 6, best ? C.yel : C.cream, C.indigo, 1.1);
  textF(FONT_MAIN, label, best ? 5 : 0, 0.5, 7, best ? C.indigo : C.pink, 'center');
  if (best) {
    // a little crown
    const cx = -w / 2 + 8.5;
    pg.fillStyle = ink(C.pink);
    pg.beginPath();
    pg.moveTo(cx - 4, 3);
    pg.lineTo(cx - 4, -2.5);
    pg.lineTo(cx - 2, 0);
    pg.lineTo(cx, -3.5);
    pg.lineTo(cx + 2, 0);
    pg.lineTo(cx + 4, -2.5);
    pg.lineTo(cx + 4, 3);
    pg.closePath();
    pg.fill();
  }
  pg.restore();
};
