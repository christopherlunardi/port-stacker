// B: CRANE DELIVERY. A little crate comes down on a rope from the top, lands on the catwalk, bursts open in a pop of stars, and there's
// the horn, with a HORN! callout and a jingle. (Can't be grabbed while it's still coming down.)
ITEM_ARRIVE = 60;
drawItem = function (it) { const a = it.age || 0;
  if (a < 48) { const f = a / 48, y = 24 + (it.y - 24) * (1 - (1 - f) * (1 - f)); pg.beginPath(); pg.moveTo(it.x, 22); pg.lineTo(it.x, y - 10); pg.lineWidth = 0.8; pg.strokeStyle = ink(C.indigo); pg.stroke();
    rrect(it.x - 6, y - 10, 12, 10, 1.5, C.orange, C.indigo, 1); rect(it.x - 5, y - 6, 10, 1, C.indigo); return; }
  if (a < 60) { const t = a - 48; for (let i = 0; i < 6; i++) { const ang = i / 6 * 6.283; glyphStar(it.x + Math.cos(ang) * t * 1.2, it.y - 6 + Math.sin(ang) * t * 0.9, 2.2 - t * 0.12, i & 1 ? C.yel : C.cream); } }
  if (a >= 48) arrived(it);
  if (a > 48 && a < 110) { pg.globalAlpha = Math.min(1, (110 - a) / 20); textF(FONT_MAIN, 'HORN!', it.x, it.y - 24 - (a - 48) * 0.1, 7, C.yel, 'center', C.indigo); pg.globalAlpha = 1; }
  if (!(it.t > 90 || (it.t >> 3) & 1)) return; const bob = Math.sin(G.frame * 0.12) * 1.2, pop = a < 60 ? 0.6 + (a - 48) / 12 * 0.6 : 1.2;
  glowAt(it.x, it.y - 8 + bob, 11, C.yel, 0.45); hornIcon(it.x + 0.5, it.y - 8 + bob, 1.5 * pop / 1.2); if (NIGHT()) nightGlow(it.x, it.y - 8 + bob, 11, C.yel, 0.45); };
