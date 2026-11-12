// A: POP AND BREATHE. It pops in with a white flash ring, then a soft halo breathes slowly while it stays lit.
drawLamp = function (pc, i, lx, top, px, pw, H, on, age) {
  if (!on) { lampBulb(lx, top, false); return; }
  panelWash(px, top, pw, H, 0.3);
  const pop = age < 10 ? 1 + Math.sin(age / 10 * Math.PI) * 0.6 : 1, br = 0.5 + 0.25 * Math.sin((G.frame + i * 20) * 0.07);
  glowAt(lx, top - 2, 9, C.yel, br * 0.7);
  if (age < 14) { pg.globalAlpha = 1 - age / 14; pg.beginPath(); pg.arc(lx, top - 2, 3 + age * 0.9, 0, 7); pg.lineWidth = 1.2; pg.strokeStyle = ink(C.cream); pg.stroke(); pg.globalAlpha = 1; }
  lampBulb(lx, top, true, pop); if (NIGHT()) nightGlow(lx, top - 1.2, 9, C.yel, 0.5); };
