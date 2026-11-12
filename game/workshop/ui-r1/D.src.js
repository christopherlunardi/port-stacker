// Option D: ENAMEL DOCK SIGN. Deep blue enamel plates with a cream border line and corner bolts, like harbour signage; chunky sign lettering
// (Bungee) in cream, yellow for what's selected. The stage card is a big berth sign.
/*FONTS Bungee=bungee Oswald=oswald:700*/
function enamel(x, y, w, h) { rect(x + 3, y + 3, w, h, C.indigo); rrect(x, y, w, h, 6, C.blue, C.indigo, 1.6); rrect(x + 4, y + 4, w - 8, h - 8, 4, null, C.cream, 1.2); for (const [bx, by] of [[x + 9, y + 9], [x + w - 9, y + 9], [x + 9, y + h - 9], [x + w - 9, y + h - 9]]) bolt(bx, by, 2); }
card = function (a, b) { const [nm, tip] = String(b || '').split(' - '), t = Math.min(1, (G.t || 0) / 10), w = 210, h = 70, x = (PW - w) / 2, y = 84;
  pg.save(); pg.translate(PW / 2, y + h / 2); pg.scale(1, t); pg.translate(-PW / 2, -(y + h / 2)); enamel(x, y, w, h);
  rrect(PW / 2 - 40, y + 10, 80, 13, 3, C.yel, C.indigo, 1); textF('Bungee', a.replace('STAGE', 'BERTH'), PW / 2, y + 17, 8, C.indigo, 'center');
  textF('Bungee', (nm || '').toUpperCase(), PW / 2, y + 37, 15, C.cream, 'center', C.indigo); if (tip) textF('Oswald', tip, PW / 2, y + 55, 8, C.yel, 'center', null, { weight: 700, track: 1 }); pg.restore(); };
drawMenu = function () { if (G.info) { drawInfo(); return; } const items = pauseItems(), w = 204, h = 40 + items.length * 11.5, x = (PW - w) / 2, y = Math.max(14, (PH - h) / 2);
  enamel(x, y, w, h); textF('Bungee', 'PAUSED', PW / 2, y + 18, 12, C.cream, 'center'); rect(PW / 2 - 30, y + 26, 60, 1.5, C.yel);
  items.forEach((it, i) => { const sel = i === G.menu, ry = y + 37 + i * 11.5; if (sel) rrect(x + 14, ry - 5.5, w - 28, 11, 3, C.yel, C.indigo, 0.8);
    textF('Bungee', it[0], PW / 2, ry + 0.5, 7, sel ? C.indigo : C.cream, 'center'); }); };
drawBoard = function () { drawHarborLive(0.7); dimBackdrop(0.4); enamel(30, 10, 260, 216); textF('Bungee', 'HARBOR RECORDS', PW / 2, 30, 14, C.cream, 'center'); rect(PW / 2 - 60, 40, 120, 1.5, C.yel);
  textF('Oswald', 'RANK', 52, 52, 6.5, C.sky, 'center', null, { weight: 700, track: 1 }); textF('Oswald', 'NAME', 96, 52, 6.5, C.sky, 'center', null, { weight: 700, track: 1 });
  textF('Oswald', 'SCORE', 214, 52, 6.5, C.sky, 'right', null, { weight: 700, track: 1 }); textF('Oswald', 'STAGE', 262, 52, 6.5, C.sky, 'center', null, { weight: 700, track: 1 });
  const b = board(); if (!b.length) textF('Bungee', 'NO SCORES YET', PW / 2, 120, 10, C.cream, 'center');
  b.forEach((e, i) => { const ry = 66 + i * 15, me = G.lastEntry === e.n + e.s && (G.frame >> 4) & 1, hot = me; if (hot) rrect(42, ry - 6.5, 236, 13, 3, C.yel, C.indigo, 0.8);
    const c = hot ? C.indigo : C.cream; textF('Bungee', String(i + 1), 52, ry + 0.5, 9, hot ? C.indigo : i < 3 ? C.yel : C.cream, 'center'); textF('Bungee', e.n, 96, ry + 0.5, 11, c, 'center');
    textF('Bungee', String(e.s), 214, ry + 0.5, 11, hot ? C.indigo : C.yel, 'right'); textF('Bungee', String(e.st), 262, ry + 0.5, 9, c, 'center'); });
  if ((G.frame >> 5) & 1) textF('Bungee', 'PRESS A TO GO BACK', PW / 2, 234, 6.5, C.indigo, 'center'); };
drawInitials = function () { drawHarborLive(0.7); dimBackdrop(0.4); enamel(46, 36, 228, 168); textF('Bungee', 'NEW HIGH SCORE', PW / 2, 56, 12, C.cream, 'center'); rect(PW / 2 - 50, 66, 100, 1.5, C.yel);
  textF('Bungee', String(G.score), PW / 2, 84, 17, C.yel, 'center', C.indigo); textF('Oswald', 'STAGE ' + stageReached(), PW / 2, 100, 7, C.sky, 'center', null, { weight: 700, track: 1 });
  for (let i = 0; i < 3; i++) { const lx = PW / 2 + (i - 1) * 36, sel = i === G.iniPos; rrect(lx - 14, 120, 28, 32, 3, sel ? C.yel : C.cream, C.indigo, 1.3); textF('Bungee', LETTERS[G.ini[i]], lx, 137, 18, C.indigo, 'center');
    if (sel && (G.frame >> 4) & 1) { glyphTri(lx, 114, 3, 'up', C.yel); glyphTri(lx, 159, 3, 'down', C.yel); } }
  textF('Oswald', 'UP/DOWN LETTER   LEFT/RIGHT MOVE   A OK', PW / 2, 184, 6.5, C.cream, 'center', null, { weight: 700, track: 1 }); };
