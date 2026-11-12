// B: Plate: the combo on its own little cream plate with a shadow, so it reads over anything; the bar drains along its bottom
drawComboHud = function () { const S = comboState(), w = 92, h = 25, x = PW / 2 - w / 2, y = 26;
  rrect(x + 2, y + 2, w, h, 5, C.indigo); rrect(x, y, w, h, 5, C.cream, C.indigo, 1.2);
  pg.save(); pg.translate(PW / 2, y + 10); pg.scale(S.pop, S.pop); textF(FONT_MAIN, G.combo + ' COMBO!', 0, 0, 11, S.m >= 3 ? C.pink : C.blue, 'center'); pg.restore();
  if (S.m > 1) textF(FONT_MAIN, 'X' + S.m + ' POINTS', PW / 2, y + 18.5, 5.5, C.indigo, 'center');
  rect(x + 4, y + h - 3.4, (w - 8) * S.k, 1.6, S.m >= 3 ? C.pink : C.yel); };
