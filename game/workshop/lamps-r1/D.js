// D: WORK LIGHT. A caged work lamp; it clicks on and pours a soft cone of light down over its panel, with a faint flicker.
drawLamp = function (pc, i, lx, top, px, pw, H, on, age) {
  rrect(lx - 3, top - 3.4, 6, 3.2, 1, on ? C.yel : C.blue, C.indigo, 0.6); pg.strokeStyle = ink(C.indigo); pg.lineWidth = 0.45; pg.beginPath(); pg.moveTo(lx - 1, top - 3.4); pg.lineTo(lx - 1, top - 0.2); pg.moveTo(lx + 1, top - 3.4); pg.lineTo(lx + 1, top - 0.2); pg.stroke(); // the cage
  if (!on) return;
  const fl = (age < 12 ? (age % 4 < 2 ? 0.4 : 1) : 1) * (0.92 + 0.08 * Math.sin(G.frame * 0.3 + i));
  const g = pg.createLinearGradient(0, top, 0, top + H); g.addColorStop(0, 'rgba(' + C.yel.join(',') + ',' + 0.55 * fl + ')'); g.addColorStop(1, 'rgba(' + C.yel.join(',') + ',0)');
  pg.fillStyle = g; pg.beginPath(); pg.moveTo(lx - 2.5, top); pg.lineTo(lx + 2.5, top); pg.lineTo(px + pw - 1.5, top + H - 1); pg.lineTo(px + 1.5, top + H - 1); pg.closePath(); pg.fill();
  glowAt(lx, top - 1.6, 6, C.yel, 0.5 * fl); if (NIGHT()) nightGlow(lx, top - 1.2, 9, C.yel, 0.5); };
