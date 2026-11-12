// C: MARQUEE. Each pops in; the lit lamps on a container then run a slow chase of brightness along them, like theatre lights.
drawLamp = function (pc, i, lx, top, px, pw, H, on, age) {
  if (!on) { lampBulb(lx, top, false); return; }
  const wave = 0.5 + 0.5 * Math.sin(G.frame * 0.12 - i * 1.4), pop = age < 8 ? 1 + Math.sin(age / 8 * Math.PI) * 0.5 : 1;
  panelWash(px, top, pw, H, 0.18 + 0.2 * wave); glowAt(lx, top - 2, 6 + wave * 4, C.yel, 0.3 + wave * 0.4);
  lampBulb(lx, top, true, pop); if (wave > 0.85) { pg.beginPath(); pg.arc(lx, top - 2.6, 1.1, 0, 7); pg.fillStyle = ink(C.cream); pg.fill(); }
  if (NIGHT()) nightGlow(lx, top - 1.2, 9, C.yel, 0.5); };
