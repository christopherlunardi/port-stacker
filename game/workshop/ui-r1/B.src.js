// Option B: SHIPPING MANIFEST. Everything is paperwork from the harbour office: a clipboard for the pause menu, a luggage tag for the stage
// card, a typed cargo manifest for the high scores, a sign-here slip for initials. Typewriter type (Special Elite), stencil headings
// (Black Ops One), pink rubber stamps, dotted leaders.
/*FONTS SpecialElite=special-elite BlackOps=black-ops-one*/
function paper(x, y, w, h, rot) { pg.save(); pg.translate(x + w / 2, y + h / 2); pg.rotate(rot || 0); pg.translate(-w / 2, -h / 2);
  rect(3, 3, w, h, C.indigo); rrect(0, 0, w, h, 1.5, C.cream, C.indigo, 1.4); for (let ly = 22; ly < h - 6; ly += 11) rect(6, ly + 5, w - 12, 0.4, C.skyD); }
card = function (a, b) { const [nm, tip] = String(b || '').split(' - '), t = Math.min(1, (G.t || 0) / 14), sw = Math.sin((G.t || 0) * 0.12) * 0.02 * (1 - t);
  pg.save(); pg.translate(PW / 2, 118); pg.rotate(-0.05 + sw); pg.scale(0.6 + t * 0.4, 0.6 + t * 0.4);
  const w = 176, h = 66; pg.beginPath(); pg.moveTo(-w / 2 + 16, -h / 2); pg.lineTo(w / 2, -h / 2); pg.lineTo(w / 2, h / 2); pg.lineTo(-w / 2 + 16, h / 2); pg.lineTo(-w / 2, h / 2 - 16); pg.lineTo(-w / 2, -h / 2 + 16); pg.closePath();
  pg.fillStyle = ink(C.cream); pg.fill(); pg.lineWidth = 1.5; pg.strokeStyle = ink(C.indigo); pg.stroke();
  pg.beginPath(); pg.arc(-w / 2 + 11, 0, 3.4, 0, 7); pg.fillStyle = ink(C.paper); pg.fill(); pg.lineWidth = 1.2; pg.stroke(); pg.beginPath(); pg.moveTo(-w / 2 + 11, 0); pg.quadraticCurveTo(-w / 2 - 14, -20, -w / 2 - 30, -44); pg.lineWidth = 1.4; pg.strokeStyle = ink(C.orange); pg.stroke();
  rect(-w / 2 + 22, -h / 2 + 5, w - 30, 15, C.pink); textF('BlackOps', a, -w / 2 + 28, -h / 2 + 13, 12, C.cream, 'left');
  textF('SpecialElite', 'DESTINATION:', -w / 2 + 24, 2, 7, C.blue); textF('SpecialElite', (nm || '').toUpperCase(), -w / 2 + 24, 13, 11, C.indigo);
  if (tip) textF('SpecialElite', tip, -w / 2 + 24, 25, 7, C.indigo); stamp('LOADING', w / 2 - 30, 4, 8, C.pink, 0.22, 'BlackOps'); pg.restore(); };
drawMenu = function () { if (G.info) { drawInfo(); return; } const items = pauseItems(), w = 210, h = 40 + items.length * 11, x = (PW - w) / 2, y = Math.max(16, (PH - h) / 2);
  paper(x, y, w, h); rrect(w / 2 - 22, -6, 44, 12, 3, C.skyD, C.indigo, 1.3); rect(w / 2 - 12, -3, 24, 4, C.indigo); // the clip
  textF('BlackOps', 'PAUSED', 12, 18, 13, C.indigo); textF('SpecialElite', 'WORK ORDER - PLEASE TICK ONE', 12, 30, 6, C.blue);
  items.forEach((it, i) => { const sel = i === G.menu, ry = 42 + i * 11; rrect(12, ry - 4, 8, 8, 1, C.cream, C.indigo, 0.9);
    if (sel) { pg.beginPath(); pg.moveTo(13.5, ry); pg.lineTo(16, ry + 3); pg.lineTo(21, ry - 5); pg.lineWidth = 1.6; pg.lineCap = 'round'; pg.strokeStyle = ink(C.pink); pg.stroke(); }
    textF('SpecialElite', it[0], 26, ry, 8, sel ? C.pink : C.indigo); });
  stamp('ON HOLD', w - 38, 20, 7, C.pink, -0.18, 'BlackOps'); pg.restore(); };
drawBoard = function () { drawHarborLive(0.7); dimBackdrop(0.45); const x = 34, y = 10, w = 252, h = 214; paper(x, y, w, h, -0.012);
  textF('BlackOps', 'CARGO MANIFEST', 12, 18, 14, C.indigo); textF('SpecialElite', 'HIGH SCORES  -  PORT STACKER LINE', 12, 30, 6.5, C.blue);
  textF('SpecialElite', 'NO.', 14, 44, 6, C.blue); textF('SpecialElite', 'CREW', 36, 44, 6, C.blue); textF('SpecialElite', 'TONNAGE', 196, 44, 6, C.blue, 'right'); textF('SpecialElite', 'BERTH', 236, 44, 6, C.blue, 'right');
  const b = board(); if (!b.length) textF('SpecialElite', 'NO CARGO LOGGED YET.', w / 2, 110, 9, C.indigo, 'center');
  b.forEach((e, i) => { const ry = 57 + i * 15, me = G.lastEntry === e.n + e.s && (G.frame >> 4) & 1; if (me) rect(8, ry - 6, w - 16, 12, C.yel);
    textF('SpecialElite', String(i + 1).padStart(2, '0'), 14, ry, 9, C.indigo); textF('SpecialElite', e.n, 36, ry, 11, C.indigo); leader(66, 150, ry + 2);
    textF('SpecialElite', String(e.s), 196, ry, 10, C.pink, 'right'); textF('SpecialElite', String(e.st), 236, ry, 9, C.indigo, 'right'); });
  if (b.length) stamp('INSPECTED', w - 60, h - 22, 8, C.pink, -0.2, 'BlackOps'); pg.restore();
  if ((G.frame >> 5) & 1) textF('SpecialElite', 'PRESS A TO GO BACK', PW / 2, 233, 7, C.indigo, 'center'); };
drawInitials = function () { drawHarborLive(0.7); dimBackdrop(0.45); const x = 50, y = 34, w = 220, h = 170; paper(x, y, w, h, 0.01);
  stamp('NEW HIGH SCORE', w / 2, 20, 10, C.pink, -0.05, 'BlackOps'); textF('SpecialElite', 'TONNAGE ' + G.score, w / 2, 44, 12, C.indigo, 'center'); textF('SpecialElite', 'BERTH ' + stageReached(), w / 2, 57, 7, C.blue, 'center');
  textF('SpecialElite', 'SIGN HERE:', 22, 78, 7, C.indigo);
  for (let i = 0; i < 3; i++) { const lx = w / 2 + (i - 1) * 36, sel = i === G.iniPos; rect(lx - 13, 113, 26, 1.3, C.indigo); textF('BlackOps', LETTERS[G.ini[i]], lx, 100, 22, sel ? C.pink : C.indigo, 'center');
    if (sel && (G.frame >> 4) & 1) { glyphTri(lx, 82, 3, 'up', C.pink); glyphTri(lx, 121, 3, 'down', C.pink); } }
  textF('SpecialElite', 'UP/DOWN LETTER  LEFT/RIGHT MOVE  A OK', w / 2, 146, 6.5, C.blue, 'center'); pg.restore(); };
