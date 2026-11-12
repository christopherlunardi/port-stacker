// Option E: RAGTIME PLAYBILL. A 1910s theatre bill: cream card, a double rule border, little diamond ornaments, old-west poster type (Rye)
// printed pink with a blue offset, tall condensed type (Oswald) for the lists. Pause is the INTERMISSION; the board is the HALL OF FAME.
/*FONTS Rye=rye Oswald=oswald:700*/
function bill(x, y, w, h) { rect(x + 3, y + 3, w, h, C.indigo); rect(x, y, w, h, C.cream); rrect(x, y, w, h, 0, null, C.indigo, 2); rrect(x + 4, y + 4, w - 8, h - 8, 0, null, C.pink, 0.8);
  for (const [dx, dy] of [[x + 4, y + 4], [x + w - 4, y + 4], [x + 4, y + h - 4], [x + w - 4, y + h - 4]]) diamond(dx, dy, 3, C.pink); }
function diamond(x, y, r, col) { pg.beginPath(); pg.moveTo(x, y - r); pg.lineTo(x + r, y); pg.lineTo(x, y + r); pg.lineTo(x - r, y); pg.closePath(); pg.fillStyle = ink(col); pg.fill(); pg.lineWidth = 0.7; pg.strokeStyle = ink(C.indigo); pg.stroke(); }
function rye(s, x, y, size, align = 'center') { textF('Rye', s, x + 1, y + 1, size, C.blue, align); textF('Rye', s, x, y, size, C.pink, align); } // two inks, a little off register
function osw(s, x, y, size, col, align = 'center', track = 1.2) { textF('Oswald', s, x, y, size, col, align, null, { weight: 700, track }); }
card = function (a, b) { const [nm, tip] = String(b || '').split(' - '), t = Math.min(1, (G.t || 0) / 12), w = 200, h = 76, x = (PW - w) / 2, y = 80;
  pg.save(); pg.globalAlpha = t; bill(x, y, w, h); osw('NOW PLAYING', PW / 2, y + 13, 6.5, C.indigo, 'center', 2.5); diamond(PW / 2 - 40, y + 13, 2, C.pink); diamond(PW / 2 + 40, y + 13, 2, C.pink);
  rye(a, PW / 2, y + 32, 17); osw((nm || '').toUpperCase(), PW / 2, y + 51, 10, C.indigo, 'center', 2); if (tip) osw(tip, PW / 2, y + 64, 6.5, C.blue, 'center', 1.5); pg.restore(); };
drawMenu = function () { if (G.info) { drawInfo(); return; } const items = pauseItems(), w = 200, h = 44 + items.length * 11, x = (PW - w) / 2, y = Math.max(14, (PH - h) / 2);
  bill(x, y, w, h); rye('Intermission', PW / 2, y + 18, 14); rect(PW / 2 - 50, y + 29, 100, 0.8, C.indigo);
  items.forEach((it, i) => { const sel = i === G.menu, ry = y + 39 + i * 11, tw = textW('Oswald', it[0], 8, { weight: 700, track: 1.2 });
    osw(it[0], PW / 2, ry, 8, sel ? C.pink : C.indigo); if (sel) { diamond(PW / 2 - tw / 2 - 8, ry, 2.6, C.yel); diamond(PW / 2 + tw / 2 + 8, ry, 2.6, C.yel); } }); };
drawBoard = function () { drawHarborLive(0.7); dimBackdrop(0.4); bill(34, 8, 252, 220); osw('THE PORT STACKER COMPANY PRESENTS', PW / 2, 22, 5.5, C.blue, 'center', 1.5);
  rye('Hall of Fame', PW / 2, 38, 18); rect(70, 50, 180, 0.8, C.indigo);
  const ord = n => n + (n === 1 ? 'ST' : n === 2 ? 'ND' : n === 3 ? 'RD' : 'TH'), b = board(); if (!b.length) osw('NO NAMES ON THE BILL YET', PW / 2, 120, 9, C.indigo);
  b.forEach((e, i) => { const ry = 62 + i * 15.5, me = G.lastEntry === e.n + e.s && (G.frame >> 4) & 1; if (me) rect(46, ry - 6.5, 228, 13, C.yel);
    osw(ord(i + 1), 64, ry, 8, i < 3 ? C.pink : C.indigo, 'center', 1); osw(e.n, 100, ry, 11, C.indigo, 'center', 2); leader(118, 186, ry + 2);
    osw(String(e.s), 232, ry, 11, C.pink, 'right', 1); osw('ST.' + e.st, 266, ry, 7, C.blue, 'right', 0.5); });
  if ((G.frame >> 5) & 1) osw('PRESS A TO GO BACK', PW / 2, 234, 7, C.indigo, 'center', 1.5); };
drawInitials = function () { drawHarborLive(0.7); dimBackdrop(0.4); bill(44, 30, 232, 178); osw('A NEW STAR!', PW / 2, 46, 7, C.indigo, 'center', 3);
  rye('High Score', PW / 2, 64, 17); osw(String(G.score), PW / 2, 86, 15, C.pink, 'center', 2); osw('REACHED STAGE ' + stageReached(), PW / 2, 101, 6.5, C.blue, 'center', 1.5);
  osw('SIGN THE BILL', PW / 2, 116, 6.5, C.indigo, 'center', 2.5);
  for (let i = 0; i < 3; i++) { const lx = PW / 2 + (i - 1) * 36, sel = i === G.iniPos; rect(lx - 13, 157, 26, 1.2, C.indigo); textF('Rye', LETTERS[G.ini[i]], lx, 143, 22, sel ? C.pink : C.indigo, 'center');
    if (sel && (G.frame >> 4) & 1) { glyphTri(lx, 125, 3, 'up', C.pink); glyphTri(lx, 165, 3, 'down', C.pink); } }
  osw('UP/DOWN LETTER   LEFT/RIGHT MOVE   A OK', PW / 2, 190, 6, C.blue, 'center', 1); };
