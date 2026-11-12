// E: POP AND CHIME. Like A, plus a chime on each one that rises up a scale as you light more of the container (the 4th is the top note),
// and a ring that spreads out over the container.
drawLamp = function (pc, i, lx, top, px, pw, H, on, age) {
  if (!on) { lampBulb(lx, top, false); return; }
  pc.chimed = pc.chimed || []; if (!pc.chimed[i]) { pc.chimed[i] = 1; const n = pc.segs.filter(Boolean).length, f = [784, 988, 1175, 1568][Math.min(3, n - 1)]; if (typeof tone === 'function') { tone(f, 0.18, 'triangle', 0.13); tone(f * 2, 0.1, 'sine', 0.05, 0, 0.02); } }
  panelWash(px, top, pw, H, 0.3);
  const pop = age < 10 ? 1 + Math.sin(age / 10 * Math.PI) * 0.6 : 1, br = 0.5 + 0.25 * Math.sin((G.frame + i * 20) * 0.07);
  glowAt(lx, top - 2, 9, C.yel, br * 0.7);
  if (age < 18) { pg.globalAlpha = (1 - age / 18) * 0.9; pg.beginPath(); pg.ellipse(lx, top - 1, 3 + age * 1.6, 1.5 + age * 0.35, 0, 0, 7); pg.lineWidth = 1; pg.strokeStyle = ink(C.cream); pg.stroke(); pg.globalAlpha = 1; }
  lampBulb(lx, top, true, pop); if (NIGHT()) nightGlow(lx, top - 1.2, 9, C.yel, 0.5); };
