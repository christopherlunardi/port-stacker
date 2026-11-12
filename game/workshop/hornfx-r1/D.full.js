// shared by the horn-animation options: where the blast starts and which way it goes, then draw in a frame where +x is "out of the horn"
function blastFrame(c, fn) { const age = 24 - c.t, dir = c.face ? (c.face > 0 ? 0 : Math.PI) : c.dy > 0 ? Math.PI / 2 : -Math.PI / 2;
  const ax = c.face ? c.x - c.face * 8 : c.x, ay = c.face ? c.y : c.y - c.dy * 10;
  pg.save(); pg.translate(ax, ay); pg.rotate(dir); pg.lineCap = 'round'; pg.lineJoin = 'round'; fn(age, age / 24, c.face < 0); pg.restore(); }
// D: SHOCKWAVE. Big rings thump out fast like a speaker cone, thick and bright, each one flattening as it spreads.
drawBlast = function (c) { blastFrame(c, (age, k) => {
  for (let r = 0; r < 3; r++) { const a = age - r * 4; if (a < 0) continue; const rad = 4 + a * 1.3; pg.globalAlpha = Math.max(0, 1 - a / 20);
    pg.beginPath(); pg.ellipse(rad * 0.6, 0, rad * 0.45, rad, 0, -Math.PI / 2, Math.PI / 2); pg.lineWidth = 3.4; pg.strokeStyle = ink(C.indigo); pg.stroke(); pg.lineWidth = 2; pg.strokeStyle = ink(r === 1 ? C.pink : C.yel); pg.stroke(); }
  if (age < 4) { pg.globalAlpha = 1; pg.beginPath(); pg.arc(2, 0, 5 - age, 0, 7); pg.fillStyle = ink(C.cream); pg.fill(); }
  pg.globalAlpha = 1; }); };
