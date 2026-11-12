// D: Chunky 3D: the count in thick letters with a deep shadow under them, tilted; it flashes white and shakes on every move
drawComboHud = function () { const S = comboState(), flash = S.age < 4, sh = S.age < 8 ? Math.sin(S.age * 2.5) * 1.2 : 0;
  pg.save(); pg.translate(PW / 2 + sh, 33); pg.rotate(-0.06); pg.scale(S.pop, S.pop);
  for (let d = 3; d > 0; d--) textF(FONT_MAIN, G.combo + ' COMBO!', d * 0.6, d * 0.8, 15, C.indigo, 'center');
  textF(FONT_MAIN, G.combo + ' COMBO!', 0, 0, 15, flash ? C.cream : S.m >= 3 ? C.pink : C.yel, 'center', C.indigo); pg.restore();
  if (S.m > 1) { const tw = 40; rrect(PW / 2 - tw / 2, 44, tw, 10, 3, C.pink, C.indigo, 1); textF(FONT_MAIN, 'X' + S.m + ' POINTS', PW / 2, 49, 5.5, C.cream, 'center'); }
  rrect(PW / 2 - 22, 56, 44, 2.6, 1.3, C.cream, C.indigo, 0.7); rect(PW / 2 - 21.5, 56.5, 43 * S.k, 1.6, S.m >= 3 ? C.pink : C.yel); };
