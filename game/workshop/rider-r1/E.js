// E: the lamps turn pink: the work lamps on top of the container flash pink (lit or not) while anyone's aboard
RIDE.draw = (pc, n, x, y, W, H) => {
  const k = ridePulse();
  for (let i = 0; i < PANELS; i++) {
    const lx = x + ((i + 0.5) * W) / PANELS;
    glowAt(lx, y - H - 1.6, 6 + 3 * k, C.pink, 0.5 + 0.4 * k);
    pg.beginPath();
    pg.arc(lx, y - H - 1.6, 1.8, 0, Math.PI * 2);
    pg.fillStyle = ink(C.pink);
    pg.fill();
  }
};
