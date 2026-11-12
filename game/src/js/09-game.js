// ---------- the game: states, scoring, the pause menu ----------
// states: title -> intro (STAGE n) -> play <-> pause; play -> dying -> play | over; play -> clear -> intro (next stage)
const DEV = { on: false, inv: false, noEnemies: false, hitboxes: false, view: null }; // view: a forced screen shape to preview (12)
const G = {
  state: typeof window === 'undefined' || window.__HEADLESS ? 'title' : 'splash',
  t: 0,
  frame: 0,
  level: 0,
  loop: 0,
  score: 0,
  hi: 0,
  lives: 3,
  nextLife: 30000, // LIFE_FIRST (defined further down)
  p: null,
  enemies: [],
  pieces: [],
  stacks: {},
  stackN: {},
  colTotal: {},
  clouds: [],
  items: [],
  pops: [],
  spawnQ: [],
  combo: 0,
  comboT: 0,
  landed: 0,
  itemSpawned: false,
  menu: 0,
  banner: null,
  updateReady: 0
};
function difficulty() {
  // the guards' pace (Chris 2026-11-09: in a very logical manner): one small step every stage, 1-1 to 3-5 (1.00 to 1.55), then in
  // overtime the same in all of its shifts, a bigger step past 3-5 with each overtime. (Chris 2026-11-11: "ramp up just a tiny bit more a
  // tiny bit quicker and the overtime reset should be a bit more of a difficulty bump") 0.05 a stage became 0.06 (3-5 is 1.66, was 1.55),
  // and each overtime starts 0.35 higher, was 0.22 (OT1 1-1 is 1.35, was 1.22: about where 2-4 sits now, no longer back near 1-2).
  const d = l => 1 + 0.06 * (stagesBefore(baseShift()) + l);
  return otRamp(d(G.level), d(0), 0.35);
}
function newGame() {
  G.devRun = false;
  G.rushWait = false;
  teleRunStart();
  G.score = 0;
  G.lives = 3;
  G.loop = 0;
  G.nextLife = LIFE_FIRST;
  G.lifeFrom = 0;
  G.p = null;
  startLevel(0);
}
function buildStage(i) {
  // a stage's catwalks, containers and actors, nothing else (no music, no state change)
  G.flats = [];
  G.launched = [];
  G.koStars = [];
  G.storm = null;
  G.level = i;
  L = buildLevel(LEVELS[i]);
  G.pieces = makePieces(L.def);
  G.stacks = {};
  G.stackN = {};
  G.colTotal = {};
  for (const c of L.def.plates) {
    G.stacks[c] = 0;
    G.stackN[c] = 0;
  }
  for (const pc of G.pieces) G.colTotal[pc.c] = (G.colTotal[pc.c] || 0) + 1;
  G.landed = 0;
  G.itemSpawned = false;
  G.items = [];
  G.goldDone = false; // the power crate (06b-gold.js): once a stage
  G.goldFlash = null;
  G.goldBits = [];
  G.pops = [];
  G.combo = 0;
  G.comboT = 0;
  const pep = G.p ? G.p.horns : 5;
  resetActors();
  G.p.horns = Math.max(pep, freeHorns());
}
function startLevel(i) {
  buildStage(i);
  // this stage's numbers, for the SHIP LOADED card (Chris 2026-11-08: show what you did, with the stage's points counting up)
  G.clearOut = 0;
  G.st = { score0: G.score, f: 0, squash: 0, riders: 0, combo: 1, horns: 0, deaths: 0, drop: 0 };
  G.dropPts = {};
  G.dropN = 0;
  G.state = 'intro';
  G.t = 0;
  musicStop();
  const jl = playJingle();
  G.introLen = jl ? Math.max(170, Math.min(360, Math.round(jl * 60) + 50)) : INTRO_LEN;
}
function resetActors() {
  const [c, r] = L.def.start;
  G.p = makePlayer(c, r, G.p ? G.p.horns : 5);
  TELE.aliveF = 0; // for the play log: how long he lasts after coming back (play frames)
  G.enemies = [];
  G.clouds = [];
  for (const pc of G.pieces) {
    pc.riders = [];
    pc.extra = 0;
  }
  G.spawnQ = stageRoster().map((type, i) => ({ type, t: 70 + i * 110 }));
}
function addPop(x, y, text, col = 'navy', pts = 0, size = 0, sub = '') {
  G.pops.push({ x, y, text, t: 80, col, pts, sub, size: size || (pts >= 5000 ? 13 : pts >= 1000 ? 11 : pts >= 300 ? 9 : 7.5) });
} // bigger points, bigger popup
// combos (Chris 2026-11-08: no ceiling): every scoring move within the window adds one; the multiplier goes up one every second move
// (x2 on the 3rd, x3 on the 5th, x4 on the 7th, x5 on the 9th...), and the window to keep it going shrinks as it grows, from 2.5 s down to 1 s
const PAR_SECS = 90, // (the game uses parSecs())
  TIME_RATE = 50; // par time for a stage, and points a second under it (or off for a second over), times the shift number
function payTime() {
  // the time bonus (or penalty) lands on the score, once
  const S = G.st;
  if (!S || S.paid) return;
  S.paid = true;
  if (S.delta > 0) {
    addScore(S.delta, PW / 2, 196, 'TIME BONUS', false);
    SFX.tallyDone();
  } else if (S.delta < 0) {
    G.score = Math.max(0, G.score + S.delta);
    SFX.empty();
  }
}
// leftover horns (Chris 2026-11-08: horns are a huge part of the game, so saving them pays big): HORN_BONUS each, times the shift
// number, on the SHIP LOADED card after the time bonus. You keep the horns too.
const HORN_BONUS = 2000;
// NO MISSES (Chris 2026-11-10: "let's do a no death bonus"): a stage cleared without losing a life pays NO_MISS_BONUS times the shift
// number, on the card after the horns (its own panel, counted onto the stage points like them; Chris 2026-11-11, it was a stamp); with one life lost, ONE MISS pays ONE_MISS_BONUS times the shift number (Chris: a bonus that
// slides down, not a penalty); two or more, nothing
const NO_MISS_BONUS = 5000,
  ONE_MISS_BONUS = 2000;
function payClean() {
  const S = G.st;
  if (!S || S.cleanPaid) return;
  S.cleanPaid = true;
  if (S.cleanBonus > 0) {
    addScore(S.cleanBonus, PW / 2, 196, S.deaths ? 'ONE MISS' : 'NO MISSES', false);
    SFX.tallyDone();
  }
}
function payHorns() {
  const S = G.st;
  if (!S || S.hornPaid) return;
  S.hornPaid = true;
  if (S.hornBonus > 0) {
    addScore(S.hornBonus, PW / 2, 196, 'HORN BONUS', false);
    SFX.tallyDone();
  }
}
// extra lives (Chris 2026-11-08: with bigger scores, every 20,000 came too often). Chris 2026-11-09: the first a little later, then
// growing slower than doubling, so a player dying a lot can still grind on into overtime: at 30,000, then each gap 20,000 longer than
// the last: 30,000, 80,000, 150,000, 240,000, 350,000, 480,000, 630,000, 800,000, 990,000, 1,200,000...
const LIFE_FIRST = 30000,
  LIFE_GROW = 20000;
function nextLifeAfter(v) {
  let at = LIFE_FIRST,
    gap = LIFE_FIRST;
  while (at <= v) at += gap += LIFE_GROW;
  return at;
}
function comboWindow(m) {
  return Math.max(60, 150 - 12 * (m - 1));
}
// the combo COUNT is your moves in a row (Chris 2026-11-08): each landing, each rider, each enemy squashed, each enemy the horn stuns,
// a horn refill grabbed. Bonuses (chains, bay full, ship loaded, time) aren't moves: they don't count and aren't multiplied.
// The MULTIPLIER climbs one step every two moves: 1-2 x1, 3-4 x2, 5-6 x3 ...
function comboMult(c = G.combo) {
  return c > 0 ? 1 + ((c - 1) >> 1) : 1;
}
function comboMove(k = 1) {
  // k moves just happened: add them, restart the window; returns the multiplier now
  if (G.state === 'dying') return 1; // nothing builds a combo while he's down (a container still falling scores plain points)
  const was = G.comboT > 0 ? G.combo : 0,
    m0 = comboMult(was);
  G.combo = Math.min(was + k, 999);
  const m = comboMult();
  if (m > m0 && m >= 2) SFX.chain(Math.min(m - 1, 12)); // a rising note each time the multiplier goes up
  G.comboT = G.comboWin = comboWindow(m);
  if (G.st) G.st.combo = Math.max(G.st.combo, G.combo);
  return m;
}
function addScore(n, x, y, label = '', combo = true, size = 0) {
  // combo: how many moves this is (true = 1, false or 0 = a bonus: not counted, not multiplied)
  const m = combo ? comboMove(combo === true ? 1 : combo) : 1;
  const pts = n * m;
  G.score += pts;
  // the multiplier goes on its own line as COMBO X2 (Chris 2026-11-07: 'RIDER 600 X2' read as two riders)
  addPop(
    x,
    y,
    (label ? label + ' ' : '') + pts,
    pts >= 1000 ? 'yel' : label ? 'pink' : 'cream',
    pts,
    size,
    m > 1 ? 'X' + m + ' POINTS' : ''
  );
  if (pts >= 100) SFX.points(pts >= 1000);
  if (G.dropNow && G.st) {
    G.dropPts[G.dropNow] = (G.dropPts[G.dropNow] || 0) + pts;
    G.st.drop = Math.max(G.st.drop, G.dropPts[G.dropNow]);
  } // BIGGEST DROP: every point a drop brings in (landings, chains, riders, squashes, bay bonus)
  while (G.score >= G.nextLife) {
    // (a big score can pass more than one threshold at once: each one is a life)
    G.lives++;
    G.lifeFrom = G.nextLife;
    G.lifeFlash = 40; // the life bar flashes full
    G.nextLife = nextLifeAfter(G.nextLife);
    SFX.oneup();
    teleLife();
    addPop(G.p.x, G.p.y - 32, '1UP!', 'pink');
  }
  return pts; // (build 103-107 returned before the check above, so no extra lives were ever given: Chris noticed the bar sat full)
}
function saveHi() {
  if (G.score > G.hi) {
    G.hi = G.score;
    store.set('hi', G.hi);
  }
}
// ---------- the leaderboard: top 10 on this device, 3 initials like the arcade ----------
// An entry is { n: 'ABC', s: score, st: stage reached }. Game over with a top-10 score -> 'initials' state: up/down change the letter,
// left/right move, A (or Start) confirms the letter / the name, B steps back.
const BOARD_N = 10,
  LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ .!';
function board() {
  const b = store.get('board', null);
  return Array.isArray(b) ? b : [];
}
function qualifies(s) {
  const b = board();
  return s > 0 && (b.length < BOARD_N || s > b[b.length - 1].s);
}
function startInitials() {
  G.state = 'initials';
  G.t = 0;
  G.ini = [0, 0, 0];
  G.iniPos = 0;
  G.iniLast = store.get('lastIni', null);
  if (G.iniLast) G.ini = G.iniLast.split('').map(c => Math.max(0, LETTERS.indexOf(c)));
}
function updateInitials(inp) {
  const P = inp.pressed,
    i = G.iniPos,
    n = LETTERS.length;
  if (P.up) {
    G.ini[i] = (G.ini[i] + 1) % n;
    SFX.move();
  }
  if (P.down) {
    G.ini[i] = (G.ini[i] + n - 1) % n;
    SFX.move();
  }
  if (P.right && i < 2) {
    G.iniPos++;
    SFX.move();
  }
  if ((P.left || P.b) && i > 0) {
    G.iniPos--;
    SFX.move();
  }
  if (P.a || P.start) {
    if (i < 2) {
      G.iniPos++;
      SFX.press();
    } else {
      const name = G.ini.map(k => LETTERS[k]).join('');
      const b = board();
      b.push({ n: name, s: G.score, st: stageReached() });
      b.sort((x, y) => y.s - x.s);
      store.set('board', b.slice(0, BOARD_N));
      store.set('lastIni', name);
      G.lastEntry = name + G.score;
      SFX.oneup();
      G.state = 'board';
      G.t = 0;
    }
  }
}
function updatePops() {
  for (const p of G.pops) {
    p.t--;
    p.y -= p.t > 60 ? 0.6 : 0.2;
  }
  G.pops = G.pops.filter(p => p.t > 0);
}
const ITEMS_ON = false; // the crane's horn refill crate (Chris 2026-11-08: off for now; a full bay gives a horn instead). The delivery is kept for other pickups later
let ITEM_ARRIVE = 60; // the crane delivery: 48 frames lowering the crate, then it bursts open (Chris's pick, Workshop pickups round 1, B) // frames a pickup takes to arrive before it can be grabbed (a Workshop option may animate an arrival)
function updateItems() {
  if (ITEMS_ON && !G.itemSpawned && G.landed >= 5) {
    G.itemSpawned = true;
    const fl = L.def.floors[Math.floor(rand() * L.def.floors.length)];
    const c = fl[1] + Math.floor(rand() * (fl[2] - fl[1] + 1));
    G.items.push({ x: c * T + 4, y: rowY(fl[0]), t: 540 });
  }
  const p = G.p;
  for (const it of G.items) {
    it.t--;
    it.age = (it.age || 0) + 1;
    if (it.age === 48) SFX.pickupArrive();
    if (it.age >= ITEM_ARRIVE && Math.abs(it.x - p.x) < 8 && Math.abs(it.y - p.y) < 6) {
      it.t = 0;
      p.horns++;
      addScore(500, it.x, it.y - 20, 'HORN+1'); // grabbing it is a move
      SFX.pickup();
    }
  }
  G.items = G.items.filter(it => it.t > 0);
}
function checkHits() {
  const p = G.p;
  if (goldBashes()) return; // POWER RUSH: whoever he runs into is flattened instead
  if (G.pieces.every(pc => pc.gold || pc.state === 'plate' || (pc.state === 'fall' && pc.target && pc.target.kind !== 'floor'))) return; // (Chris 2026-11-09) the last container is on its way into the ship: the stage is won, nothing can get him (2026-11-10: only its last drop, into the ship, not every drop on the way down)
  if (p.inv > 0 || DEV.inv) return;
  for (const e of G.enemies)
    if (e.state === 'walk' && Math.abs(e.x - p.x) < 9 && Math.abs(e.y - p.y) < 10) {
      G.killedBy = e.type;
      G.state = 'dying';
      G.t = 0;
      G.combo = 0;
      G.comboT = 0; /* a death ends the combo (2026-11-11: it carried on through the death and after he came back) */
      if (!G.attract) musicStop(); // (a title demo keeps the tune going)
      SFX.die();
      teleDeath();
      return;
    }
  // CLOSE CALL (Chris 2026-11-10: a small payment and a combo move): a walking enemy comes within a hair of him (inside NEAR, not
  // touching) and they part again (past FAR) without him being caught. Once per brush; not while he's blinking after a life lost
  for (const e of G.enemies) {
    if (e.state !== 'walk') {
      e.near = false;
      continue;
    }
    const dx = Math.abs(e.x - p.x),
      dy = Math.abs(e.y - p.y);
    if (dx < CLOSE.near && dy < CLOSE.near) e.near = true;
    else if (e.near && (dx > CLOSE.far || dy > CLOSE.far)) {
      e.near = false;
      addScore(CLOSE.pts, p.x, p.y - 26, 'CLOSE CALL');
      if (G.st) G.st.close = (G.st.close || 0) + 1;
    }
  }
}
const CLOSE = { near: 14, far: 26, pts: 200 }; // (caught is within 9 across and 10 up or down)
function updatePlay(inp) {
  if (inp.pressed.start) {
    pauseGame();
    return;
  }
  if (G.st) G.st.f++;
  teleTick();
  updatePlayer(inp);
  updateBelts();
  updatePieces();
  updateEnemies();
  updateClouds();
  updateItems();
  updateGold();
  updatePops();
  if (G.comboT > 0 && --G.comboT === 0) G.combo = 0;
  checkHits();
  if (G.state === 'play' && G.pieces.every(pc => pc.state === 'plate' || pc.gold)) {
    G.state = 'clear';
    G.t = 0;
    if (!G.attract) musicStop();
    addScore(1000 * (1 + G.loop), PW / 2, 120, 'SHIP LOADED', false);
    if (G.st) {
      G.st.total = G.score - G.st.score0;
      // par (Chris 2026-11-08): every second under it is a bonus, every second over it comes off this stage's points
      const secs = Math.floor(G.st.f / 60),
        left = parSecs() - secs,
        rate = TIME_RATE * (1 + G.loop);
      G.st.left = left;
      G.st.delta = left >= 0 ? left * rate : -Math.min(-left * rate, G.st.total);
      G.st.paid = false;
      G.st.hornsLeft = G.p.horns;
      G.st.hornBonus = G.p.horns * HORN_BONUS * (1 + G.loop);
      G.st.hornPaid = false;
      G.st.cleanBonus = (G.st.deaths === 0 ? NO_MISS_BONUS : G.st.deaths === 1 ? ONE_MISS_BONUS : 0) * (1 + G.loop); // (Chris 2026-11-10)
      G.st.cleanPaid = false;
    }
    G.clearOut = 0;
    G.combo = 0;
    G.comboT = 0; // the combo ends with the stage
    SFX.clear();
    teleStageClear();
  }
}
function update(inp) {
  inp = attractFrame(inp); // a demo on the title plays itself (09e-attract.js)
  G.frame++;
  goldMusic();
  scoreRollTick(); // the score in the top left rolls up to the real one (10h-hud.js)
  if (HUDP.tl > 0) HUDP.tl--; // the corner badges' pop (counted here, not in drawing, so it runs at the same speed on a 120 Hz screen)
  if (HUDP.th > 0) HUDP.th--;
  goldFxTick();
  if (STORM()) stormTick(); // lightning and thunder (10i-storm.js)
  if (G.lifeFlash > 0) G.lifeFlash--; // every frame, whatever the screen (a life won on the SHIP LOADED card froze it: Chris 2026-11-08)
  G.t++;
  if (G.shake > 0) G.shake--;
  if (G.goT > 0 && G.state === 'play') G.goT--;
  if (G.banner && --G.banner.t <= 0) G.banner = null;
  switch (G.state) {
    case 'splash':
      if (AC || Object.values(inp.pressed).some(Boolean)) studioStart(); /* then the studio intro, then the title (09d-studio.js) */
      break; // a phone needs one tap before it will play sound
    case 'studio':
      studioTick(inp);
      break;
    case 'title':
      titleCues(G.t);
      if (G.introDone && !musicGain) musicStart(); // back on the title after a game: the tune again
      if (!G.introDone) {
        if (inp.pressed.start || inp.pressed.a) G.t = Math.max(G.t, TI.logoAt - 16);
        break;
      } // a press skips the intro to the logo landing
      if (attractTitle(inp)) break; // left alone long enough: a demo (09e-attract.js)
      if (inp.pressed.up || inp.pressed.down) {
        G.titleSel = ((G.titleSel || 0) + (inp.pressed.up ? TITLE_MENU.length - 1 : 1)) % TITLE_MENU.length;
        SFX.move();
      } // the title menu: START GAME / HOW TO PLAY / HIGH SCORES (Chris 2026-11-07: no board popping up by itself; 2026-11-08: how to play)
      if (inp.pressed.start || inp.pressed.a) {
        if (G.titleSel === 1 || G.titleSel === 2) {
          SFX.pause();
          startHowto(G.titleSel === 2 ? 'guide' : 'basics');
        } else if (G.titleSel === 3) {
          SFX.pause();
          G.state = 'board';
          G.t = 0;
          G.lastEntry = null;
          G.boardFromTitle = true;
        } else {
          SFX.start();
          newGame();
        }
      }
      break;
    case 'intro':
      {
        const cEnd = (G.introLen || INTRO_LEN) - 50;
        if (G.t === cEnd - CARD_SNAP) {
          SFX.snap();
          SFX.snap();
        }
        if (G.t === cEnd - CARD_SNAP + CARD_THUD) {
          SFX.thud();
          G.shake = 6;
        }
      } // the stage card's ropes snap, it lands with a thud
      if (G.t >= (G.introLen || INTRO_LEN)) {
        G.state = 'play';
        G.t = 0;
        G.goT = 50;
        musicStart(1, true);
      }
      break; // no skipping the fanfare (Chris 2026-11-07); the tune starts when you can move
    case 'play':
      updatePlay(inp);
      break;
    case 'dying':
      updatePieces();
      updatePops();
      updateLaunched(); // bashed enemies keep flying off
      if (G.t >= 110) {
        G.lives--;
        if (G.st) G.st.deaths++;
        if (G.lives < 0) {
          G.state = 'over';
          G.t = 0;
          G.made = qualifies(G.score);
          G.newBest = G.score > 0 && G.score > G.hi;
          saveHi();
          teleGameOver();
          G.introDone = false; /* after the board, the title plays its intro from silence again */
        } else {
          resetActors();
          G.state = 'play';
          if (G.rushWait) (G.rushWait = false), goldStart(); // the crate shattered while he was down: his rush starts now
          G.t = 0;
          musicStart(1, true);
        }
      }
      break;
    case 'clear':
      updatePieces();
      updatePops();
      updateLaunched();
      {
        // the card: the stats drop in one by one, the stage's points count up, then the time left (or over par) runs down into a bonus
        // (or a penalty) that flies onto the points; A skips to the end, then A moves on
        const c = CLEAR,
          T = clearTimes(),
          ti = G.t;
        for (let r = 0; r < c.rows; r++) if (ti === c.row0 + r * c.rowGap) SFX.tallyRow(r);
        if (ti >= c.count0 && ti < c.count1 && (ti - c.count0) % 3 === 0) SFX.tally((ti - c.count0) / (c.count1 - c.count0));
        if (ti === c.count1) SFX.tallyDone();
        if (ti >= T.tl0 && ti < T.tl1 && (ti - T.tl0) % 3 === 0) SFX.tallyTime(G.st.delta < 0);
        if (ti === T.sh0) SFX.whoosh();
        if (ti >= T.sh1) payTime();
        if (ti >= T.hn0 && ti < T.hn1 && (ti - T.hn0) % CLEAR.hornGap === 0) SFX.pickup(); // each horn counted off
        if (ti === T.hs0 && G.st.hornBonus) SFX.whoosh();
        if (ti >= T.hs1) payHorns();
        if (T.clean && ti === T.ms0) SFX.pickup(); // the misses panel comes up
        if (T.clean && ti === T.mf0) SFX.whoosh();
        if (ti >= (T.clean ? T.mf1 : T.done)) payClean();
        if (!G.clearOut && (inp.pressed.a || inp.pressed.start)) {
          if (ti < T.done) {
            G.t = T.done; // skip to the end
            payTime();
            payHorns();
            payClean();
          } else G.clearOut = ti;
        }
        // it stays up until you press (Chris 2026-11-08)
      }
      if (G.clearOut && G.t >= G.clearOut + CARD_SNAP) {
        let n = G.level + 1;
        if (n >= worldLen()) {
          n = 0;
          G.loop++;
        }
        startLevel(n);
      }
      break;
    case 'over':
      if ((G.newBest || G.made) && G.t === OVER_FLIP) SFX.tallyDone(); // a ding as the ribbon turns over (10e-menus.js)
      if (G.t > 60 && (inp.pressed.start || inp.pressed.a)) {
        /* stays until you press (Chris 2026-11-08) */ if (G.made) startInitials();
        else {
          G.state = 'board';
          G.t = 0;
        }
      }
      break;
    case 'initials':
      updateInitials(inp);
      break;
    case 'board':
      if (G.t >= 1800 || (G.t > 20 && (inp.pressed.start || inp.pressed.a || inp.pressed.b))) {
        const back = G.boardFromTitle;
        G.boardFromTitle = false;
        G.state = 'title';
        G.t = back ? TI.logoAt + 60 : 0;
      }
      break; // back to the title on a press
    case 'pause':
      updatePause(inp);
      break;
    case 'howto':
      updateHowto(inp);
      break;
  }
}
// ---------- pause menu (button-driven, so it works the same on the Retroid, a phone and a keyboard) ----------
function pauseGame() {
  G.sure = null;
  if (G.st) G.st.pauses = (G.st.pauses || 0) + 1;
  G.state = 'pause';
  G.menu = 0;
  SFX.pause();
}
// anything that ends the game in progress (Chris 2026-11-11: "I hit exit game and lost my game") is asked twice: the first A turns the line
// into SURE? PRESS A AGAIN, a second A does it; moving off the line (or closing the menu) takes it back
function sure(key, label, fn) {
  return [
    G.sure === key ? 'SURE? PRESS A AGAIN' : label,
    () => {
      if (G.sure !== key) {
        G.sure = key;
        return;
      }
      G.sure = null;
      fn();
    },
    key
  ];
}
function pauseItems() {
  const items = [
    [
      'RESUME',
      () => {
        G.state = 'play';
      }
    ],
    // (Chris 2026-11-10) no restarting a stage (it kept the points: a free do-over); RESTART GAME starts the whole run again from 1-1,
    // asked twice so it can't happen by accident
    sure('restart', 'RESTART GAME', () => {
      teleQuit();
      saveHi();
      newGame();
      startLevel(0);
    }),
    [
      'SOUND: ' + (muted ? 'OFF' : 'ON'),
      () => {
        muted = !muted;
        store.set('mute', muted);
      }
    ],
    [
      'MUSIC: ' + (musicOn ? 'ON' : 'OFF'),
      () => {
        musicOn = !musicOn;
        store.set('music', musicOn);
      }
    ],
    [
      'PRINT: ' + (typeof PRINT_MODES !== 'undefined' ? PRINT_MODES[printMode][0] : ''),
      () => {
        printMode = (printMode + 1) % PRINT_MODES.length;
        store.set('print2', printMode);
      }
    ],
    [
      'INFO',
      () => {
        G.info = true;
      }
    ],
    sure('title', 'QUIT TO TITLE', () => {
      teleQuit();
      saveHi();
      toTitleFresh();
    })
  ];
  if (NATIVE()) {
    if (G.updateReady) items.push(sure('reload', 'LOAD NEW BUILD ' + G.updateReady, () => (saveHi(), NATIVE().reload())));
    else
      items.push([
        'CHECK FOR UPDATE',
        () => {
          NATIVE().checkUpdate();
          G.banner = { text: 'CHECKING FOR A NEW BUILD...', t: 150 };
        }
      ]);
    let au = 0;
    try {
      au = NATIVE().appUpdate ? NATIVE().appUpdate() : 0;
    } catch (e) {}
    if (au) items.push(sure('app', 'UPDATE APP (NEW VERSION)', () => (saveHi(), NATIVE().installApp())));
    items.push(sure('exit', 'EXIT GAME', () => (teleQuit(), saveHi(), NATIVE().quit())));
  }
  // (no DEV lines here: the pause menu is the same for everyone; dev options are in the DEV panel, Chris 2026-11-08)
  return items;
}
function updatePause(inp) {
  if (G.info) {
    if (inp.pressed.a || inp.pressed.b || inp.pressed.start) {
      G.info = false;
      SFX.move();
    }
    return;
  }
  const items = pauseItems();
  if (inp.pressed.up) {
    G.menu = (G.menu + items.length - 1) % items.length;
    SFX.move();
  }
  if (inp.pressed.down) {
    G.menu = (G.menu + 1) % items.length;
    SFX.move();
  }
  G.menu = Math.min(G.menu, items.length - 1);
  if (G.sure && items[G.menu][2] !== G.sure) G.sure = null; // moved off the line: not armed any more
  if (inp.pressed.b || inp.pressed.start) {
    G.sure = null;
    G.state = 'play';
    return;
  }
  if (inp.pressed.a) {
    SFX.pause();
    items[G.menu][1]();
  }
}
function NATIVE() {
  return !HEADLESS && window.StackNative ? window.StackNative : null;
}
if (!HEADLESS)
  window.ssAppUpdate = n => {
    G.banner = { text: 'NEW APP VERSION - PAUSE AND PICK UPDATE APP', t: 420 };
  };
if (!HEADLESS)
  window.ssUpdateReady = n => {
    G.updateReady = n;
    G.banner = { text: 'NEW BUILD ' + n + ' READY - PAUSE TO LOAD', t: 400 };
  };

// ---------- the title intro: the timeline (frames) and its sounds; 10-render's drawTitle draws the same timeline ----------
// Buck walks in, Pratt stomps in, Buck horns him dizzy, the big crane in the backdrop lowers a container and drops it on him, Pinch
// charges and bonks into it; then a rising sweep, the logo slams down and the music starts on the hit (Chris 2026-11-07).
const TI = {
  dock: 214,
  /* the title is laid out in the old 320x240 field and drawn at TK */ hang: -85,
  buckIn: [20, 120],
  buckX: 82,
  prattIn: [100, 200],
  hornAt: 205,
  lowerAt: 236,
  lowerEnd: 292,
  releaseAt: 304,
  landAt: 320,
  raiseAt: 340,
  crabIn: [350, 450],
  windAt: 450,
  chargeAt: 474,
  bonkAt: 488,
  riserAt: 520,
  logoAt: 640,
  loop: 960
};
// After the first time through, the title loops (Chris 2026-11-07): Buck stays standing; the crane hooks the container back up while
// Pinch wakes and scuttles off (the reset, 200 frames); then it replays from Pratt stomping in, up to Pinch's bonk, and resets again.
const TR = { reset: 200, holdEnd: 620 },
  TCYCLE = TR.reset + TR.holdEnd - TI.prattIn[0];
function titlePhase(T) {
  if (T < TI.loop) return { t: T, reset: -1, again: false };
  const u = (T - TI.loop) % TCYCLE;
  return u < TR.reset ? { t: -1, reset: u, again: true } : { t: TI.prattIn[0] + u - TR.reset, reset: -1, again: true };
}
function titleCues(T) {
  const ph = titlePhase(T),
    t = ph.t,
    first = !G.introDone,
    r = ph.reset;
  if (r >= 0) {
    if (r > 30 && r < 140 && r % 6 === 0) SFX.scuttle();
    if (r === 40) SFX.winch(70 / 60, false);
    if (r === 110) SFX.clank();
    if (r === 125) SFX.winch(75 / 60, true);
    return;
  }
  if (ph.again && t < TI.buckIn[1]) {
    /* Buck is already there */
  } else if (t > TI.buckIn[0] && t < TI.buckIn[1] && t % 12 === 0) SFX.step();
  if (t > TI.prattIn[0] && t < TI.prattIn[1] && t % 14 === 0) SFX.stomp();
  if (t === TI.hornAt) SFX.horn();
  if (t === TI.hornAt + 8) SFX.stun();
  if (t === TI.lowerAt) SFX.winch((TI.lowerEnd - TI.lowerAt) / 60, false);
  if (t === TI.releaseAt) {
    SFX.clank();
    SFX.whoosh();
  }
  if (t === TI.landAt) {
    SFX.squash();
    SFX.landShip();
    G.shake = 6;
  }
  if (t === TI.landAt + 10) SFX.points(true);
  if (t === TI.raiseAt) SFX.winch(1, true);
  if (t > TI.crabIn[0] && t < TI.crabIn[1] && t % 6 === 0) SFX.scuttle();
  if (t === TI.windAt) SFX.rattle();
  if (t === TI.chargeAt) SFX.dash();
  if (t === TI.bonkAt) {
    SFX.bonk();
    G.shake = 4;
  }
  if (first && T === TI.riserAt) SFX.riser((TI.logoAt - TI.riserAt) / 60);
  if (first && T === TI.logoAt) {
    SFX.slam();
    G.shake = 14;
    G.introDone = true;
    musicStart(1.7);
  }
}
function toTitleFresh() {
  G.banner = null; // (a POWER RUSH! or riders banner was left on the title)
  musicStop();
  jingleStop();
  G.introDone = false;
  G.state = 'title';
  G.t = 0;
} // quitting a game: the intro again, from silence (Chris 2026-11-07)
const INTRO_LEN = 236; // fallback; really the fanfare's length plus a beat of READY (50 frames), then GO and the music (Chris 2026-11-07: wait a sec)
