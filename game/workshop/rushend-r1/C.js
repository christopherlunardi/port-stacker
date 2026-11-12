// C: a badge over Buck: the number in a round badge riding above his hat, with a ring around it that drains through the second
RUSHN.draw = (n, age, p) => {
  const cx = p.x, cy = p.y - 46, r = 11 * rnPop(age), k = 1 - age / 60;
  pg.beginPath(); pg.arc(cx, cy, r, 0, Math.PI * 2); pg.fillStyle = ink(n === 1 ? C.pink : C.indigo); pg.fill();
  pg.beginPath(); pg.arc(cx, cy, r + 2.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); pg.strokeStyle = ink(C.yel); pg.lineWidth = 2.5; pg.stroke();
  textF(FONT_MAIN, String(n), cx, cy + 0.8, 14 * rnPop(age), C.cream, 'center');
};
