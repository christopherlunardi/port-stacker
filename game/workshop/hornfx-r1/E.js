// E: SOUND WAVES. Three wiggly cartoon sound lines stream out of the bell, wobbling as they go.
drawBlast = function (c) { blastFrame(c, (age, k) => {
  pg.globalAlpha = 1 - k * 0.8;
  for (let r = 0; r < 3; r++) { const y0 = (r - 1) * 6, len = 10 + age * 1.5, ph = age * 0.9 + r; pg.beginPath();
    for (let x = 0; x <= len; x += 1.5) { const y = y0 * (1 + x / 30) + Math.sin(x * 0.55 - ph) * 1.8; x ? pg.lineTo(x + 2, y) : pg.moveTo(2, y); }
    pg.lineWidth = 2.6; pg.strokeStyle = ink(C.indigo); pg.stroke(); pg.lineWidth = 1.3; pg.strokeStyle = ink(r === 1 ? C.yel : C.pink); pg.stroke(); }
  pg.globalAlpha = 1; }); };
