// C: Hazard plate: a yellow-and-black striped plate hangs under the score bar with OT1 on it; on the cards, a strip of hazard tape across the top corner
function hazard(x, y, w, h, r) {
  pg.save();
  pg.beginPath();
  if (pg.roundRect) pg.roundRect(x, y, w, h, r); else pg.rect(x, y, w, h);
  pg.clip();
  rect(x, y, w, h, C.yel);
  pg.fillStyle = ink(C.indigo);
  for (let sx = x - h; sx < x + w + h; sx += 6) {
    pg.beginPath();
    pg.moveTo(sx, y + h);
    pg.lineTo(sx + h, y);
    pg.lineTo(sx + h + 3, y);
    pg.lineTo(sx + 3, y + h);
    pg.closePath();
    pg.fill();
  }
  pg.restore();
  rrect(x, y, w, h, r, null, C.indigo, 1.1);
}
otBand = function () {
  const x = PW - 46;
  for (const s of [-1, 1]) rect(x + s * 9 - 0.6, 19, 1.2, 4, C.indigo);
  hazard(x - 17, 21.5, 34, 12, 2.5);
  rrect(x - 11, 23.5, 22, 8, 2, C.cream, C.indigo, 0.8);
  textF(FONT_MAIN, 'OT' + otNum(), x, 27.8, 6.5, C.indigo, 'center');
};
otCard = function (top, w, h, t, which) {
  pg.save();
  pg.translate(w / 2 - 22, top + 6);
  pg.rotate(0.42);
  hazard(-46, -6, 92, 12, 0);
  rrect(-26, -4.5, 52, 9, 1.5, C.cream, C.indigo, 0.8);
  textF(FONT_MAIN, 'OVERTIME ' + otNum(), 0, 0.2, 5.6, C.indigo, 'center', null, { track: 0.4 });
  pg.restore();
};
