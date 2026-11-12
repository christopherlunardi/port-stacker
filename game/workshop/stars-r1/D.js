// D: they hop in turn: the real stars hop up and pop one after another, left to right, round and round, like a little ripple; the gull's
// feathers too
DIZ.move = (b, i, n, t) => {
  const cyc = 36, u = ((t + cyc - i * (cyc / n)) % cyc) / 14;
  if (u >= 1) return {};
  const k = Math.sin(u * Math.PI);
  return { dy: -k * 3.2, s: 1 + k * 0.28 };
};
