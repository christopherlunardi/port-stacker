// E: BIG AND BRIGHT. No entrance: it pops in with a burst of stars and a jingle, then sits bigger, with yellow rays turning behind it and a
// bounce, so it's easy to spot from across the stage.
ITEM_ARRIVE = 0;
drawItem = function (it) { const a = it.age || 0; arrived(it); if (!(it.t > 90 || (it.t >> 3) & 1)) return; const bob = -Math.abs(Math.sin(G.frame * 0.1)) * 3, y = it.y - 10 + bob, pop = a < 10 ? 0.4 + a / 10 * 0.8 : 1.2 - Math.min(0.2, (a - 10) * 0.02);
  if (a < 16) for (let i = 0; i < 8; i++) { const ang = i / 8 * 6.283; glyphStar(it.x + Math.cos(ang) * a * 1.3, it.y - 10 + Math.sin(ang) * a, 2.4 - a * 0.12, i & 1 ? C.yel : C.cream); }
  pg.save(); pg.translate(it.x, y); pg.rotate(G.frame * 0.025); pg.globalAlpha = 1; for (let i = 0; i < 10; i++) { pg.rotate(Math.PI / 5); pg.beginPath(); pg.moveTo(0, 0); pg.lineTo(12, -2); pg.lineTo(12, 2); pg.closePath(); pg.fillStyle = ink(C.yel); pg.fill(); pg.lineWidth = 0.5; pg.strokeStyle = ink(C.orange); pg.stroke(); } pg.restore();
  glowAt(it.x, y, 10, C.cream, 0.6); hornIcon(it.x + 0.5, y, 1.9 * pop); if (NIGHT()) nightGlow(it.x, y, 12, C.yel, 0.5); };
