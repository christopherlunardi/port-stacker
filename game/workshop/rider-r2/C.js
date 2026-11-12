// C: tags hanging under the catwalk: the tags hang just below the yellow beam under the container's ends, like labels clipped to it
// (pink right: riders; blue left: squashes)
PIPS.draw = (side, n, x, y) => {
  const tw = 6 + n * 5, tx = side === 'ride' ? x + PIECE_W * T - tw - 3 : x + 3;
  rrect(tx, y + 5.5, tw, 7, 2.5, pipCol(side), C.indigo, 0.8);
  for (let i = 0; i < n; i++) {
    pg.beginPath();
    pg.arc(tx + 5.5 + i * 5, y + 9, 1.7 + (i === n - 1 ? 0.3 * pipPulse() : 0), 0, Math.PI * 2);
    pg.fillStyle = ink(C.cream);
    pg.fill();
  }
};
