// B: rider pips: a little pink tag hangs off the container's top corner with a dot for each enemy who'd ride (up to four)
RIDE.draw = (pc, n, x, y, W, H) => {
  const m = Math.min(n, 4), tw = 6 + m * 5, tx = x + W - tw - 2, ty = y - H - 7;
  rrect(tx, ty, tw, 7, 2.5, C.pink, C.indigo, 0.8);
  for (let i = 0; i < m; i++) {
    pg.beginPath();
    pg.arc(tx + 5.5 + i * 5, ty + 3.5, 1.7 + (i === m - 1 ? 0.3 * ridePulse() : 0), 0, Math.PI * 2);
    pg.fillStyle = ink(C.cream);
    pg.fill();
  }
};
