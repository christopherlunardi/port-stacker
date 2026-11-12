// D: Light cone: a pale wedge of air behind the bold arcs, so they read on any background, day or night
drawBlast = function (c) { blastFrame(c, (age, k) => {
  const R = 18 + age * 0.9; pg.save(); pg.globalAlpha = 0.6 * (1 - k * 0.7); pg.beginPath(); pg.moveTo(0, 0); pg.arc(0, 0, R, -0.8, 0.8); pg.closePath(); pg.fillStyle = ink(C.cream); pg.fill(); pg.restore();
  boldArcs(age, 0.85, 2.4); }); };
