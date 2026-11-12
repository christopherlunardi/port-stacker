// E: Everything: the flash, the light cone and the bold arcs together
drawBlast = function (c) { blastFrame(c, (age, k) => {
  const R = 18 + age * 0.9; pg.save(); pg.globalAlpha = 0.6 * (1 - k * 0.7); pg.beginPath(); pg.moveTo(0, 0); pg.arc(0, 0, R, -0.8, 0.8); pg.closePath(); pg.fillStyle = ink(C.cream); pg.fill(); pg.restore();
  if (age < 8) { const s = age < 3 ? age / 3 : 1 - (age - 3) / 5; pg.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = (i & 1 ? 4 : 10) * (0.6 + s * 0.6); pg.lineTo(Math.cos(a) * r + 3, Math.sin(a) * r); } pg.closePath();
    pg.fillStyle = ink(C.yel); pg.fill(); pg.lineWidth = 1.2; pg.strokeStyle = ink(C.indigo); pg.stroke(); pg.beginPath(); pg.arc(3, 0, 3.5 * s + 1, 0, 7); pg.fillStyle = ink(C.cream); pg.fill(); }
  boldArcs(age, 0.85, 2.4); }); };
