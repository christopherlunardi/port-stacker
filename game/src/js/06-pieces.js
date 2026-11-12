// ---------- containers ----------
// A container is PIECE_W tiles wide in PANELS panels. Walk across every panel and it drops to the next catwalk below its
// columns, knocking down any container resting there; at the bottom it lands in the ship's bay. Enemies standing on it ride it down, and each rider makes it fall one floor
// further. Enemies under it are squashed.
function makePieces(def) {
  return def.pieces.map(([t, c, r]) => ({
    type: t,
    c,
    x: c * T,
    row: r,
    y: rowY(r),
    segs: new Array(PANELS).fill(0),
    state: 'rest',
    vy: 0,
    riders: [],
    extra: 0,
    bounce: 0,
    target: null
  }));
}
function plateTop(c) {
  return L.plateY - (G.stacks[c] || 0);
}
function fallTarget(pc) {
  for (let r = pc.row + 1; r < ROWS; r++)
    if (hasFloor(r, pc.c + 2) && hasFloor(r, pc.c + PIECE_W - 3)) return { kind: 'floor', row: r, y: rowY(r) };
  return { kind: 'plate', y: plateTop(pc.c) };
}
function pressPieces(e) {
  if (floorRowAt(e.y) < 0) return;
  for (const pc of G.pieces) {
    if (pc.state !== 'rest' || pc.y !== e.y || e.x < pc.x || e.x >= pc.x + PIECE_W * T) continue;
    const s = Math.floor(((e.x - pc.x) * PANELS) / (PIECE_W * T));
    if (!pc.segs[s]) {
      pc.segs[s] = 1;
      SFX.press();
      if (pc.segs.every(Boolean)) startFall(pc);
    }
  }
}
// chains (Chris 2026-11-07): a container knocked down by the one above is a chain link; each link scores double the last (100, 200, 400...),
// plays a note higher than the last, and shows a bigger CHAIN popup. Chris 2026-11-10: the knock-on is a move too (it adds to the combo and
// is multiplied), so a long chain feeds the combo ("I like doing the largest chains possible")
function chainBonus(pc) {
  const n = pc.chain || 0;
  if (!n) return;
  const KNOCK = ['', 'DOUBLE KNOCK', 'TRIPLE KNOCK', 'QUAD KNOCK']; // named, not 'X3', so it can't be read as the combo's multiplier (Chris 2026-11-08)
  addScore(100 * Math.pow(2, n - 1), pc.x + 32, pc.y - 30, KNOCK[n] || 'MEGA KNOCK', true, 9 + n * 2.5);
  SFX.chain(n);
}
// would this enemy ride this container down if it dropped now? (on the catwalk, or on a ladder with his feet in the container: Chris
// 2026-11-08, one on a ladder got neither). The rider pips (drawRiderPips) show the same test, so they never promise a rider who wouldn't go.
function wouldRide(e, pc) {
  return (
    (e.state === 'walk' || e.state === 'stun') &&
    e.y <= pc.y &&
    e.y >= pc.y - RIDE_REACH &&
    e.x >= pc.x - 2 &&
    e.x <= pc.x + PIECE_W * T + 1
  );
}
// the blue pips: anyone below the container, on any catwalk or ladder under it, walking or stunned (Chris 2026-11-11: "I just wanted it to
// be lit when something is under it on any catwalk"; a forecast of the squash with knock-ons and look-ahead was too complex). Riders don't count.
function enemiesUnder(pc) {
  let n = 0;
  for (const e of G.enemies)
    if ((e.state === 'walk' || e.state === 'stun') && !wouldRide(e, pc) && e.y > pc.y && e.x >= pc.x - 3 && e.x <= pc.x + PIECE_W * T + 2) n++;
  return n;
}
function startFall(pc, from) {
  pc.state = 'fall';
  if (pc.gold && !pc.powered) {
    // (Chris 2026-11-09: twice killed between knocking it down and the shatter) the power-up starts the moment it drops
    pc.powered = true;
    goldStart();
  }
  pc.drop = from ? from.drop : ++G.dropN; // one drop: the container Buck sent down and everything it knocks down after it
  pc.squashN = 0;
  pc.y0 = pc.y;
  pc.vy = 0.6;
  pc.segs = new Array(PANELS).fill(1);
  pc.riders = [];
  for (const e of G.enemies) {
    if (wouldRide(e, pc)) {
      e.state = 'ride';
      e.rideOff = e.x - pc.x;
      pc.riders.push(e);
    }
  }
  pc.extra = pc.riders.length;
  pc.target = fallTarget(pc);
  SFX.drop();
  if (pc.riders.length) SFX.riderSend();
}
function updatePieces() {
  for (const pc of G.pieces) {
    G.dropNow = pc.drop || 0;
    if (pc.bounce > 0) pc.bounce--;
    if (pc.state !== 'fall') continue;
    if (pc.target.kind === 'plate') pc.target.y = plateTop(pc.c);
    pc.vy = Math.min(pc.vy + 0.2, 4.5);
    const oy = pc.y,
      ny = pc.y + pc.vy;
    for (const e of G.enemies.slice()) {
      // squash anyone the piece comes down on, above where it lands
      if (e.state !== 'walk' && e.state !== 'stun') continue;
      if (e.x < pc.x - 3 || e.x > pc.x + PIECE_W * T + 2 || e.y > pc.target.y || e.y <= pc.y0) continue;
      // anyone below where it started, on a catwalk or a ladder, is hit once its bottom reaches his middle (even one just under the
      // catwalk, already level with it when it drops)
      if (ny >= e.y - 5) {
        (G.flats = G.flats || []).push({ x: e.x, y: e.y, t: 40, flip: e.dx < 0, type: e.type }); // everyone squashed shows flat for a moment (drawFlats)
        killEnemy(e);
        pc.squashN = (pc.squashN || 0) + 1;
        if (G.st) G.st.squash++;
        addScore(
          worthPts(SQUASH_PTS * Math.pow(2, pc.squashN - 1), enemyWorth(e)),
          e.x,
          e.y - 14,
          pc.squashN > 1 ? 'SQUASH X' + pc.squashN : 'SQUASH'
        );
        SFX.squash();
      }
    }
    if (ny >= pc.target.y) {
      pc.y = pc.target.y;
      land(pc);
    } else pc.y = ny;
    for (const e of pc.riders) {
      e.x = pc.x + e.rideOff;
      e.y = Math.round(pc.y);
    }
  }
  G.dropNow = 0;
}
// riders: one is easy (Chris 2026-11-07), so it's a small reward; luring a group onto one container is the jackpot, climbing steeply
const RIDER_PTS = [0, 300, 1500, 6000, 20000];
const RIDE_REACH = 10; // how far above the catwalk an enemy's feet can be (on a ladder, in the container) and still ride it
// what an enemy is worth (Chris 2026-11-09: harder enemies pay more): squashes and
// riders are multiplied by the enemy's worth (ENEMY_DEF.worth: Pratt 1, Crab and Watchman 1.25, Forklift and Gull 1.5), and in overtime,
// where they're faster and smarter, by a quarter more each overtime. Riders use the average worth of who's on board.
function enemyWorth(e) {
  return ((ENEMY_DEF[e.type] && ENEMY_DEF[e.type].worth) || 1) * (1 + 0.25 * heat());
}
function worthPts(base, worth) {
  return Math.round((base * worth) / 50) * 50;
}
const SQUASH_PTS = 2000; // (Chris 2026-11-08, bot report: riders were 6-12 a stage, squashes 1-3; squashes take timing, so they pay big)
function land(pc) {
  G.dropNow = pc.drop || 0;
  if (pc.target.kind === 'plate') SFX.landShip();
  else SFX.land();
  pc.bounce = 8;
  pc.vy = 0;
  G.landed++;
  if (pc.target.kind === 'floor') {
    pc.row = pc.target.row;
    pc.y = pc.target.y;
    const other = G.pieces.find(o => o !== pc && o.state === 'rest' && o.c === pc.c && o.row === pc.row);
    if (other) {
      startFall(other, pc);
      other.chain = (pc.chain || 0) + 1;
    } // a chain: this one knocked the next one down
    addScore(50, pc.x + 24, pc.y - 22);
    if (pc.extra > 0) {
      pc.extra--;
      pc.target = fallTarget(pc);
      pc.vy = 0.8;
      return;
    } // a rider aboard: keep going
    chainBonus(pc);
    pc.chain = 0;
    if (pc.gold)
      goldBreak(pc); // the power crate shatters where it ends up (06b-gold.js)
    else {
      pc.state = 'rest';
      pc.segs = new Array(PANELS).fill(0);
    }
  } else if (pc.gold) {
    chainBonus(pc);
    pc.chain = 0;
    pc.y = plateTop(pc.c);
    goldBreak(pc); // into the ship's bay: it shatters there, and isn't part of the load
  } else {
    chainBonus(pc);
    pc.chain = 0;
    pc.y = plateTop(pc.c);
    G.stacks[pc.c] = (G.stacks[pc.c] || 0) + PIECEDEF[pc.type].h;
    G.stackN[pc.c] = (G.stackN[pc.c] || 0) + 1;
    pc.state = 'plate';
    addScore(50, pc.x + 24, pc.y - 22);
    if (G.stackN[pc.c] === G.colTotal[pc.c]) {
      addScore(1000, pc.x + 24, pc.y - 30, 'BAY FULL!', false);
      SFX.order();
      // a full bay gives a horn (Chris 2026-11-08: the one way to earn more; the crane's refill crate is off)
      G.p.horns++;
      addPop(pc.x + 24, pc.y - 44, 'HORN+1', 'yel');
      SFX.pickup();
    }
  }
  if (pc.riders.length) {
    const n = pc.riders.length;
    if (G.st) G.st.riders += n;
    const worth = pc.riders.reduce((a, e) => a + enemyWorth(e), 0) / n; // the riders' average worth
    for (const e of pc.riders) killEnemy(e);
    addScore(worthPts(RIDER_PTS[Math.min(n, 4)], worth), pc.x + 32, pc.y - 26, n > 1 ? n + ' RIDERS!!' : 'RIDER', n); // each rider is a move
    SFX.rider();
    if (n > 1) {
      G.banner = { text: n + ' RIDERS - JACKPOT!', t: 120 };
      SFX.order();
    }
    pc.riders = [];
  }
}
