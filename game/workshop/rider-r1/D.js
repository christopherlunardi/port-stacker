// D: what it's worth: the rider bonus it would pay floats over the container (above the heads of whoever's on it) (+300 for one, +1,500 for two...), gently bobbing
RIDE.draw = (pc, n, x, y, W, H) => {
  const v = worthPts(RIDER_PTS[Math.min(n, 4)], 1), b = Math.sin(G.frame * 0.12) * 1.2;
  textF(FONT_MAIN, 'RIDER +' + fmtNum(v), x + W / 2, y - H - 22 + b, 7, C.pink, 'center', C.cream);
};
