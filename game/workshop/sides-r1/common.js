// Workshop sides round 1 (Chris 2026-11-17, the Pocket 6 / wide screens): lives and horns move off the bottom into the room beside the
// field, the side room gets filled in properly, nothing shown twice (the score stays in the top bar only). Each option sets SIDES.draw(),
// called in screen units (0..LAY.LW across, the field from LAY.ox to LAY.ox + PW). With no room at the sides (4:3, phones) the bottom
// badges stay as they are.
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
// the near water strip runs on to the screen's edges (it used to stop at the field's)
function sideWater() {
  const { ox, oy, LW } = LAY,
    y = oy + PH;
  for (const [x0, x1] of [
    [0, ox],
    [ox + PW, LW]
  ]) {
    pg.save();
    pg.beginPath();
    pg.rect(x0, y - 4, x1 - x0, 5);
    pg.clip();
    rect(x0, y - 3, x1 - x0, 3, C.blue);
    pg.strokeStyle = ink(C.cream);
    pg.lineWidth = 0.8;
    pg.beginPath();
    const ph = ox + ((G.frame * 0.2) % 12) - 12; // in step with the field's own waves
    for (let x = ph - 12 * Math.ceil((ph - x0 + 12) / 12); x < x1; x += 12) {
      pg.moveTo(x, y - 1.5);
      pg.quadraticCurveTo(x + 3, y - 3, x + 6, y - 1.5);
    }
    pg.stroke();
    pg.restore();
  }
}
// one icon per life or horn, up to max, then a +N (the same idea as the catwalk pips)
function iconRun(n, max) {
  return n > max ? { show: max - 1, more: n - (max - 1) } : { show: n, more: 0 };
}
const lifeIcon = (x, y, s = 1) => art('buck.stand', x, y + 9 * s, { scale: 0.42 * s });
const hornIc = (x, y, s = 1) => hornIcon(x + 1 * s, y, 1.3 * s);
// the life bar on its own, centred at x, y, w wide (lifeBar() draws at -16..16, 4.6)
function lifeBarAt(x, y, w) {
  pg.save();
  pg.translate(x, y - 6);
  pg.scale(w / 32, w / 32);
  lifeBar();
  pg.restore();
}
// the painting at the sides washed pale down to the waterline, so the stage stands out (the sea stays blue)
function sideWash(a = 0.55) {
  const { ox, oy, LW } = LAY,
    g = pg.createLinearGradient(0, oy + 186, 0, oy + 222);
  g.addColorStop(0, 'rgba(' + C.cream.join(',') + ',' + a + ')');
  g.addColorStop(1, 'rgba(' + C.cream.join(',') + ',0)');
  pg.fillStyle = g;
  pg.fillRect(0, oy, ox, 222);
  pg.fillRect(ox + PW, oy, LW - ox - PW, 222);
}
