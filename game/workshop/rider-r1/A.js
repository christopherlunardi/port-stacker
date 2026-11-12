// A: rim glow: the container's outline glows pink and pulses while anyone's aboard (brighter with more of them)
RIDE.draw = (pc, n, x, y, W, H) => {
  const k = ridePulse();
  pg.save();
  pg.globalAlpha = 0.55 + 0.35 * k;
  rrect(x - 1, y - H - 1, W + 2, H + 1, 2, null, C.pink, 1.6 + 0.5 * Math.min(n, 3));
  pg.restore();
};
