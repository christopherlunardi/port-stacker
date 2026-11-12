// B: HONK! A comic HONK! bursts out of the bell, jumps up big and fades, with two fat rings behind it.
drawBlast = function (c) { blastFrame(c, (age, k, left) => {
  for (let r = 0; r < 2; r++) { const rad = 6 + r * 7 + age * 0.6; pg.globalAlpha = 1 - k; pg.beginPath(); pg.arc(0, 0, rad, -0.75, 0.75); pg.lineWidth = 3; pg.strokeStyle = ink(C.indigo); pg.stroke(); pg.lineWidth = 1.6; pg.strokeStyle = ink(r ? C.pink : C.yel); pg.stroke(); }
  pg.globalAlpha = k < 0.7 ? 1 : (1 - k) / 0.3; const s = age < 6 ? 0.5 + age / 6 * 0.75 : 1.25 - (age - 6) * 0.01;
  pg.save(); pg.translate(14 + age * 0.5, -7); if (left) pg.scale(-1, 1); if (Math.abs(Math.sin(pg.getTransform().b)) > 0.5) {} pg.rotate(-0.12); pg.scale(s, s); textF(FONT_MAIN, 'HONK!', 0, 0, 9, C.yel, 'center', C.indigo); pg.restore(); pg.globalAlpha = 1; }); };
