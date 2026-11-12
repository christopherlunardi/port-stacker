// lives bottom-left, horns bottom-right (Workshop hud round 1, 2026-11-08); the score bar keeps SCORE, HIGH and STAGE, bigger
drawBand = function () {
  rrect(3, 1, PW - 6, 20, 5, C.cream, C.indigo, 1.3);
  const cell = (x, label, value, col, al) => { textF(FONT_MAIN, label, x, 6.2, 4.8, C.blue, al); textF(FONT_MAIN, value, x, 14.6, 11, col, al); };
  cell(12, 'SCORE', String(G.score).padStart(6, '0'), C.pink, 'left');
  cell(PW / 2, 'HIGH', String(Math.max(G.hi, G.score)).padStart(6, '0'), C.indigo, 'center');
  cell(PW - 12, 'STAGE', stageLabel(), C.pink, 'right');
  if (G.combo >= 2 && G.comboT > 0) { const m = 1 + (G.combo >> 1), pulse = 1 + Math.max(0, (G.comboT - 135) / 15) * 0.35; textF(FONT_MAIN, 'COMBO x' + m, PW / 2, 32, (8 + m * 2) * pulse, m >= 3 ? C.pink : C.yel, 'center', C.indigo); }
  if (G.p && G.state !== 'title') drawCorners(Math.max(0, G.lives), G.p.horns, hudPop());
};
const HUDP = { lives: null, horn: null, tl: 0, th: 0 };
function hudPop() { if (HUDP.lives !== G.lives) { if (HUDP.lives != null) HUDP.tl = 24; HUDP.lives = G.lives; } if (HUDP.horn !== G.p.horns) { if (HUDP.horn != null) HUDP.th = 24; HUDP.horn = G.p.horns; }
  if (HUDP.tl > 0) HUDP.tl--; if (HUDP.th > 0) HUDP.th--; const k = t => 1 + Math.sin(t / 24 * Math.PI) * 0.35; return { l: k(HUDP.tl), h: k(HUDP.th) }; }
function hornIcon(x, y, s = 1) { // a little air horn: a bulb and a flared bell, pointing right
  pg.save(); pg.translate(x, y); pg.scale(s, s); pg.lineJoin = 'round';
  pg.beginPath(); pg.moveTo(-2, -1.6); pg.lineTo(3, -4.2); pg.lineTo(3, 4.2); pg.lineTo(-2, 1.6); pg.closePath(); pg.fillStyle = ink(C.yel); pg.fill(); pg.lineWidth = 1; pg.strokeStyle = ink(C.indigo); pg.stroke();
  pg.beginPath(); pg.arc(-4, 0, 2.6, 0, 7); pg.fillStyle = ink(C.pink); pg.fill(); pg.stroke(); pg.restore(); }
// C: CORNER BADGES. A rope-edged badge in each bottom corner, like the menus: Buck x3 on the left, horn x5 on the right.
function drawCorners(lives, horn, pop) {
  const badge = (x, flip, icon, n, s) => { pg.save(); pg.translate(x, PH - 22); pg.scale(s, s); ropePanel(-22, -11, 44, 20); icon(flip ? 10 : -10); textF(FONT_MAIN, 'x' + n, flip ? -8 : 8, 0, 9, C.pink, 'center', C.indigo); pg.restore(); };
  badge(30, false, ix => art('buck.stand', ix, 7, { scale: 0.42 }), lives, pop.l);
  badge(PW - 30, true, ix => hornIcon(ix, -1, 1.2), horn, pop.h);
}
