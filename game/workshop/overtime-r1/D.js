// D: Stamp: OT1 rubber-stamped in pink beside the stage number, a little crooked; on the cards, a big OVERTIME 1 stamp slams down on the corner
otBand = function () {
  stamp('OT' + otNum(), PW - 60, 11.5, 6.5, C.pink, -0.14, FONT_MAIN);
};
otCard = function (top, w, h, t, which) {
  const a = Math.max(0, t - 22), k = a < 8 ? 2.6 - 1.6 * (a / 8) : 1; // lands a moment after the card
  if (t < 22) return;
  pg.save();
  const at = { intro: [w / 2 - 40, top + h - 12], clear: [w / 2 - 38, top + h - 4], over: [-w / 2 + 42, top + 22] }[which];
  pg.translate(at[0], at[1]);
  pg.scale(k, k);
  pg.globalAlpha = Math.min(1, a / 4);
  stamp('OVERTIME ' + otNum(), 0, 0, 6.5, C.pink, -0.18, FONT_MAIN);
  pg.restore();
};
