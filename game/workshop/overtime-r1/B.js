// B: Label: the score bar's STAGE label reads OVERTIME 1 in orange over the stage number; on the cards, an orange ribbon along the bottom edge
otBand = function () {
  rect(PW - 52, 2.4, 42, 7.2, C.cream);
  textF(FONT_MAIN, 'OVERTIME ' + otNum(), PW - 12, 6.2, 4.8, C.orange, 'right', null, { track: 0.4 });
};
otCard = function (top, w, h, t, which) {
  ribbon(0, top + h - 5, 92, 12, C.orange, 'OVERTIME ' + otNum(), FONT_MAIN, 7);
};
