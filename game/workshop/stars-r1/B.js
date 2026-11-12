// B: they twinkle: the real stars stay where they are but each one bobs, swells and tilts in turn, like a twinkle; the gull's feathers sway
DIZ.move = (b, i, n, t) => {
  const p = t * 0.14 + i * 2.1;
  return { dy: Math.sin(p) * 1.1, s: 1 + 0.16 * Math.sin(p * 1.3), rot: Math.sin(p * 0.9) * 0.28 };
};
