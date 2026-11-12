// shared by the lamp options: a little dome bulb on a base, unlit or lit
function lampBulb(lx, top, lit, s = 1, glint = 1) {
  rrect(lx - 3.2, top - 1.4, 6.4, 1.6, 0.6, C.indigo); // the base
  pg.beginPath(); pg.arc(lx, top - 1.4, 2.6 * s, Math.PI, 0); pg.closePath(); pg.fillStyle = ink(lit ? C.yel : C.blue); pg.fill(); pg.lineWidth = 0.6; pg.strokeStyle = ink(C.indigo); pg.stroke();
  if (glint) { pg.beginPath(); pg.arc(lx - 0.9 * s, top - 2.6 * s, 0.6 * s, 0, 7); pg.fillStyle = ink(C.cream); pg.globalAlpha = lit ? 1 : 0.55; pg.fill(); pg.globalAlpha = 1; } }
function panelWash(px, top, pw, H, a) { if (a <= 0) return; pg.globalAlpha = a; rect(px + 2, top + 2, pw - 4, H - 4, C.cream); pg.globalAlpha = 1; }
