// C: Burst: a yellow starburst spins behind the count and jumps on every move; the multiplier in a pink tag under it
drawComboHud = function () { const S = comboState(), cy = 46;
  pg.save(); pg.translate(PW / 2, cy); pg.scale(S.pop, S.pop); star(0, 0, 12, 22, 14, G.frame * 0.02); pg.fillStyle = ink(C.yel); pg.fill(); pg.lineWidth = 1.2; pg.strokeStyle = ink(C.indigo); pg.stroke();
  textF(FONT_MAIN, String(G.combo), 0, -3, 14, C.pink, 'center', C.indigo); textF(FONT_MAIN, 'COMBO', 0, 8, 6, C.indigo, 'center'); pg.restore();
  if (S.m > 1) { rrect(PW / 2 + 18, cy + 8, 30, 10, 3, C.pink, C.indigo, 1); textF(FONT_MAIN, 'X' + S.m, PW / 2 + 33, cy + 13, 7, C.cream, 'center'); }
  rrect(PW / 2 - 18, cy + 21, 36, 2.6, 1.3, C.cream, C.indigo, 0.7); rect(PW / 2 - 17.5, cy + 21.5, 35 * S.k, 1.6, C.pink); };
