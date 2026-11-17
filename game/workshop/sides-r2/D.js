// D: container stacks. This is a game about stacking containers, so the sides are stacks of them: four big containers end-on at each
// side, standing on the quay, printed lighter than the stage so they stay behind it. One on each side has its doors open: Buck stands
// in the left one, the horn sits in the right one, and the count is stenciled big on the container underneath (with the next-life bar
// bolted on below Buck's). The top containers carry the dock's name the way real ones carry their owner's.
const STK = {
  pink: [[150, 0, 0], [205, 30, 0]],
  blue: [[0, 150, 0], [40, 215, 0]],
  yel: [[0, 0, 170], [50, 0, 235]],
  orange: [[95, 0, 175], [150, 20, 235]]
};
function boxEnd(x, y, w, h, kind, open) {
  const [col, dk] = STK[kind];
  rrect(x, y, w, h, 1.5, col, C.indigo, 1.2);
  rect(x + 0.6, y + 0.6, w - 1.2, 3, dk);
  rect(x + 0.6, y + h - 3.6, w - 1.2, 3, dk);
  for (const [cx, cy] of [
    [x, y],
    [x + w - 5, y],
    [x, y + h - 4],
    [x + w - 5, y + h - 4]
  ])
    rrect(cx, cy, 5, 4, 0.8, dk, C.indigo, 0.7); // corner castings
  const ix = x + 5,
    iy = y + 5.5,
    iw = w - 10,
    ih = h - 11;
  if (open) {
    // doors swung wide: the dark inside with a lit floor, and the two doors edge-on at the sides
    rrect(ix, iy, iw, ih, 1, C.indigo, C.indigo, 0.8);
    rect(ix + 1.2, iy + 1.2, iw - 2.4, ih - 2.4, [120, 190, 0]);
    pg.fillStyle = ink(C.indigo);
    for (let k = 1; k < 6; k++) pg.fillRect(ix + (iw * k) / 6 - 0.3, iy + 1.2, 0.6, ih - 2.4);
    glowAt(x + w / 2, y + h / 2 + 2, iw * 0.62, C.cream, 0.95);
    rect(ix + 1.2, iy + ih - 5, iw - 2.4, 3.8, C.yel);
    rect(ix + 1.2, iy + ih - 5.4, iw - 2.4, 0.7, C.indigo);
    rrect(x + 1, iy - 0.5, 4, ih + 1, 0.8, dk, C.indigo, 0.8);
    rrect(x + w - 5, iy - 0.5, 4, ih + 1, 0.8, dk, C.indigo, 0.8);
    return;
  }
  // closed doors: ribs, the seam, two lock rods a door with their handles
  pg.fillStyle = ink(dk);
  for (let ry = iy + 3; ry < iy + ih - 1; ry += 5) pg.fillRect(ix, ry, iw, 1.1);
  rrect(ix, iy, iw, ih, 0.8, null, C.indigo, 0.7);
  rect(x + w / 2 - 0.4, iy, 0.8, ih, C.indigo);
  for (const f of [0.16, 0.36, 0.64, 0.84]) {
    const rx = ix + iw * f;
    rect(rx - 0.45, iy + 1, 0.9, ih - 2, C.indigo);
    rect(rx - 1.1, iy + 2, 2.2, 1.4, C.indigo);
    rect(rx - 1.1, iy + ih - 3.4, 2.2, 1.4, C.indigo);
    rrect(rx - (f < 0.5 ? 0 : 4), iy + ih * 0.56, 4, 1.5, 0.6, C.cream, C.indigo, 0.5);
  }
}
// lettering painted on a container: a flat panel of its darker color over the ribs and rods, then the words
function paintPanel(cx, cy, pw, ph, kind) {
  rrect(cx - pw / 2, cy - ph / 2, pw, ph, 2.5, STK[kind][1], C.indigo, 0.9);
}
function stencil(s, x, y, size, o) {
  textF(FONT_MAIN, s, x, y, size, C.cream, 'center', null, o);
}
function upArrows(cx, y) {
  for (const d of [-7, 7]) {
    pg.beginPath();
    pg.moveTo(cx + d, y - 6);
    pg.lineTo(cx + d + 5, y);
    pg.lineTo(cx + d + 2, y);
    pg.lineTo(cx + d + 2, y + 6);
    pg.lineTo(cx + d - 2, y + 6);
    pg.lineTo(cx + d - 2, y);
    pg.lineTo(cx + d - 5, y);
    pg.closePath();
    pg.fillStyle = ink(C.cream);
    pg.fill();
  }
}
SIDES.draw = pop => {
  const { ox, oy } = LAY,
    w = Math.min(ox - 7, 66),
    H = 61,
    base = oy + 250,
    name = L.def.name.split(' ');
  const stack = (cx, kinds, jog, fill) => {
    // the quay under them, in the water
    const qx = cx - w / 2 - 3;
    rrect(qx, base, w + 6, 6, 1, C.cream, C.indigo, 1.1);
    rect(qx + 1.5, base + 6, w + 3, PH - (base - oy) - 6, [70, 150, 0]);
    pg.fillStyle = ink(C.indigo);
    for (let x = qx + 6; x < qx + w + 2; x += 9) pg.fillRect(x, base + 6, 0.8, 40);
    rect(qx + 1.5, base + 6, w + 3, 0.9, C.indigo);
    for (let i = 3; i >= 0; i--) {
      const x = cx - w / 2 + jog[i],
        y = base - (4 - i) * H;
      if (i < 3) rect(x + 2, y + H - 1.2, w - 4, 1.6, C.indigo); // the gap's shadow
      boxEnd(x, y, w, H, kinds[i], i === 1);
      fill(i, cx + jog[i], y);
    }
  };
  const tag = (cx, y, kind) => {
    paintPanel(cx, y + 30, w - 18, 30, kind);
    stencil(name[0] || '', cx, y + 24, 8, { maxW: w - 24, track: 0.5 });
    stencil(name.slice(1).join(' ') || 'DOCK', cx, y + 35.5, 8, { maxW: w - 24, track: 0.5 });
  };
  const count = (cx, cy, n, s, kind) => {
    paintPanel(cx, cy, w - 18, 28, kind);
    popAt(cx, cy, s, () => textF(FONT_MAIN, 'x' + n, cx, cy + 0.5, 22, C.cream, 'center', C.indigo, { maxW: w - 26 }));
  };
  stack(ox - 3.5 - w / 2, ['yel', 'blue', 'pink', 'orange'], [1.5, -1, 0.5, -1.5], (i, cx, y) => {
    if (i === 0) {
      paintPanel(cx, y + 30, w - 18, 30, 'yel');
      upArrows(cx, y + 25);
      stencil('THIS WAY UP', cx, y + 39, 4.6, { maxW: w - 24 });
    }
    if (i === 1) popAt(cx, y + 32, pop.l, () => art('buck.stand', cx, y + H - 9.6, { scale: 1.45 }));
    if (i === 2) {
      count(cx, y + 24, livesNow(), pop.l, 'pink');
      rrect(cx - 23, y + 43, 46, 9, 3, C.cream, C.indigo, 1);
      lifeBarAt(cx, y + 47.5, 38);
    }
    if (i === 3) tag(cx, y, 'orange');
  });
  stack(ox + PW + 3.5 + w / 2, ['orange', 'pink', 'blue', 'yel'], [-1.5, 1, -0.5, 1.5], (i, cx, y) => {
    if (i === 0) tag(cx, y, 'orange');
    if (i === 1) popAt(cx, y + 30, pop.h, () => hornIcon(cx + 5.5, y + 30, 3.5));
    if (i === 2) count(cx, y + 30.5, hornsNow(), pop.h, 'blue');
    if (i === 3) {
      paintPanel(cx, y + 30, w - 18, 30, 'yel');
      upArrows(cx, y + 25);
      stencil('THIS WAY UP', cx, y + 39, 4.6, { maxW: w - 24 });
    }
  });
  sideWater();
};
