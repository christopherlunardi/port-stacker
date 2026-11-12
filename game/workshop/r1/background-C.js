// Option C: SCREENPRINT POSTER. Flat and graphic, like a gig poster: bare paper sky with a huge pink sun and rays, a flat navy
// cut-out of the port (gantry cranes, container stacks, a lighthouse) with no detail inside it, blue water in bold zigzags.
// Catwalks are heavy navy beams with a yellow top and pink diagonal stripes; ladders solid navy with yellow rungs; the doors are
// flat pink squares with a navy chevron; the band is navy over a yellow rule.
C.sunP = [255, 0, 0]; C.sunL = [150, 0, 20]; C.ray = [60, 0, 0]; C.cut = [0, 255, 0]; C.cut2 = [40, 215, 0]; C.seaC = [0, 215, 0]; C.seaZ = [0, 0, 255];
function wsDiscC(cx, cy, r, c) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) paint(cx + x, cy + y, c); }
function wsRays(cx, cy, n, c, r0, r1) { // flat rays from a centre: alternate wedges filled, clipped to the field
  for (let y = FY; y < 212; y++) for (let x = 0; x < PW; x++) { const dx = x - cx, dy = y - cy, d = Math.sqrt(dx * dx + dy * dy); if (d < r0 || d > r1) continue;
    const a = Math.atan2(dy, dx); if (Math.floor((a / Math.PI + 1) * n) % 2 === 0) paint(x, y, c); }
}
function wsGantry(x, yb, h, w, c) { // a flat gantry crane: two legs, a bridge, a boom out to the right, an A-frame
  box(x, yb - h, 4, h, c); box(x + w - 4, yb - h, 4, h, c); box(x - 3, yb - h - 4, w + 6, 5, c); box(x + w - 1, yb - h - 4, 30, 3, c);
  box(x + w / 2 - 2, yb - h - 12, 4, 8, c); for (let k = 0; k < 8; k++) { box(x + w / 2 + k * 2, yb - h - 12 + k, 2, 1, c); box(x + w / 2 - k * 2 - 1, yb - h - 12 + k, 2, 1, c); }
  box(x + 4, yb - h + 8, w - 8, 3, c);
}
function wsStack(x, yb, cols, rows, c, hole) { for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { if (hole && hole(i, j)) continue; box(x + i * 22, yb - (j + 1) * 9, 20, 8, c); } }
girder = function (y, a, b) { // a heavy navy beam: yellow top you stand on, pink diagonal stripes through the web
  box(a, y, b - a, 1, C.navy); box(a, y + 1, b - a, 2, C.yel); box(a, y + 3, b - a, 5, C.navy);
  for (let x = a; x < b; x += 8) for (let j = 0; j < 3; j++) { paint(x + 1 + j, y + 4 + j, C.pink); paint(x + 2 + j, y + 4 + j, C.pink); }
};
ladder = function (x, y0, y1) { // solid navy rails and yellow rungs
  box(x - 7, y0 - 2, 4, y1 - y0 + 2, C.navy); box(x + 4, y0 - 2, 4, y1 - y0 + 2, C.navy);
  for (let y = y0 + 3; y < y1; y += 5) { box(x - 4, y - 1, 9, 3, C.navy); box(x - 4, y, 9, 1, C.yel); }
};
door = function (x, flip) { // a flat pink hatch with a navy chevron pointing into the field
  box(x, 17, 22, 23, C.navy); box(x + 2, 19, 18, 21, C.pink);
  const d = flip ? -1 : 1, cx = flip ? x + 14 : x + 7;
  for (let k = 0; k < 6; k++) { box(cx + d * k, 23 + k, 2, 1, C.navy); box(cx + d * k, 35 - k, 2, 1, C.navy); } box(cx + d * 6, 29, 2, 1, C.navy);
  box(x + 2, 19, 18, 2, C.yel);
};
cloud = function (x, y, w) { box(x, y - 2, w, 4, C.paper); box(x + 5, y - 5, w - 14, 3, C.paper); box(x + 9, y - 7, w - 24, 2, C.paper); };
drawStageBG = function () {
  box(0, FY, PW, 196, C.paper);
  const SX = 160, SY = 210, SR = 48; // a big sun setting behind the port, under the lowest catwalk; its rays fan up through the whole sky
  wsRays(SX, SY, 14, C.ray, SR + 4, 600);
  wsDiscC(SX, SY, SR, C.sunP);
  for (let y = SY - 30; y < SY; y += 6) { const h = Math.round(Math.sqrt(SR * SR - (y - SY) * (y - SY))); box(SX - h, y, 2 * h, 1 + ((y - SY + 30) / 10 | 0), C.paper); }
  // the port as a flat cut-out, kept under the lowest catwalk and off the sun
  box(0, 202, PW, 10, C.cut);
  wsGantry(8, 202, 20, 34, C.cut); wsGantry(258, 202, 16, 34, C.cut);
  wsStack(216, 202, 2, 2, C.cut, (i, j) => i === 1 && j > 0);
  box(62, 174, 8, 28, C.cut); box(60, 172, 12, 3, C.cut); box(59, 166, 14, 6, C.cut); box(62, 168, 8, 3, C.yel); box(64, 162, 4, 4, C.cut);
  // water: flat blue with paper zigzag crests
  box(0, 212, PW, 28, C.seaC);
  for (let y = 215; y < 240; y += 8) for (let x = ((y >> 3) & 1) * 6; x < PW; x += 12) for (let k = 0; k < 6; k++) { paint(x + k, y + (k < 3 ? k : 5 - k), C.paper); paint(x + k + 1, y + (k < 3 ? k : 5 - k), C.paper); }
  door(0, false); door(PW - 22, true);
  for (const l of L.ladders) ladder(l.x, l.top, l.bot);
  for (const [r, a, b] of L.def.floors) girder(rowY(r), a * T, (b + 1) * T);
  box(0, 0, PW, FY, C.navy); box(0, FY - 2, PW, 2, C.yel);
};
drawShip = function (sx) { // a flat navy hull, a yellow deck line, pink boot stripe, bare-paper bridge with a navy window band
  const deck = L.plateY, x0 = 6 + sx, x1 = 300 + sx;
  box(x0, deck, x1 - x0, 12, C.navy); for (let j = 0; j < 12; j++) box(x0 - j, deck + j, j + 1, 1, C.navy);
  box(x0 - 7, deck + 8, x1 - x0 + 7, 3, C.pink); box(x0 - 2, deck, x1 - x0 + 2, 1, C.yel);
  for (let x = x0 + 12; x < x1 - 4; x += 12) if (x < 120 + sx || x > 186 + sx) box(x, deck + 3, 4, 4, C.paper);
  txt('M/V PORT STACKER', 124 + sx, deck + 3, C.paper);
  box(294 + sx, deck - 40, 26, 40, C.navy); box(296 + sx, deck - 38, 22, 38, C.paper); box(296 + sx, deck - 30, 22, 6, C.navy); box(296 + sx, deck - 16, 22, 6, C.navy);
  box(301 + sx, deck - 54, 11, 14, C.pink); box(301 + sx, deck - 54, 11, 3, C.navy); box(305 + sx, deck - 64, 2, 10, C.navy); box(303 + sx, deck - 62, 6, 2, C.yel);
};
