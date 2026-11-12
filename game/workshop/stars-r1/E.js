// E: they circle, with stars for everyone: like A (the real stars and feathers ring round), and the Captain, who has no stars in his picture,
// gets three drawn ones circling his cap
DIZ.move = (b, i, n, t, g) => {
  // round a shared ring through where they sit in the picture: each starts from its own place on it
  const a0 = Math.atan2(g.oy / 0.3, g.ox), a = a0 + t * 0.07, z = Math.sin(a);
  return { dx: Math.cos(a) * g.R - g.ox, dy: Math.sin(a) * g.R * 0.3 - g.oy, s: 0.84 + 0.16 * z, back: z < -0.25 };
};
const _dizc = art;
art = function (name, x, y, o = {}) {
  if (name !== 'crab.dizzy') return _dizc(name, x, y, o);
  const st = k => {
    const a = G.frame * 0.07 + (k / 3) * Math.PI * 2;
    return [x + Math.cos(a) * 9, y - 22 + Math.sin(a) * 2.6, Math.sin(a)];
  };
  for (let k = 0; k < 3; k++) { const [sx, sy, z] = st(k); if (z < -0.2) glyphStar(sx, sy, 2.6 * (0.82 + 0.18 * z), C.yel); }
  _dizc(name, x, y, o);
  for (let k = 0; k < 3; k++) { const [sx, sy, z] = st(k); if (z >= -0.2) glyphStar(sx, sy, 2.6 * (0.82 + 0.18 * z), C.yel); }
};
