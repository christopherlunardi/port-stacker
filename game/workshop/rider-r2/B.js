// B: lit rivets: no tag at all; the catwalk's own rivets under the container light up, one per enemy, glowing pink from the right end
// (riders) and blue from the left end (squashes)
PIPS.draw = (side, n, x, y) => {
  const W = PIECE_W * T, k = pipPulse();
  // the catwalk's rivets sit every 8 px from its left end; light the ones under this container, from its end inward
  const xs = [];
  for (let rx = 4 + Math.ceil((x - 4) / 8) * 8; rx < x + W; rx += 8) xs.push(rx);
  const pick = side === 'ride' ? xs.slice().reverse() : xs;
  for (let i = 0; i < n && i < pick.length; i++) {
    glowAt(pick[i], y + 2, 4 + 1.5 * k, pipCol(side), 0.45 + 0.25 * k);
    pg.beginPath();
    pg.arc(pick[i], y + 2, 1.6, 0, Math.PI * 2);
    pg.fillStyle = ink(pipCol(side));
    pg.fill();
    pg.lineWidth = 0.6;
    pg.strokeStyle = ink(C.indigo);
    pg.stroke();
  }
};
