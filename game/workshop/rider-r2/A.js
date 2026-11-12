// A: tags on the catwalk: the same little tags, now lying on the yellow catwalk under the container's ends (pink right: riders; blue left:
// squashes), one cream dot per enemy, the newest pulsing
PIPS.draw = (side, n, x, y) => {
  const tw = 5 + n * 4.5, tx = side === 'ride' ? x + PIECE_W * T - tw - 2 : x + 2;
  rrect(tx, y - 0.3, tw, 5.6, 2.6, pipCol(side), C.indigo, 0.8);
  for (let i = 0; i < n; i++) {
    pg.beginPath();
    pg.arc(tx + 4.8 + i * 4.5, y + 2.5, 1.4 + (i === n - 1 ? 0.3 * pipPulse() : 0), 0, Math.PI * 2);
    pg.fillStyle = ink(C.cream);
    pg.fill();
  }
};
