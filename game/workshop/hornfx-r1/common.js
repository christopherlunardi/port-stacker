// shared by the horn-animation options: where the blast starts and which way it goes, then draw in a frame where +x is "out of the horn"
function blastFrame(c, fn) { const age = 24 - c.t, dir = c.face ? (c.face > 0 ? 0 : Math.PI) : c.dy > 0 ? Math.PI / 2 : -Math.PI / 2;
  const ax = c.face ? c.x - c.face * 8 : c.x, ay = c.face ? c.y : c.y - c.dy * 10;
  pg.save(); pg.translate(ax, ay); pg.rotate(dir); pg.lineCap = 'round'; pg.lineJoin = 'round'; fn(age, age / 24, c.face < 0); pg.restore(); }
