// B: the label changes: once the score has counted up, FINAL SCORE above it flips to NEW BEST! (or ON THE BOARD!) in pink, with little
// sparkles either side of it
BEST.draw = (top, t, best) => {
  const age = t - BEST.at;
  if (age < 0) return;
  const f = Math.min(1, age / 8);
  // the card's own FINAL SCORE is held back (below) while this squashes it away and opens the new label out
  pg.save();
  const label = best ? 'NEW BEST!' : 'ON THE BOARD!',
    sy = age < 4 ? 1 - age / 4 : Math.min(1, (age - 4) / 4);
  pg.translate(0, top + 17);
  pg.scale(1, Math.max(0.05, sy));
  textF.inner = true;
  textF(FONT_MAIN, age < 4 ? 'FINAL SCORE' : label, 0, 0, age < 4 ? 6 : 7, age < 4 ? C.blue : C.pink, 'center', null, { track: 1 });
  textF.inner = false;
  pg.restore();
  if (age >= 8) {
    const w = textW(FONT_MAIN, label, 7) / 2 + 9;
    for (const s of [-1, 1])
      for (let i = 0; i < 2; i++) {
        const k = 0.5 + 0.5 * Math.sin(t * 0.2 + i * 2 + (s > 0 ? 1 : 0)),
          x = s * (w + i * 6),
          y = top + 17 + (i ? -3 : 2),
          r = 1 + 1.6 * k;
        pg.fillStyle = ink(i ? C.yel : C.pink);
        pg.beginPath();
        pg.moveTo(x, y - r * 1.8);
        pg.lineTo(x + r * 0.5, y - r * 0.5);
        pg.lineTo(x + r * 1.8, y);
        pg.lineTo(x + r * 0.5, y + r * 0.5);
        pg.lineTo(x, y + r * 1.8);
        pg.lineTo(x - r * 0.5, y + r * 0.5);
        pg.lineTo(x - r * 1.8, y);
        pg.lineTo(x - r * 0.5, y - r * 0.5);
        pg.fill();
      }
  }
};

// keep the card's own FINAL SCORE label off once this one has taken over
const _btext = textF;
textF = function (fam, str) {
  if (str === 'FINAL SCORE' && G.state === 'over' && (G.newBest || G.made) && (G.t || 0) - 14 >= BEST.at && !textF.inner) return;
  return _btext.apply(this, arguments);
};
