// Option A: HARBOR MORNING. Closest to the concept sheet: a clear blue day sky going pink at the horizon, chunky paper clouds,
// a big yellow quay crane standing behind the left edge with its jib across the top, a mid-blue city with far cranes behind
// the ship, blue water. Catwalks are cream walkways with pink hazard stripes; ladders yellow; doors are navy roll-up hatches.
C.skyA1 = [0, 96, 0]; C.skyA2 = [0, 76, 0]; C.skyA3 = [18, 56, 0]; C.skyA4 = [60, 38, 0]; C.haze = [90, 24, 0];
C.cityA = [0, 150, 0]; C.cityA2 = [10, 118, 0]; C.craneY = [0, 0, 120]; C.seaA = [0, 205, 0]; C.seaA2 = [40, 215, 0];
function wsDisc(cx, cy, r, c) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) paint(cx + x, cy + y, c); }
function wsCloud(x, y, w, fill, line) { // chunky puffs along w with a flat bottom at y, outlined
  const n = Math.max(2, Math.round(w / 11)), puffs = [];
  for (let i = 0; i < n; i++) { const t = i / (n - 1), r = 4 + Math.round(3.5 * Math.sin(Math.PI * (0.2 + 0.6 * t))) + ((i * 5) % 2); puffs.push([x + 6 + Math.round(t * (w - 12)), y - r + 2, r]); }
  const inside = (px, py) => py <= y && puffs.some(([cx, cy, r]) => (px - cx) * (px - cx) + (py - cy) * (py - cy) <= r * r + 1);
  for (let py = y - 16; py <= y + 1; py++) for (let px = x - 3; px <= x + w + 3; px++) {
    if (inside(px, py)) paint(px, py, fill);
    else if (line && (inside(px - 1, py) || inside(px + 1, py) || inside(px, py - 1) || inside(px, py + 1))) paint(px, py, line);
  }
}
function wsFarCrane(x, yb, h, c, flip) { // a quay crane far off: two legs, a platform, a boom out one side, a little A-frame on top
  const d = flip ? -1 : 1;
  box(x, yb - h, 2, h, c); box(x + 9, yb - h, 2, h, c);
  for (let j = 0; j < h - 6; j += 6) { paint(x + 3, yb - h + 2 + j, c); paint(x + 5, yb - h + 3 + j, c); paint(x + 7, yb - h + 4 + j, c); }
  box(x - 2, yb - h - 2, 15, 3, c); box(x + 3, yb - h + 1, 5, 4, c);
  box(flip ? x - 20 : x + 5, yb - h - 4, 26, 2, c); box(x + 5, yb - h - 14, 2, 10, c);
  for (let k = 0; k < 12; k++) { paint(x + 6 + d * k, yb - h - 13 + k, c); paint(x + 6 + d * (k + 12), yb - h - 3 - Math.round(k * 0.2), c); }
}
girder = function (y, a, b) { // cream walkway with pink hazard stripes, a navy edge, a pink truss under it
  box(a, y, b - a, 1, C.navy); box(a, y + 1, b - a, 3, C.paper);
  for (let x = a + 1; x < b; x += 7) for (let j = 0; j < 3; j++) { paint(x + j, y + 1 + j, C.pink); paint(x + j + 1, y + 1 + j, C.pink); }
  box(a, y + 4, b - a, 1, C.navy); box(a, y + 5, b - a, 2, C.pinkD); box(a, y + 7, b - a, 1, C.navy);
  for (let x = a; x < b; x += 8) { paint(x + 1, y + 5, C.navy); paint(x + 2, y + 6, C.navy); paint(x + 6, y + 5, C.navy); paint(x + 5, y + 6, C.navy); }
};
ladder = function (x, y0, y1) { // yellow rails and rungs with navy outlines
  for (const rx of [x - 7, x + 4]) { box(rx, y0 - 2, 4, y1 - y0 + 2, C.navy); box(rx + 1, y0 - 2, 2, y1 - y0 + 2, C.yel); }
  for (let y = y0 + 3; y < y1; y += 5) { box(x - 4, y - 1, 9, 3, C.navy); box(x - 4, y, 9, 1, C.yel); }
};
door = function (x, flip) { // a roll-up hatch: navy frame, hazard chevrons on the lintel, pink slats, a lamp on the inner post
  box(x, 17, 22, 23, C.navy); box(x + 2, 22, 18, 18, C.pinkL);
  for (let y = 23; y < 40; y += 3) box(x + 2, y, 18, 1, C.pink);
  for (let i = 0; i < 22; i += 4) for (let j = 0; j < 3; j++) { paint(x + i + j, 17 + j, C.yel); paint(x + i + j + 1, 17 + j, C.yel); }
  box(x + 2, 20, 18, 2, C.navy);
  const lx = flip ? x + 2 : x + 17; box(lx, 25, 3, 4, C.yel); box(lx, 24, 3, 1, C.navy);
};
cloud = function (x, y, w) { wsCloud(x, y, w, C.paper, C.blueL); };
drawStageBG = function () {
  box(0, FY, PW, 76, C.skyA1); box(0, 92, PW, 50, C.skyA2); box(0, 142, PW, 36, C.skyA3); box(0, 178, PW, 20, C.skyA4); box(0, 198, PW, 14, C.haze);
  wsDisc(112, 196, 10, C.yel); wsDisc(112, 196, 8, C.yelD); box(104, 196, 17, 10, C.haze);
  // the quay crane behind the left edge: a lattice tower and a jib across the top with a spreader hanging in the first gap
  const TW = C.craneY, TL = C.blueL; // the tower is printed lighter than the ladders so they stay the thing you climb
  box(20, 17, 10, 196, TW); box(20, 17, 1, 196, TL); box(29, 17, 1, 196, TL);
  for (let y = 20; y < 210; y += 12) { for (let k = 0; k < 8; k++) { paint(21 + k, y + k, TL); paint(28 - k, y + k, TL); } }
  box(18, 17, 126, 5, TW); box(18, 17, 126, 1, TL); box(18, 21, 126, 1, TL); for (let x = 22; x < 142; x += 6) paint(x, 19, TL);
  box(142, 18, 3, 4, TL); box(119, 22, 2, 30, TL); box(113, 52, 14, 5, C.yel); box(113, 52, 14, 1, C.navy); box(113, 56, 14, 1, C.navy); for (let k = 0; k < 7; k++) paint(114 + k * 2, 54, C.navy);
  cloud(44, 62, 36); cloud(150, 60, 52); cloud(262, 100, 44); cloud(112, 134, 30); cloud(236, 136, 24);
  // the far city and its cranes, behind the ship
  for (const [x, w, h, c] of [[0, 14, 24, C.cityA], [34, 12, 40, C.cityA2], [48, 20, 18, C.cityA], [70, 10, 30, C.cityA], [96, 8, 44, C.cityA2], [126, 24, 26, C.cityA], [152, 10, 36, C.cityA2], [164, 18, 14, C.cityA],
                               [184, 12, 32, C.cityA], [226, 16, 22, C.cityA], [244, 10, 46, C.cityA2], [258, 24, 30, C.cityA], [284, 12, 20, C.cityA], [300, 20, 36, C.cityA2]]) {
    box(x, 212 - h, w, h, c); for (let wy = 216 - h; wy < 208; wy += 5) for (let wx = x + 2; wx < x + w - 2; wx += 4) if (((wx * 7 + wy * 3) & 7) < 3) box(wx, wy, 2, 2, C.paper);
  }
  wsFarCrane(8, 212, 30, C.navy, false); wsFarCrane(200, 212, 34, C.navy, true); wsFarCrane(290, 212, 26, C.navy, true);
  // water
  box(0, 212, PW, 28, C.seaA); box(0, 212, PW, 1, C.navy);
  for (let y = 215; y < 240; y += 6) for (let x = ((y / 6) & 1) * 5; x < PW; x += 10) { box(x + 1, y, 5, 1, C.paper); }
  for (let y = 218; y < 240; y += 6) for (let x = ((y / 6) & 1) * 7; x < PW; x += 14) box(x + 3, y, 6, 1, C.seaA2);
  door(0, false); door(PW - 22, true);
  for (const l of L.ladders) ladder(l.x, l.top, l.bot);
  for (const [r, a, b] of L.def.floors) girder(rowY(r), a * T, (b + 1) * T);
  box(0, 0, PW, FY, C.navy); for (let x = 0; x < PW; x += 8) box(x, 15, 4, 1, C.yel);
};
drawShip = function (sx) { // navy hull with a pink boot stripe, a raked bow, paper portholes, a cream bridge aft
  const deck = L.plateY, x0 = 6 + sx, x1 = 300 + sx;
  box(x0, deck, x1 - x0, 12, C.navy); for (let j = 0; j < 12; j++) box(x0 - j, deck + j, j + 1, 1, C.navy);
  box(x0 - 7, deck + 8, x1 - x0 + 7, 3, C.pink); box(x0 - 5, deck + 11, x1 - x0 + 5, 1, C.paper);
  box(x0, deck, x1 - x0, 1, C.pinkL);
  for (let x = x0 + 12; x < x1 - 4; x += 12) if (x < 120 + sx || x > 186 + sx) { box(x, deck + 3, 4, 4, C.paper); paint(x + 1, deck + 4, C.blueL); }
  txt('M/V PORT STACKER', 124 + sx, deck + 3, C.paper);
  box(294 + sx, deck - 40, 26, 40, C.navy); box(296 + sx, deck - 38, 22, 38, C.paper); box(296 + sx, deck - 38, 22, 2, C.pink);
  for (let wy = deck - 33; wy < deck - 4; wy += 8) for (let wx = 298 + sx; wx < 316 + sx; wx += 6) { box(wx, wy, 4, 4, C.blue); paint(wx, wy, C.paper); }
  box(296 + sx, deck - 20, 22, 1, C.navy);
  box(301 + sx, deck - 54, 11, 14, C.pink); box(301 + sx, deck - 54, 11, 3, C.navy); box(301 + sx, deck - 48, 11, 2, C.yel); box(305 + sx, deck - 64, 2, 10, C.navy); box(303 + sx, deck - 62, 6, 1, C.navy);
};
