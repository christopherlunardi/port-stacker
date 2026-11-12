// A: they circle: the real stars travel round in a ring over his head, passing behind it at the back (smaller there); the gull's feathers
// circle round him the same way
DIZ.move = (b, i, n, t, g) => {
  // round a shared ring through where they sit in the picture: each starts from its own place on it
  const a0 = Math.atan2(g.oy / 0.3, g.ox), a = a0 + t * 0.07, z = Math.sin(a);
  return { dx: Math.cos(a) * g.R - g.ox, dy: Math.sin(a) * g.R * 0.3 - g.oy, s: 0.84 + 0.16 * z, back: z < -0.25 };
};
