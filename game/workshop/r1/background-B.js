// Option B: NIGHT SHIFT. A purple night sky (pink over blue) going hot pink at the horizon, a paper moon and stars, the city as a
// navy cut-out with yellow lit windows, floodlights on masts throwing yellow cones down the catwalks, work lamps over the doors,
// the ship lit up with portholes and a string of lights, pink and yellow reflections on dark water. Catwalks are yellow-lit
// walkways; ladders are paper (galvanised) so they pop off the dark.
C.nightA = [100, 210, 0]; C.nightB = [150, 185, 0]; C.nightC = [190, 160, 0]; C.nightD = [235, 115, 0]; C.nightE = [255, 60, 60];
C.glow = [60, 40, 170]; C.glow2 = [110, 80, 120]; C.cityN = [40, 255, 0]; C.cityN2 = [0, 255, 0]; C.seaN = [60, 255, 0]; C.seaN2 = [120, 255, 0];
C.lampY = [0, 0, 255]; C.lampW = [0, 0, 80];
function wsCone(x, y, h, half, c) { for (let j = 0; j < h; j++) { const w = Math.round(2 + (half - 2) * j / h); box(x - w, y + j, 2 * w + 1, 1, c); } }
function wsDiscB(cx, cy, r, c) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) paint(cx + x, cy + y, c); }
girder = function (y, a, b) { // a lit walkway: paper-yellow top with navy tread marks, a pink truss under it
  box(a, y, b - a, 1, C.navy); box(a, y + 1, b - a, 3, C.yel);
  for (let x = a + 2; x < b; x += 6) { paint(x, y + 2, C.navy); paint(x + 1, y + 2, C.navy); }
  box(a, y + 4, b - a, 1, C.navy); box(a, y + 5, b - a, 2, C.pink); box(a, y + 7, b - a, 1, C.navy);
  for (let x = a; x < b; x += 8) { paint(x + 1, y + 5, C.navy); paint(x + 2, y + 6, C.navy); paint(x + 6, y + 5, C.navy); paint(x + 5, y + 6, C.navy); }
};
ladder = function (x, y0, y1) { // galvanised: paper rails and rungs, navy outline
  for (const rx of [x - 7, x + 4]) { box(rx, y0 - 2, 4, y1 - y0 + 2, C.navy); box(rx + 1, y0 - 2, 2, y1 - y0 + 2, C.paper); }
  for (let y = y0 + 3; y < y1; y += 5) { box(x - 4, y - 1, 9, 3, C.navy); box(x - 4, y, 9, 1, C.paper); }
};
door = function (x, flip) { // an open hatch glowing pink inside, a work lamp on the lintel
  box(x, 17, 22, 23, C.navy); box(x + 2, 21, 18, 19, C.nightE); box(x + 4, 23, 14, 17, C.pink);
  for (let y = 24; y < 40; y += 4) box(x + 4, y, 14, 1, C.nightE);
  for (let i = 0; i < 22; i += 4) for (let j = 0; j < 3; j++) { paint(x + i + j, 17 + j, C.yel); paint(x + i + j + 1, 17 + j, C.yel); }
  const lx = flip ? x + 3 : x + 16; box(lx, 17, 3, 3, C.navy); box(lx, 19, 3, 2, C.yel);
};
cloud = function (x, y, w) { for (let i = 0; i < w; i++) { const h = 2 + Math.round(1.8 * Math.abs(Math.sin(i * 0.3))); box(x + i, y - h, 1, h + 1, C.nightD); } };
drawStageBG = function () {
  box(0, FY, PW, 70, C.nightA); box(0, 86, PW, 48, C.nightB); box(0, 134, PW, 40, C.nightC); box(0, 174, PW, 26, C.nightD); box(0, 200, PW, 14, C.nightE);
  for (const [x, y] of [[40, 24], [95, 30], [150, 22], [210, 36], [260, 26], [300, 44], [70, 52], [180, 58], [230, 70], [120, 48], [290, 72], [20, 66]]) { paint(x, y, C.paper); if ((x & 3) === 0) { paint(x - 1, y, C.lampW); paint(x + 1, y, C.lampW); paint(x, y - 1, C.lampW); paint(x, y + 1, C.lampW); } }
  wsDiscB(244, 58, 8, C.paper); wsDiscB(240, 55, 6, C.nightA);
  cloud(130, 150, 60); cloud(30, 170, 40); cloud(220, 180, 50);
  // floodlight masts in the gaps between columns: a pole, a lamp head, a cone of light down onto the catwalk below
  for (const [mx, top] of [[121, 44], [197, 84], [121, 124], [197, 124], [297, 44]]) {
    const yb = top + 36; box(mx, top + 2, 2, yb - top - 2, C.cityN);
    wsCone(mx + 1, top + 6, yb - top - 6, 11, C.glow2); wsCone(mx + 1, top + 6, yb - top - 6, 6, C.glow);
    box(mx - 3, top, 8, 4, C.navy); box(mx - 2, top + 3, 6, 2, C.lampY);
  }
  // the city: navy cut-out, yellow windows lit
  for (const [x, w, h] of [[0, 16, 30], [20, 12, 46], [36, 22, 20], [62, 10, 36], [78, 14, 54], [100, 20, 26], [124, 10, 40], [140, 24, 18], [170, 12, 34], [186, 18, 48], [210, 10, 24], [228, 22, 38], [254, 12, 56], [270, 20, 28], [296, 24, 42]]) {
    box(x, 212 - h, w, h, C.cityN); box(x, 212 - h, w, 1, C.cityN2);
    for (let wy = 215 - h; wy < 208; wy += 5) for (let wx = x + 2; wx < x + w - 2; wx += 4) if (((wx * 7 + wy * 3) & 7) < 3) box(wx, wy, 2, 2, C.yel);
  }
  for (const [x, h] of [[150, 40], [240, 34]]) { box(x, 212 - h, 2, h, C.cityN2); box(x + 9, 212 - h, 2, h, C.cityN2); box(x - 14, 212 - h - 3, 36, 2, C.cityN2); paint(x + 10, 212 - h - 4, C.pink); }
  // water: dark blue with pink and yellow light-streaks under the city
  box(0, 212, PW, 28, C.seaN);
  for (let y = 214; y < 240; y += 4) for (let x = ((y >> 2) & 1) * 6; x < PW; x += 12) box(x + 2, y, 7, 1, C.seaN2);
  for (let x = 2; x < PW; x += 4) { const k = ((x * 7) & 15); if (k < 6) for (let y = 213 + (k & 3); y < 238; y += 6) box(x, y, 2, 1, k < 3 ? C.yel : C.pink); }
  door(0, false); door(PW - 22, true);
  for (const l of L.ladders) ladder(l.x, l.top, l.bot);
  for (const [r, a, b] of L.def.floors) girder(rowY(r), a * T, (b + 1) * T);
  box(0, 0, PW, FY, C.navy); for (let x = 0; x < PW; x += 8) box(x, 15, 4, 1, C.yel);
};
drawShip = function (sx) { // navy hull with a pink boot stripe, lit portholes, a lit bridge, a string of lights along the rail
  const deck = L.plateY, x0 = 6 + sx, x1 = 300 + sx;
  box(x0, deck, x1 - x0, 12, C.navy); for (let j = 0; j < 12; j++) box(x0 - j, deck + j, j + 1, 1, C.navy);
  box(x0 - 7, deck + 8, x1 - x0 + 7, 3, C.pink); box(x0 - 5, deck + 11, x1 - x0 + 5, 1, C.paper);
  for (let x = x0 + 2; x < x1 - 2; x += 6) paint(x, deck - 1, (x >> 1) & 1 ? C.yel : C.pink);
  for (let x = x0 + 12; x < x1 - 4; x += 12) if (x < 120 + sx || x > 186 + sx) box(x, deck + 3, 4, 4, C.yel);
  txt('M/V PORT STACKER', 124 + sx, deck + 3, C.paper);
  box(294 + sx, deck - 40, 26, 40, C.navy); box(296 + sx, deck - 38, 22, 38, C.paper);
  for (let wy = deck - 33; wy < deck - 4; wy += 8) for (let wx = 298 + sx; wx < 316 + sx; wx += 6) box(wx, wy, 4, 4, C.yel);
  box(301 + sx, deck - 54, 11, 14, C.pink); box(301 + sx, deck - 54, 11, 3, C.navy); box(305 + sx, deck - 64, 2, 10, C.navy); paint(305 + sx, deck - 66, C.pink); paint(306 + sx, deck - 66, C.pink);
};
