// F: drawn stars, like the title's Captain: the picture's own stars are taken away and every stunned enemy gets the same three drawn stars
// circling his head that the Captain has after he bonks into the container in the title (the gull's feathers circle too)
DIZ.move = (b, i, n, t, g) => {
  if (DIZ.cur !== 'gull.dizzy') return { s: 0.0001 }; // the picture's stars: hidden
  const a0 = Math.atan2(g.oy / 0.3, g.ox), a = a0 + t * 0.07, z = Math.sin(a);
  return { dx: Math.cos(a) * g.R - g.ox, dy: Math.sin(a) * g.R * 0.3 - g.oy, s: 0.84 + 0.16 * z, back: z < -0.25 };
};
const DIZ_HEAD = { 'pratt.dizzy': 30, 'watch.dizzy': 32, 'forklift.dizzy': 31, 'crab.dizzy': 19 }; // how high his head is
const _dizf = art;
art = function (name, x, y, o = {}) {
  DIZ.cur = name;
  const hh = DIZ_HEAD[name];
  if (!hh) return _dizf(name, x, y, o);
  _dizf(name, x, y, o);
  for (let k = 0; k < 3; k++) {
    const a = G.frame * 0.15 + k * 2.1; // the title's: 0.15 a frame, three apart
    glyphStar(x + Math.cos(a) * 12, y - hh - 2 + Math.sin(a) * 3, 3.2, C.yel);
  }
};
