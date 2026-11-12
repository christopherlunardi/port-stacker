// A: a tag on the rule: a yellow tag pops onto the dotted line under the score, NEW BEST! (or ON THE BOARD!), with a little shine across it
BEST.draw = (top, t, best) => {
  const age = t - BEST.at;
  if (age < 0) return;
  const s = age < 10 ? 0.4 + 0.6 * Math.sin(((age / 10) * Math.PI) / 2) * (1 + 0.25 * Math.sin((age / 10) * Math.PI)) : 1,
    label = best ? 'NEW BEST!' : 'ON THE BOARD!',
    w = textW(FONT_MAIN, label, 7) + 14;
  pg.save();
  pg.translate(0, top + 53.5);
  pg.scale(s, s);
  rrect(-w / 2, -6, w, 12, 6, C.yel, C.indigo, 1.1);
  textF(FONT_MAIN, label, 0, 0.5, 7, C.indigo, 'center');
  const sh = ((age % 90) / 30) * w - w; // a shine runs across now and then
  if (sh < w) {
    pg.beginPath();
    pg.rect(-w / 2, -6, w, 12);
    pg.clip();
    pg.globalAlpha = 0.5;
    pg.fillStyle = ink(C.cream);
    pg.beginPath();
    pg.moveTo(sh - 4, -6);
    pg.lineTo(sh + 2, -6);
    pg.lineTo(sh - 2, 6);
    pg.lineTo(sh - 8, 6);
    pg.fill();
  }
  pg.restore();
};
