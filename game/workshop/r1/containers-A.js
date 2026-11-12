// Option A: CLASSIC RIBBED STEEL. A real intermodal box: corrugated sides with a white shine along the top rail, navy corner
// castings with twist-lock holes, a pair of doors with lock bars and yellow handles at one end, the code stencilled at the other.
// Latches are twist-lock cones on the roof: a dark socket when off, a yellow cone with a white hot spot when lit.
drawContainer = function (x, yb, type, segs, doorsLeft, tag) {
  const [base, rib] = KIND[type], W = PIECE_W * T, H = PIECEDEF[type].h, y = yb - H;
  const d0 = doorsLeft ? x + 4 : x + W - 17;          // the door panel, 13 wide
  const tx0 = doorsLeft ? x + W - 18 : x + 6;          // the stencil, 11 wide
  box(x, y, W, H, base);
  for (let i = x + 4; i < x + W - 4; i += 4) {         // corrugation: 2 dark, 2 light
    if (i >= d0 - 2 && i < d0 + 14) continue;
    if (i >= tx0 - 3 && i < tx0 + 13) continue;
    box(i, y + 4, 2, H - 6, rib);
  }
  box(x + 3, y + 2, W - 6, 1, C.paper);                // the top rail catches the light
  box(x + 3, yb - 2, W - 6, 1, rib);                   // the bottom rail in shadow
  // doors: a navy frame, a centre seam, two lock bars with yellow handles
  box(d0, y + 3, 13, H - 5, rib); box(d0 + 1, y + 4, 5, H - 7, base); box(d0 + 7, y + 4, 5, H - 7, base);
  box(d0 + 6, y + 3, 1, H - 5, C.navy);
  for (const bx of [d0 + 3, d0 + 9]) { box(bx, y + 4, 1, H - 7, C.navy); box(bx - 1, y + 7, 3, 2, C.yel); paint(bx, y + 7, C.paper); }
  // stencilled code: white letters with a navy shadow, straight onto the steel
  txt(tag, tx0 + 1, y + 6, C.navy); txt(tag, tx0, y + 5, C.paper);
  // frame and corner castings
  box(x, y, W, 2, C.navy); box(x, yb - 1, W, 1, C.navy); box(x, y, 2, H, C.navy); box(x + W - 2, y, 2, H, C.navy);
  for (const [cx, cy] of [[x, y], [x + W - 4, y], [x, yb - 3], [x + W - 4, yb - 3]]) { box(cx, cy, 4, 3, C.navy); box(cx + 1, cy + 1, 2, 1, C.yel); }
  // twist-lock cones: 6 wide at the foot, 4 at the tip, sitting on the roof
  for (let s = 0; s < PIECE_W; s++) {
    const lx = x + 1 + s * 8, lit = segs && segs[s];
    if (lit) { box(lx - 1, y - 3, 8, 3, C.navy); box(lx + 1, y - 3, 4, 2, C.paper); box(lx + 1, y - 1, 4, 1, C.yel); }
    else { box(lx, y - 2, 6, 2, C.navy); box(lx + 2, y - 1, 2, 1, base); }
  }
};
