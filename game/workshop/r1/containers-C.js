// Option C: BOLD POSTER GRAPHIC. Big flat shapes, no ribs: a solid colour slab with a thin navy edge, a hazard-chevron block of navy
// and yellow at the door end, and the code in navy on a white sticker in the middle of all that colour. Along the roof runs one
// continuous navy light bar with 8 square windows: the container's own dark shade when off, a white-hot yellow pane when lit, so the
// lit count reads like a progress meter from across the room.
C.orangeL = [60, 0, 110];
KIND.orange = [C.orange, C.orangeD, C.orangeL];
drawContainer = function (x, yb, type, segs, doorsLeft, tag) {
  const [base, dark, light] = KIND[type], W = PIECE_W * T, H = PIECEDEF[type].h, y = yb - H;
  // the slab: colour with a 1px navy edge, a light line along the top and a dark one along the floor
  box(x, y, W, H, C.navy); box(x + 1, y + 1, W - 2, H - 2, base);
  box(x + 1, y + 1, W - 2, 1, light); box(x + 1, yb - 2, W - 2, 1, dark);
  // the door end: a hazard block of navy and yellow diagonals, 14 wide
  const d0 = doorsLeft ? x + 1 : x + W - 15;
  box(d0, y + 1, 14, H - 2, C.yel);
  for (let j = 0; j < H - 2; j++) for (let i = 0; i < 14; i++) if (((i + j) & 7) < 4) paint(d0 + i, y + 1 + j, C.navy);
  box(doorsLeft ? d0 + 14 : d0 - 1, y + 1, 1, H - 2, C.navy);    // the seam
  // the sticker: a white label with the code in navy, centred on the plain part
  const p0 = doorsLeft ? x + 16 : x + 1, pw = W - 17, lw = 18, l0 = Math.round(p0 + (pw - lw) / 2);
  box(l0, y + 3, lw, 8, C.paper); box(l0, y + 3, lw, 1, light);
  txt(tag, l0 + lw / 2 + 1, y + 5, C.navy, 1, 'center');
  // the light bar along the roof: one navy rail, 8 windows
  box(x, y - 3, W, 3, C.navy);
  for (let s = 0; s < PIECE_W; s++) {
    const sx = x + 1 + s * 8, lit = segs && segs[s];
    if (lit) { box(sx, y - 3, 6, 3, C.yel); box(sx + 1, y - 3, 4, 1, C.paper); }
    else box(sx + 1, y - 2, 4, 2, dark);
  }
};
