// C: GUST. A cone of air blows out: a soft cream wedge, streaks of wind and little puffs tumbling away.
drawBlast = function (c) { blastFrame(c, (age, k) => {
  const L = 10 + age * 1.6; pg.globalAlpha = 0.55 * (1 - k); pg.beginPath(); pg.moveTo(0, -3); pg.lineTo(L, -10 - age * 0.3); pg.lineTo(L, 10 + age * 0.3); pg.lineTo(0, 3); pg.closePath(); pg.fillStyle = ink(C.cream); pg.fill();
  pg.globalAlpha = 1 - k; pg.lineWidth = 1; pg.strokeStyle = ink(C.indigo);
  for (const [y, s] of [[-6, 0.9], [0, 1.2], [6, 1]]) { const x0 = age * 1.4 * s; pg.beginPath(); pg.moveTo(x0, y); pg.lineTo(x0 + 8, y + y * 0.15); pg.stroke(); }
  for (let i = 0; i < 4; i++) { const x = 6 + age * (1.1 + i * 0.25), y = (i - 1.5) * 4 + Math.sin(age * 0.5 + i) * 1.5, r = 1.6 + i * 0.3; pg.beginPath(); pg.arc(x, y, r, 0, 7); pg.fillStyle = ink(C.cream); pg.fill(); pg.lineWidth = 0.7; pg.stroke(); }
  pg.globalAlpha = 1; }); };
