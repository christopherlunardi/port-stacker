// ---------- the menus, stage card, high scores and initials: ROPE AND RIBBON (Chris's pick, Workshop ui round 1, 2026-11-07: they match the title) ----------
// Matching the rope logo: rope frames, pink ribbon headers, life rings as bullets, chunky sign lettering (Bungee).
// The stage card hangs on two ropes from the top of the screen and swings in.
function ropePanel(x, y, w, h) {
  rect(x + 3, y + 3, w, h, C.indigo);
  rrect(x, y, w, h, 7, C.cream, null);
  ropeRect(x, y, w, h, 7);
}
function oldField(fn) {
  pg.save();
  pg.scale(TK, TK);
  try {
    fn();
  } finally {
    pg.restore();
  }
} // draw something laid out for the 320x240 field at TK
function card(a, b, o) {
  oldField(() => cardBody(a, b, o));
}
function cardBody(a, b, o = {}) {
  const PW = 320; // o.t: frames since it appeared; o.end: when it must be gone. 26 frames before that the ropes snap and it drops off the bottom
  const [nm, tip] = String(b || '').split(' - '),
    t = o.t != null ? o.t : G.t || 0,
    drop = Math.min(1, t / 18),
    w = o.w || 190,
    h = o.h || 62,
    top = o.top || 84;
  const snapAt = o.end != null ? o.end - CARD_SNAP : 1e9,
    k = Math.max(0, t - snapAt),
    fell = 0.35 * k * k;
  const dy = -120 * Math.pow(1 - drop, 2) + fell,
    sw = k ? k * 0.012 : Math.sin(t * 0.16) * 0.08 * Math.exp(-t / 40);
  if (k)
    for (const s of [-1, 1]) {
      const len = Math.max(0, top + 4 - k * 14),
        ex = PW / 2 + s * 60; // the cut ropes whip back up out of sight
      if (len > 0) {
        pg.beginPath();
        pg.moveTo(ex, -10);
        pg.quadraticCurveTo(ex + s * 6, len / 2, ex + s * 3, len);
        pg.lineWidth = 3.2;
        pg.strokeStyle = ink(C.indigo);
        pg.stroke();
        pg.lineWidth = 2;
        pg.strokeStyle = ink(C.yel);
        pg.stroke();
      }
    }
  pg.save();
  pg.translate(PW / 2, dy);
  pg.rotate(sw);
  for (const s of [-1, 1]) {
    const from = k ? top - 10 : -10;
    pg.beginPath();
    pg.moveTo(s * 60, from);
    pg.lineTo(s * 60, top + 4);
    pg.lineWidth = 3.2;
    pg.strokeStyle = ink(C.indigo);
    pg.stroke();
    pg.lineWidth = 2;
    pg.strokeStyle = ink(C.yel);
    pg.stroke();
  }
  ropePanel(-w / 2, top, w, h);
  if (o.ribbon) o.ribbon(top); // a card can draw its own ribbon (the game-over card's turns over for a new best)
  else ribbon(0, top - 7, 110, 16, C.pink, a, FONT_MAIN, 10);
  if (o.draw) o.draw(top, w, h);
  else {
    textF(FONT_MAIN, (nm || '').toUpperCase(), 0, top + 28, 13, C.indigo, 'center');
    if (tip) textF(FONT_MAIN, tip, 0, top + 46, 7, C.blue, 'center');
  }
  if (o.ot && otNum()) otCard(top, w, h, t, o.ot); /* overtime's own brand on the stage, clear and game-over cards */
  pg.restore();
}
// the game-over card (Chris 2026-11-07: 'not very satisfying' as one line): the score big, how far you got (stage, its name, and a row of
// the stages with the ones you reached filled in), and its ribbon turns over when it's a new best or makes the board
const OVER_FLIP = 56; // when the game-over ribbon turns over (the score has counted up by 54)
function overCard() {
  const n = worldLen(),
    reached = stageReached(),
    loop = G.loop,
    lv = G.level,
    t = G.t || 0,
    count = Math.min(1, Math.max(0, (t - 14) / 40));
  card('GAME OVER', null, {
    ot: 'over',
    t,
    w: 232,
    h: 108,
    top: 62,
    // NEW BEST! / ON THE BOARD! (Chris's pick, Workshop best r1 C, 2026-11-11: no stamp, it ran into the score in the millions): once the
    // score has counted up, the pink GAME OVER ribbon turns over like a sign to a yellow one, with a ding (09-game.js)
    ribbon: top => {
      const age = t - OVER_FLIP,
        on = (G.newBest || G.made) && age >= 0,
        f = on ? Math.min(1, age / 12) : 0,
        after = f >= 0.5;
      pg.save();
      pg.translate(0, top - 7);
      pg.scale(1, Math.max(0.04, Math.abs(Math.cos(f * Math.PI))));
      ribbon(0, 0, 110, 16, after ? C.yel : C.pink, after ? (G.newBest ? 'NEW BEST!' : 'ON THE BOARD!') : 'GAME OVER', FONT_MAIN, 10, after ? C.pink : C.cream);
      pg.restore();
    },
    draw: top => {
      textF(FONT_MAIN, 'FINAL SCORE', 0, top + 17, 6, C.blue, 'center', null, { track: 1 });
      textF(FONT_MAIN, fmtNum(G.score * (1 - Math.pow(1 - count, 3))), 0, top + 36, 24, C.pink, 'center', C.indigo); // counts up as the card lands
      leader(-96, 96, top + 54, C.skyD);
      textF(FONT_MAIN, 'REACHED STAGE ' + stageLabel(), 0, top + 65, 8.5, C.indigo, 'center');
      textF(FONT_MAIN, ((LEVELS[lv] && LEVELS[lv].name) || '').toUpperCase(), 0, top + 76, 6, C.blue, 'center');
      for (let i = 0; i < n; i++) {
        const x = (i - (n - 1) / 2) * 30,
          y = top + 91,
          done = i < lv,
          here = i === lv,
          col = [C.pink, C.yel, C.blue, C.orange][i % 4];
        if (i) {
          pg.fillStyle = ink(done || here ? C.indigo : C.skyD);
          pg.fillRect(x - 21, y - 0.5, 12, 1);
        } // the route between stages
        if (done)
          rrect(x - 9, y - 4.5, 18, 9, 1.5, col, C.indigo, 1); // stages cleared: a loaded container
        else if (here) {
          pg.save();
          pg.globalAlpha = 0.55 + 0.45 * Math.sin(t * 0.15);
          rrect(x - 9, y - 4.5, 18, 9, 1.5, col, C.indigo, 1);
          pg.restore();
          glyphTri(x, y - 9.5, 2.6, 'down', C.pink);
        } // where you got caught
        else rrect(x - 9, y - 4.5, 18, 9, 1.5, null, C.skyD, 0.8);
      } // still to come
      // (no LOOP line: the stage number already says the shift, Chris 2026-11-08)
      if (t > 60 && (t >> 5) & 1)
        textF(FONT_MAIN, G.made ? 'PRESS A TO SIGN YOUR NAME' : 'PRESS A TO CONTINUE', 0, top + 122, 7, C.cream, 'center', C.indigo);
    }
  });
}
// the SHIP LOADED card (Chris 2026-11-08: 'next berth' was boring): what you did on the stage, one stat at a time, then the stage's
// points counting up, then the time left, the horns left and the misses (none or one) each counted onto them. Timing in CLEAR (frames since the ship was loaded); sounds in update.
const CLEAR = { rows: 5, row0: 34, rowGap: 12, count0: 100, count1: 150, tl0: 162, hornGap: 10 };
function clearTimes() {
  // when the time part runs: the clock takes 3 frames a second (between 24 and 90 frames), then the bonus flies over
  const S = G.st || {},
    D = Math.max(24, Math.min(90, Math.abs(S.left || 0) * 3)),
    tl1 = CLEAR.tl0 + D,
    sh0 = tl1 + 10,
    sh1 = sh0 + 16,
    hn0 = sh1 + 14, // then the horns left are counted off one by one, and that bonus flies over too
    hn1 = hn0 + Math.max(1, S.hornsLeft || 0) * CLEAR.hornGap,
    hs0 = hn1 + 8,
    hs1 = hs0 + 16,
    // (Chris 2026-11-11: no stamp; "do how many misses after, if that applies", counted into the stage points like the time and the horns)
    // with no life lost (NO MISSES) or one (ONE MISS), that panel takes the right side next and its bonus flies over in turn
    clean = (S.cleanBonus || 0) > 0,
    ms0 = hs1 + 12,
    mf0 = ms0 + 28,
    mf1 = mf0 + 16;
  return { tl0: CLEAR.tl0, tl1, sh0, sh1, hn0, hn1, hs0, hs1, clean, ms0, mf0, mf1, done: clean ? mf1 + 10 : hs1 + 10 };
}
function fmtTime(s) {
  s = Math.max(0, Math.round(s));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
function fmtNum(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function clearCard() {
  const S = G.st || {},
    c = CLEAR,
    T = clearTimes(),
    t = G.t,
    secs = Math.floor((S.f || 0) / 60),
    rows = [
      ['TIME', fmtTime(secs) + '  (PAR ' + fmtTime(parSecs()) + ')'],
      ['SQUASHED', String(S.squash || 0)],
      ['RIDERS', String(S.riders || 0)],
      ['BIGGEST DROP', S.drop ? fmtNum(S.drop) : '-'],
      ['TOP COMBO', S.combo > 1 ? String(S.combo) : '-']
    ],
    total = S.total != null ? S.total : G.score - (S.score0 || 0),
    delta = S.delta || 0,
    over = (S.left || 0) < 0,
    k = Math.min(1, Math.max(0, (t - c.count0) / (c.count1 - c.count0))),
    tk = Math.min(1, Math.max(0, (t - T.tl0) / (T.tl1 - T.tl0))),
    landed = t >= T.sh1,
    hLanded = t >= T.hs1,
    hb = S.hornBonus || 0,
    cb = S.cleanBonus || 0,
    shown =
      Math.round(total * (1 - Math.pow(1 - k, 2))) +
      (landed ? Math.round(delta * Math.min(1, (t - T.sh1) / 8)) : 0) +
      (hLanded ? Math.round(hb * Math.min(1, (t - T.hs1) / 8)) : 0) +
      (T.clean && t >= T.mf1 ? Math.round(cb * Math.min(1, (t - T.mf1) / 8)) : 0);
  if (t < 14) return;
  card('SHIP LOADED!', null, {
    ot: 'clear',
    t: t - 14,
    end: G.clearOut ? G.clearOut - 14 + CARD_SNAP : null,
    w: 236,
    h: 142,
    top: 44,
    draw: top => {
      textF(FONT_MAIN, 'STAGE ' + stageLabel() + '  ' + ((L && L.def.name) || ''), 0, top + 19, 6, C.blue, 'center', null, { track: 0.6 });
      rows.forEach(([lab, val], r) => {
        const age = t - (c.row0 + r * c.rowGap);
        if (age < 0) return;
        const y = top + 32 + r * 11,
          a = Math.min(1, age / 6),
          pop = age < 8 ? 1 + 0.35 * Math.sin((age / 8) * Math.PI) : 1;
        pg.save();
        pg.globalAlpha = a;
        textF(FONT_MAIN, lab, -100 + (1 - a) * -10, y, 7, C.indigo, 'left');
        leader(-100 + textW(FONT_MAIN, lab, 7) + 4, 92 - textW(FONT_MAIN, val, 7) - 4, y + 2, C.skyD);
        textF(FONT_MAIN, val, 92, y, 7 * pop, val === '-' ? C.skyD : C.pink, 'right');
        pg.restore();
      });
      if (t < c.count0 - 6) return;
      leader(-102, 102, top + 88, C.skyD);
      // left: the stage's points
      const L0 = -50,
        R0 = 60;
      textF(FONT_MAIN, 'STAGE POINTS', L0, top + 97, 6, C.blue, 'center', null, { track: 1 });
      const zAt = T.clean && t >= T.mf1 ? T.mf1 : hLanded && hb ? T.hs1 : landed ? T.sh1 : c.count1, // the number jumps as each part lands on it
        z = t >= zAt && t < zAt + 10 ? 1 + 0.22 * Math.sin(((t - zAt) / 10) * Math.PI) : 1;
      textF(FONT_MAIN, fmtNum(Math.max(0, shown)), L0, top + 113, 15 * z, landed && delta < 0 ? C.blue : C.pink, 'center', C.indigo);
      // right: the time left (or over par) running down into the bonus (or the penalty)
      if (T.clean && t >= T.ms0) {
        // the misses: NONE (or 1) under MISSES, with its bonus below, which then flies onto the points like the others
        const one = S.deaths > 0,
          age = t - T.ms0,
          pop = age < 8 ? 1 + 0.35 * Math.sin((age / 8) * Math.PI) : 1;
        textF(FONT_MAIN, 'MISSES', R0, top + 97, 6, C.blue, 'center', null, { track: 1 });
        textF(FONT_MAIN, one ? '1' : 'NONE', R0, top + 111, 11 * pop, one ? C.indigo : C.pink, 'center');
        if (t < T.mf0) {
          if (age >= 8) textF(FONT_MAIN, '+' + fmtNum(cb), R0, top + 124, 7.5, C.yel, 'center', C.indigo);
        } else if (t < T.mf1) {
          const f = (t - T.mf0) / (T.mf1 - T.mf0),
            e = f * f;
          textF(FONT_MAIN, '+' + fmtNum(cb), R0 + (L0 - R0) * e, top + 124 + (113 - 124) * e - Math.sin(f * Math.PI) * 14, 8.5 + f * 2, C.yel, 'center', C.indigo);
        } else textF(FONT_MAIN, (one ? 'ONE MISS +' : 'NO MISSES +') + fmtNum(cb), R0, top + 124, 6, C.skyD, 'center'); // what it was worth, once it's landed
      } else if (t >= T.hn0) {
        // the horns left: a row of horns that pop off one at a time into the bonus, which then flies onto the points
        const n = S.hornsLeft || 0,
          gone = Math.min(n, Math.floor((t - T.hn0) / c.hornGap)),
          v = gone * (n ? hb / n : 0);
        textF(FONT_MAIN, 'HORNS LEFT', R0, top + 97, 6, C.blue, 'center', null, { track: 1 });
        if (!n) textF(FONT_MAIN, 'NONE', R0, top + 111, 9, C.skyD, 'center');
        else {
          const shownN = Math.min(n - gone, 5),
            gap = 15;
          for (let i = 0; i < shownN; i++) hornIcon(R0 - ((shownN - 1) * gap) / 2 + i * gap - 3, top + 110, 1);
          if (n - gone > 5) textF(FONT_MAIN, '+' + (n - gone - 5), R0 + 44, top + 111, 6, C.indigo, 'center');
        }
        if (hLanded && n) textF(FONT_MAIN, n + ' X ' + fmtNum(hb / n), R0, top + 111, 7, C.skyD, 'center'); // what it was worth, once it's landed
        if (!hLanded && hb) {
          if (t < T.hs0) textF(FONT_MAIN, '+' + fmtNum(v), R0, top + 124, 7.5, C.yel, 'center', C.indigo);
          else {
            const f = (t - T.hs0) / (T.hs1 - T.hs0),
              e = f * f;
            textF(
              FONT_MAIN,
              '+' + fmtNum(hb),
              R0 + (L0 - R0) * e,
              top + 124 + (113 - 124) * e - Math.sin(f * Math.PI) * 14,
              8.5 + f * 2,
              C.yel,
              'center',
              C.indigo
            );
          }
        }
      } else if (t >= T.tl0) {
        const left = Math.abs(S.left || 0) * (1 - tk),
          col = over ? C.pink : C.indigo;
        textF(FONT_MAIN, over ? 'OVER PAR' : 'TIME LEFT', R0, top + 97, 6, over ? C.pink : C.blue, 'center', null, { track: 1 });
        textF(FONT_MAIN, (over ? '+' : '') + fmtTime(left), R0, top + 111, 11, col, 'center');
        const v = Math.round(delta * tk);
        if (!landed) {
          if (t < T.sh0)
            textF(FONT_MAIN, (v >= 0 ? '+' : '-') + fmtNum(Math.abs(v)), R0, top + 124, 7.5, over ? C.pink : C.yel, 'center', C.indigo);
          else {
            // the bonus flies over onto the points
            const f = (t - T.sh0) / (T.sh1 - T.sh0),
              e = f * f,
              x = R0 + (L0 - R0) * e,
              y = top + 124 + (113 - 124) * e - Math.sin(f * Math.PI) * 14;
            textF(
              FONT_MAIN,
              (delta >= 0 ? '+' : '-') + fmtNum(Math.abs(delta)),
              x,
              y,
              8.5 + f * 2,
              over ? C.pink : C.yel,
              'center',
              C.indigo
            );
          }
        }
      }
      if (t >= T.done) {
        if (!G.clearOut) {
          // tucked in the card's bottom right corner: A, NEXT, and an arrow that flashes and nudges forward
          const on = (t >> 4) & 1,
            nx = 2 * Math.max(0, Math.sin(t * 0.25));
          textF(FONT_MAIN, 'A  NEXT', 90, top + 133, 6.5, on ? C.pink : C.blue, 'right');
          glyphTri(96 + nx, top + 133, 2.8, 'right', on ? C.pink : C.blue);
        }
      }
    }
  });
}
const CARD_SNAP = 26,
  CARD_THUD = 16; // frames: the ropes snap 26 before the card's time is up; 16 after the snap it hits the bottom
function drawMenu() {
  if (G.info) {
    drawInfo();
    return;
  }
  oldField(menuBody);
}
function menuBody() {
  const PW = 320,
    PH = 240;
  const items = pauseItems(),
    w = 200,
    h = 36 + items.length * 11.5,
    x = (PW - w) / 2,
    y = Math.max(18, (PH - h) / 2);
  ropePanel(x, y, w, h);
  ribbon(PW / 2, y - 8, 96, 16, C.pink, 'PAUSED', FONT_MAIN, 10);
  items.forEach((it, i) => {
    const sel = i === G.menu,
      ry = y + 22 + i * 11.5;
    if (sel) {
      rrect(x + 10, ry - 5.5, w - 20, 11, 5.5, C.pinkL);
      lifeRing(x + 18, ry, 4.2);
    }
    textF(FONT_MAIN, it[0], x + 28, ry + 0.5, 7, sel ? C.pink : C.indigo);
  });
}
function drawBoard() {
  drawHarborLive(0.7);
  dimBackdrop(0.4);
  oldField(drawBoardBody);
}
function drawBoardBody() {
  const PW = 320;
  ropePanel(36, 22, 248, 204);
  ribbon(PW / 2, 13, 150, 20, C.pink, 'HIGH SCORES', FONT_MAIN, 12);
  const b = board();
  if (!b.length) textF(FONT_MAIN, 'NO SCORES YET!', PW / 2, 120, 10, C.indigo, 'center');
  b.forEach((e, i) => {
    const ry = 52 + i * 16.5,
      me = G.lastEntry === e.n + e.s && (G.frame >> 4) & 1;
    if (i & 1) rrect(46, ry - 7, 228, 14, 4, C.pinkL);
    if (me) rrect(46, ry - 7, 228, 14, 4, C.yel);
    if (i < 3) {
      lifeRing(60, ry, 6);
      textF(FONT_MAIN, String(i + 1), 60, ry + 0.5, 6, C.indigo, 'center');
    } else textF(FONT_MAIN, String(i + 1), 60, ry + 0.5, 8, C.blue, 'center');
    textF(FONT_MAIN, e.n, 82, ry + 0.5, 11, C.indigo);
    textF(FONT_MAIN, fmtNum(e.s), 222, ry + 0.5, 11, C.pink, 'right');
    textF(FONT_MAIN, 'ST ' + e.st, 266, ry + 0.5, 6.5, C.blue, 'right');
  });
  if ((G.frame >> 5) & 1) textF(FONT_MAIN, 'PRESS A TO GO BACK', PW / 2, 234, 6.5, C.indigo, 'center');
}
function drawInitials() {
  drawHarborLive(0.7);
  dimBackdrop(0.4);
  oldField(drawInitialsBody);
}
function drawInitialsBody() {
  const PW = 320;
  ropePanel(46, 42, 228, 160);
  ribbon(PW / 2, 32, 168, 20, C.pink, 'NEW HIGH SCORE!', FONT_MAIN, 11);
  textF(FONT_MAIN, fmtNum(G.score), PW / 2, 74, 18, C.pink, 'center', C.indigo);
  textF(FONT_MAIN, 'STAGE ' + stageReached(), PW / 2, 92, 7, C.blue, 'center');
  for (let i = 0; i < 3; i++) {
    const lx = PW / 2 + (i - 1) * 40,
      sel = i === G.iniPos;
    pg.beginPath();
    pg.arc(lx, 135, 15, 0, 7);
    pg.fillStyle = ink(sel ? C.yel : C.cream);
    pg.fill();
    pg.lineWidth = 1.6;
    pg.strokeStyle = ink(C.indigo);
    pg.stroke();
    textF(FONT_MAIN, LETTERS[G.ini[i]], lx, 136.5, 17, C.indigo, 'center');
    if (sel && (G.frame >> 4) & 1) {
      glyphTri(lx, 112, 3, 'up', C.pink);
      glyphTri(lx, 158, 3, 'down', C.pink);
    }
  }
  textF(FONT_MAIN, 'UP/DOWN LETTER  LEFT/RIGHT MOVE  A OK', PW / 2, 186, 6, C.blue, 'center');
}
function drawInfo() {
  oldField(infoBody);
}
function infoBody() {
  const PW = 320,
    PH = 240;
  const L = infoLines(),
    w = 292,
    h = 40 + L.length * 10,
    x = (PW - w) / 2,
    y = (PH - h) / 2 + 4; // pause menu > INFO, in the same dress
  ropePanel(x, y, w, h);
  ribbon(PW / 2, y - 8, 80, 16, C.pink, 'INFO', FONT_MAIN, 10);
  L.forEach((l, i) => textF(FONT_MAIN, String(l).toUpperCase().slice(0, 56), x + 12, y + 20 + i * 10, 5.5, C.indigo));
  textF(FONT_MAIN, 'PRESS A TO GO BACK', PW / 2, y + h - 10, 6, C.pink, 'center');
}
