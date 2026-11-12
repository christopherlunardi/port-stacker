// B: SPARKS. A little burst of sparks jumps up when it lights; after that a star glint twinkles on it now and then.
drawLamp = function (pc, i, lx, top, px, pw, H, on, age) {
  if (!on) { lampBulb(lx, top, false); return; }
  panelWash(px, top, pw, H, 0.3); glowAt(lx, top - 2, 7, C.yel, 0.45);
  if (age < 26) for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.42, sp = 0.55 + (k % 3) * 0.18, t = age;
    const sx = lx + Math.cos(a) * sp * t, sy = top - 2 + Math.sin(a) * sp * t + 0.035 * t * t; pg.globalAlpha = 1 - t / 26;
    pg.beginPath(); pg.arc(sx, sy, 0.9, 0, 7); pg.fillStyle = ink(k & 1 ? C.cream : C.yel); pg.fill(); pg.globalAlpha = 1; }
  lampBulb(lx, top, true, age < 6 ? 1.3 - age * 0.05 : 1);
  const c = (G.frame + i * 37 + pc.c * 11) % 150; if (c < 14) { const s = Math.sin(c / 14 * Math.PI) * 2.6; glyphStar(lx + 1.6, top - 4.2, s, C.cream); } // the glint
  if (NIGHT()) nightGlow(lx, top - 1.2, 9, C.yel, 0.5); };
