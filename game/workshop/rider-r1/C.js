// C: down arrows: chevrons under the container, below the catwalk, pointing down and running downward, while anyone's aboard
RIDE.draw = (pc, n, x, y, W, H) => {
  const cx = x + W / 2, top = y + 4, step = (G.frame * 0.4) % 6, H2 = 14;
  pg.save();
  pg.beginPath();
  pg.rect(x, y + 2, W, H2);
  pg.clip();
  pg.lineCap = 'round';
  pg.lineJoin = 'round';
  for (let i = -1; i < 3; i++) {
    const yy = top + i * 6 + step, a = 1 - Math.abs(yy - (y + 2 + H2 / 2)) / (H2 / 2);
    pg.globalAlpha = Math.max(0, a);
    pg.beginPath();
    pg.moveTo(cx - 6, yy - 2.5);
    pg.lineTo(cx, yy + 2.5);
    pg.lineTo(cx + 6, yy - 2.5);
    pg.lineWidth = 3.2;
    pg.strokeStyle = ink(C.indigo);
    pg.stroke();
    pg.lineWidth = 1.8;
    pg.strokeStyle = ink(C.pink);
    pg.stroke();
  }
  pg.restore();
};
