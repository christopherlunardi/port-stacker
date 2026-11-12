// Option C: ROPE AND RIBBON, matching the rope logo: rope frames, pink ribbon headers, life rings as bullets, chunky sign lettering (Bungee).
// The stage card hangs on two ropes from the top of the screen and swings in.
/*FONTS Bungee=bungee*/
function ropePanel(x, y, w, h) { rect(x + 3, y + 3, w, h, C.indigo); rrect(x, y, w, h, 7, C.cream, null); ropeRect(x, y, w, h, 7); }
card = function (a, b) { const [nm, tip] = String(b || '').split(' - '), t = G.t || 0, drop = Math.min(1, t / 18), dy = -120 * Math.pow(1 - drop, 2), sw = Math.sin(t * 0.16) * 0.08 * Math.exp(-t / 40);
  pg.save(); pg.translate(PW / 2, dy); pg.rotate(sw); const w = 190, h = 62, top = 84;
  for (const s of [-1, 1]) { pg.beginPath(); pg.moveTo(s * 60, -10); pg.lineTo(s * 60, top + 4); pg.lineWidth = 3.2; pg.strokeStyle = ink(C.indigo); pg.stroke(); pg.lineWidth = 2; pg.strokeStyle = ink(C.yel); pg.stroke(); }
  ropePanel(-w / 2, top, w, h); ribbon(0, top - 7, 110, 16, C.pink, a, 'Bungee', 10);
  textF('Bungee', (nm || '').toUpperCase(), 0, top + 28, 13, C.indigo, 'center'); if (tip) textF('Bungee', tip, 0, top + 46, 7, C.blue, 'center'); pg.restore(); };
drawMenu = function () { if (G.info) { drawInfo(); return; } const items = pauseItems(), w = 200, h = 36 + items.length * 11.5, x = (PW - w) / 2, y = Math.max(18, (PH - h) / 2);
  ropePanel(x, y, w, h); ribbon(PW / 2, y - 8, 96, 16, C.pink, 'PAUSED', 'Bungee', 10);
  items.forEach((it, i) => { const sel = i === G.menu, ry = y + 22 + i * 11.5; if (sel) { rrect(x + 10, ry - 5.5, w - 20, 11, 5.5, C.pinkL); lifeRing(x + 18, ry, 4.2); }
    textF('Bungee', it[0], x + 28, ry + 0.5, 7, sel ? C.pink : C.indigo); }); };
drawBoard = function () { drawHarborLive(0.7); dimBackdrop(0.4); ropePanel(36, 22, 248, 204); ribbon(PW / 2, 13, 150, 20, C.pink, 'HIGH SCORES', 'Bungee', 12);
  const b = board(); if (!b.length) textF('Bungee', 'NO SCORES YET!', PW / 2, 120, 10, C.indigo, 'center');
  b.forEach((e, i) => { const ry = 52 + i * 16.5, me = G.lastEntry === e.n + e.s && (G.frame >> 4) & 1; if (i & 1) rrect(46, ry - 7, 228, 14, 4, C.pinkL);
    if (me) rrect(46, ry - 7, 228, 14, 4, C.yel); if (i < 3) { lifeRing(60, ry, 6); textF('Bungee', String(i + 1), 60, ry + 0.5, 6, C.indigo, 'center'); } else textF('Bungee', String(i + 1), 60, ry + 0.5, 8, C.blue, 'center');
    textF('Bungee', e.n, 82, ry + 0.5, 11, C.indigo); textF('Bungee', String(e.s), 222, ry + 0.5, 11, C.pink, 'right'); textF('Bungee', 'ST ' + e.st, 266, ry + 0.5, 6.5, C.blue, 'right'); });
  if ((G.frame >> 5) & 1) textF('Bungee', 'PRESS A TO GO BACK', PW / 2, 234, 6.5, C.indigo, 'center'); };
drawInitials = function () { drawHarborLive(0.7); dimBackdrop(0.4); ropePanel(46, 42, 228, 160); ribbon(PW / 2, 32, 168, 20, C.pink, 'NEW HIGH SCORE!', 'Bungee', 11);
  textF('Bungee', String(G.score), PW / 2, 74, 18, C.pink, 'center', C.indigo); textF('Bungee', 'STAGE ' + stageReached(), PW / 2, 92, 7, C.blue, 'center');
  for (let i = 0; i < 3; i++) { const lx = PW / 2 + (i - 1) * 40, sel = i === G.iniPos; pg.beginPath(); pg.arc(lx, 135, 15, 0, 7); pg.fillStyle = ink(sel ? C.yel : C.cream); pg.fill(); pg.lineWidth = 1.6; pg.strokeStyle = ink(C.indigo); pg.stroke();
    textF('Bungee', LETTERS[G.ini[i]], lx, 136.5, 17, C.indigo, 'center'); if (sel && (G.frame >> 4) & 1) { glyphTri(lx, 112, 3, 'up', C.pink); glyphTri(lx, 158, 3, 'down', C.pink); } }
  textF('Bungee', 'UP/DOWN LETTER  LEFT/RIGHT MOVE  A OK', PW / 2, 186, 6, C.blue, 'center'); };
