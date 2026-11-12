// D: BALLOON. The horn floats down from the top on a pink balloon and hangs there just above the catwalk, swaying; grab it to pop it free.
ITEM_ARRIVE = 70;
drawItem = function (it) { const a = it.age || 0, f = Math.min(1, a / 70), sway = Math.sin(G.frame * 0.06) * 2.5, y = 24 + (it.y - 6 - 24) * (1 - (1 - f) * (1 - f)) + Math.sin(G.frame * 0.09) * 1.5;
  if (a >= 70) arrived(it); if (!(it.t > 90 || (it.t >> 3) & 1)) return;
  const bx = it.x + sway, by = y - 22; pg.beginPath(); pg.moveTo(it.x, y - 4); pg.quadraticCurveTo(it.x + sway * 0.4 - 2, y - 12, bx, by + 7); pg.lineWidth = 0.6; pg.strokeStyle = ink(C.indigo); pg.stroke();
  pg.beginPath(); pg.ellipse(bx, by, 6, 7.5, sway * 0.03, 0, 7); pg.fillStyle = ink(C.pink); pg.fill(); pg.lineWidth = 1; pg.stroke(); pg.beginPath(); pg.ellipse(bx - 2, by - 3, 1.4, 2.2, -0.4, 0, 7); pg.fillStyle = ink(C.pinkL); pg.fill();
  glowAt(it.x, y - 2, 9, C.yel, 0.35); hornIcon(it.x + 0.5, y - 2, 1.5); if (NIGHT()) nightGlow(it.x, y - 2, 10, C.yel, 0.4); };
