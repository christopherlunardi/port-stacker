// Option B: CHUNKY TOY BLOCKS. Rounded-corner boxes like plastic toy containers: a fat navy outline with knocked-off corners, a
// wide white highlight band along the top, a two-tone body (light top, full colour bottom) and a round white label with the code.
// The latches are big round studs across the roof like the pegs on a building block: a dark dimple when off, a fat yellow-and-white
// button when lit.
C.orangeL = [60, 0, 110];
KIND.pink = [C.pink, C.pinkD, C.pinkL]; KIND.yel = [C.yel, C.yelD, C.yelL]; KIND.blue = [C.blue, C.blueD, C.blueL]; KIND.orange = [C.orange, C.orangeD, C.orangeL];
drawContainer = function (x, yb, type, segs, doorsLeft, tag) {
  const [base, dark, light] = KIND[type], W = PIECE_W * T, H = PIECEDEF[type].h, y = yb - H;
  // outline: a rounded slab
  box(x + 1, y, W - 2, H, C.navy); box(x, y + 1, W, H - 2, C.navy);
  // body: light upper half, full colour lower half, a dark shadow line on the floor
  box(x + 2, y + 2, W - 4, H - 4, base); box(x + 1, y + 3, W - 2, H - 6, base);
  box(x + 2, y + 2, W - 4, 4, light); box(x + 1, y + 3, W - 2, 3, light);
  box(x + 2, y + 2, W - 4, 1, C.paper);                          // the shine
  box(x + 2, yb - 3, W - 4, 1, dark); box(x + 1, yb - 4, W - 2, 1, dark);
  // a door end: three fat vertical bars
  const d0 = doorsLeft ? x + 4 : x + W - 14;
  box(d0 - 1, y + 2, 12, H - 4, dark);
  for (let k = 0; k < 3; k++) { box(d0 + k * 4, y + 3, 2, H - 6, C.navy); box(d0 + k * 4 + 2, y + 3, 1, H - 6, C.paper); }
  // a round white label with the code
  const lx0 = doorsLeft ? x + W - 22 : x + 6;
  box(lx0 + 1, y + 3, 16, H - 6, C.paper); box(lx0, y + 4, 18, H - 8, C.paper);
  txt(tag, lx0 + 4, y + 5, C.navy);
  // studs on the roof
  for (let s = 0; s < PIECE_W; s++) {
    const sx = x + 1 + s * 8, lit = segs && segs[s];
    if (lit) { box(sx - 1, y - 3, 8, 3, C.navy); box(sx, y - 3, 6, 3, C.yel); box(sx + 1, y - 3, 4, 1, C.paper); paint(sx, y - 2, C.paper); }
    else { box(sx, y - 2, 6, 2, C.navy); box(sx + 1, y - 2, 4, 1, dark); }
  }
};
