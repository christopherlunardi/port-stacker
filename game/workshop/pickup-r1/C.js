// C: SPOTLIGHT. A beam of light shines down on the spot, the horn spins in under it, rays turn slowly behind it, an arrow bounces over
// it, and a ring around it runs down to show how long is left. Jingle when it lands.
ITEM_ARRIVE = 24;
drawItem = function (it) { const a = it.age || 0, f = Math.min(1, a / 24), y = it.y - 9, bob = Math.sin(G.frame * 0.12) * 1.2;
  if (a >= 24) arrived(it); if (!(it.t > 90 || (it.t >> 3) & 1)) return;
  pg.save(); pg.globalAlpha = 0.35 * f; pg.beginPath(); pg.moveTo(it.x - 3, 24); pg.lineTo(it.x + 3, 24); pg.lineTo(it.x + 11, it.y); pg.lineTo(it.x - 11, it.y); pg.closePath(); pg.fillStyle = ink(C.yel); pg.fill(); pg.restore();
  pg.save(); pg.translate(it.x, y + bob); pg.rotate(G.frame * 0.02); pg.globalAlpha = f; for (let i = 0; i < 8; i++) { pg.rotate(Math.PI / 4); pg.beginPath(); pg.moveTo(0, 0); pg.lineTo(13, -2.2); pg.lineTo(13, 2.2); pg.closePath(); pg.fillStyle = ink(C.yel); pg.fill(); pg.lineWidth = 0.5; pg.strokeStyle = ink(C.orange); pg.stroke(); } pg.restore();
  const left = Math.min(1, it.t / 540); pg.beginPath(); pg.arc(it.x, y + bob, 9.5, -Math.PI / 2, -Math.PI / 2 + left * 6.283); pg.lineWidth = 1.4; pg.strokeStyle = ink(C.pink); pg.stroke();
  pg.save(); pg.translate(it.x, y + bob); pg.rotate((1 - f) * 6); pg.scale(f, f); hornIcon(0.5, 0, 1.6); pg.restore();
  if (f >= 1) glyphTri(it.x, it.y - 24 + Math.abs(Math.sin(G.frame * 0.15)) * -3, 3, 'down', C.yel);
  if (NIGHT()) nightGlow(it.x, y, 12, C.yel, 0.5); };
