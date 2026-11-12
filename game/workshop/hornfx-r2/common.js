// shared by the horn-blast options (round 2: keep Chris's arcs, make them stand out): the blast's origin and direction; draw with +x out of the horn
function blastFrame(c, fn) { const age = 24 - c.t, dir = c.face ? (c.face > 0 ? 0 : Math.PI) : c.dy > 0 ? Math.PI / 2 : -Math.PI / 2;
  const ax = c.face ? c.x - c.face * 8 : c.x, ay = c.face ? c.y : c.y - c.dy * 10;
  pg.save(); pg.translate(ax, ay); pg.rotate(dir); pg.lineCap = 'round'; pg.lineJoin = 'round'; fn(age, age / 24); pg.restore(); }
function boldArcs(age, spread, w) { for (let r = 0; r < 3; r++) { const rad = 4 + r * 5.5 + age * 0.55; pg.beginPath(); pg.arc(0, 0, rad, -spread, spread);
  pg.lineWidth = w + 1.6; pg.strokeStyle = ink(C.indigo); pg.stroke(); pg.lineWidth = w; pg.strokeStyle = ink(r === 1 ? C.yel : C.pink); pg.stroke();
  pg.lineWidth = w * 0.35; pg.strokeStyle = ink(C.cream); pg.beginPath(); pg.arc(0, 0, rad, -spread * 0.6, spread * 0.1); pg.stroke(); } }
