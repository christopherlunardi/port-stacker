// B: ICONS IN THE CORNERS. A little Buck for each life in the bottom-left corner and a horn for each blast in the bottom-right, three to
// a row on a cream card, in the clear water beside the ship's stern and bow. More than six shows as icon x number.
function drawCorners(lives, horn, pop) {
  const box = (x0, n, draw, s) => { pg.save(); pg.translate(x0 + 16, PH - 38); pg.scale(s, s); rrect(-16, -13, 32, 27, 5, C.cream, C.indigo, 1);
    if (n > 6) { draw(-7, 5); textF(FONT_MAIN, 'x' + n, 7, -0.5, 8, C.pink, 'center'); }
    else for (let i = 0; i < n; i++) draw(-9.5 + (i % 3) * 9.5, i < 3 ? -1 : 11);
    pg.restore(); };
  box(2, lives, (x, y) => art('buck.stand', x, y, { scale: 0.4 }), pop.l);
  box(PW - 34, horn, (x, y) => hornIcon(x + 1, y - 5, 0.95), pop.h);
}
