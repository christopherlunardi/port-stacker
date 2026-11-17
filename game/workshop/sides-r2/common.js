// Workshop sides round 2 (Chris 2026-11-17, the Pocket 6 / wide screens; designed by Fable): what fills the room beside the field.
// Lives and horns leave the bottom corners for the sides, nothing is shown twice, and the field no longer just stops at a hard edge.
// Each option sets SIDES.draw(pop), called in screen units (0..LAY.LW across, the field from LAY.ox to LAY.ox + PW, LAY.oy down).
// pop: { l, h } the little jump of a count that just changed. With no room at the sides (4:3, phones) nothing changes at all.
const SIDES = { draw: null, min: 48 };
const sidesOn = () => SIDES.draw && LAY.ox >= SIDES.min;
const _scb = drawCornerBadges;
drawCornerBadges = function () {
  if (sidesOn()) return;
  return _scb.apply(this, arguments);
};
drawSides = function () {
  if (sidesOn()) SIDES.draw(hudPop());
};
// the two strips: [x0, x1, the edge that touches the field, which way is away from the field (-1 left, 1 right)]
const sideStrips = () => [
  [0, LAY.ox, LAY.ox, -1],
  [LAY.ox + PW, LAY.LW, LAY.ox + PW, 1]
];
// the near water strip runs on to the screen's edges (it used to stop at the field's), in step with the field's own waves
function sideWater() {
  const { ox, oy } = LAY,
    y = oy + PH;
  for (const [x0, x1] of sideStrips()) {
    pg.save();
    pg.beginPath();
    pg.rect(x0, y - 4, x1 - x0, 5);
    pg.clip();
    rect(x0, y - 3, x1 - x0, 3, C.blue);
    pg.strokeStyle = ink(C.cream);
    pg.lineWidth = 0.8;
    pg.beginPath();
    const ph = ox + ((G.frame * 0.2) % 12) - 12;
    for (let x = ph - 12 * Math.ceil((ph - x0 + 12) / 12); x < x1; x += 12) {
      pg.moveTo(x, y - 1.5);
      pg.quadraticCurveTo(x + 3, y - 3, x + 6, y - 1.5);
    }
    pg.stroke();
    pg.restore();
  }
}
// the life bar on its own, centered at x, y, w wide (lifeBar() draws at -16..16, 4.6)
function lifeBarAt(x, y, w) {
  pg.save();
  pg.translate(x, y);
  pg.scale(w / 32, w / 32);
  pg.translate(0, -6.1);
  lifeBar();
  pg.restore();
}
// draw something scaled about a point (the pop of a count that changed)
function popAt(x, y, s, fn) {
  pg.save();
  pg.translate(x, y);
  pg.scale(s, s);
  pg.translate(-x, -y);
  fn();
  pg.restore();
}
const livesNow = () => Math.max(0, G.lives);
const hornsNow = () => (G.p ? G.p.horns : 0);
