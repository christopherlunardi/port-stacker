// shared by the horn-animation options: where the blast starts and which way it goes, then draw in a frame where +x is "out of the horn"
function blastFrame(c, fn) { const age = 24 - c.t, dir = c.face ? (c.face > 0 ? 0 : Math.PI) : c.dy > 0 ? Math.PI / 2 : -Math.PI / 2;
  const ax = c.face ? c.x - c.face * 8 : c.x, ay = c.face ? c.y : c.y - c.dy * 10;
  pg.save(); pg.translate(ax, ay); pg.rotate(dir); pg.lineCap = 'round'; pg.lineJoin = 'round'; fn(age, age / 24, c.face < 0); pg.restore(); }
// B: HONK! A comic HONK! bursts out of the bell, jumps up big and fades, with two fat rings behind it.
drawBlast = function (c) { blastFrame(c, (age, k, left) => {
  for (let r = 0; r < 2; r++) { const rad = 6 + r * 7 + age * 0.6; pg.globalAlpha = 1 - k; pg.beginPath(); pg.arc(0, 0, rad, -0.75, 0.75); pg.lineWidth = 3; pg.strokeStyle = ink(C.indigo); pg.stroke(); pg.lineWidth = 1.6; pg.strokeStyle = ink(r ? C.pink : C.yel); pg.stroke(); }
  pg.globalAlpha = k < 0.7 ? 1 : (1 - k) / 0.3; const s = age < 6 ? 0.5 + age / 6 * 0.75 : 1.25 - (age - 6) * 0.01;
  pg.save(); pg.translate(14 + age * 0.5, -7); if (left) pg.scale(-1, 1); if (Math.abs(Math.sin(pg.getTransform().b)) > 0.5) {} pg.rotate(-0.12); pg.scale(s, s); textF(FONT_MAIN, 'HONK!', 0, 0, 9, C.yel, 'center', C.indigo); pg.restore(); pg.globalAlpha = 1; }); };
