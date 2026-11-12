// ---------- stages ----------
// Each stage is built from lists, in tiles (48 columns x 33 rows; row r sits at y = FY + r*8):
//   floors  [row, firstCol, lastCol]      catwalks
//   ladders [col, topRow, bottomRow]      both ends on a catwalk; catwalks in between are crossings
//   pieces  [kind, leftCol, row]          containers, PIECE_W tiles wide, resting on a catwalk; they drop to the ship's bay under the same columns
//   plates  [leftCol, ...]                the ship's bays (row 30 is the deck), one under each column of containers
//   start [col,row], spawns [[col,row]...] (the doors), enemies (the roster, in spawn order)
// The deck is at y=264; a bay takes 4 containers (4 x 20 = 80px), well clear of the lowest catwalk (row 19, y=176, 8px deep).
// The game logic works in this 384x288 field (zoomed out from 320x240 so catwalks are 40px apart and the score bar has room: Chris
// 2026-11-07, Workshop layout round 1); catwalks are rows 4/9/14/19. The renderer scales it to the screen with the drawn art.
const PIECE_W = 8,
  PANELS = 4; // a container is 8 tiles wide, in 4 panels of 2 tiles; walk across every panel to drop it
const PIECEDEF = {
  // container colours; h is the height a landed container adds to its bay's stack (and how tall it's drawn)
  pink: { name: 'pink container', h: 20 },
  yel: { name: 'yellow container', h: 20 },
  blue: { name: 'blue container', h: 20 },
  orange: { name: 'orange container', h: 20 }
};
const PLATE_ROW = 30;
// House rules for the layouts (Fable's level review, Chris picked them on the Workshop 2026-11-10): side ladders at columns 6 and 41,
// ladders between container columns at 17 and 30, short ladders inside the outer containers at 11 and 36, the middle ladder at 23; a
// break in a catwalk is a whole space between columns (16-19, 28-31) or the whole middle (16-31); every stage is an exact mirror (c with
// 47-c) or the same turned upside down. (1-2 Broken Deck stays as it was: Chris kept it.)
const LEVELS = [
  // (Workshop stage11-r1, Chris 2026-11-10: Fable's tidy layout)
  // 1-1 HARBOR PIER: the whole pier, nothing broken. Mirror image left to right. The ladders thin out on the way down: six off the top
  // catwalk (where the doors are, so there is always a way out next to you), five in the middle, four at the bottom.
  {
    name: 'HARBOR PIER',
    start: [19, 19],
    tip: 'LOAD THE SHIP!',
    floors: [
      [4, 0, 47],
      [9, 0, 47],
      [14, 0, 47],
      [19, 0, 47]
    ],
    ladders: [
      [6, 4, 19],
      [17, 4, 19],
      [30, 4, 19],
      [41, 4, 19],
      [11, 4, 9],
      [36, 4, 9],
      [23, 9, 14]
    ],
    pieces: [
      ['pink', 8, 4],
      ['yel', 8, 9],
      ['blue', 8, 14],
      ['orange', 8, 19],
      ['pink', 20, 4],
      ['yel', 20, 9],
      ['blue', 20, 14],
      ['orange', 20, 19],
      ['pink', 32, 4],
      ['yel', 32, 9],
      ['blue', 32, 14],
      ['orange', 32, 19]
    ],
    plates: [8, 20, 32],
    spawns: [
      [1, 4],
      [46, 4]
    ],
    doors: true,
    enemies: ['pratt', 'crab', 'pratt']
  },
  // (Chris 2026-11-08: the side ladders stand inside the doors, 12 px from the outer containers like the ladders between columns, not under the doors, so enemies step out before they can climb; ladders
  // on the same side line up from floor to floor)
  // Stage 2 introduces gaps: the two middle catwalks are broken in different places, so you can't walk across; two ladders run straight
  // past a gap without stopping. The trick is planning which ladder reaches the far half of a container. Crabs spawn on the short pieces.
  {
    name: 'BROKEN DECK',
    start: [19, 19],
    tip: 'MIND THE GAPS',
    floors: [
      [4, 0, 47],
      [9, 0, 15],
      [9, 20, 47],
      [14, 0, 27],
      [14, 32, 47],
      [19, 0, 47]
    ],
    // (Chris 2026-11-10: the two side ladders run the whole height now; cut short, they made pockets a Pratt could corner you in)
    ladders: [
      [6, 4, 19],
      [17, 4, 19],
      [13, 9, 14],
      [25, 14, 19],
      [30, 9, 19],
      [37, 4, 9],
      [41, 4, 19]
    ],
    pieces: [
      ['pink', 8, 4],
      ['yel', 8, 9],
      ['blue', 8, 14],
      ['orange', 8, 19],
      ['yel', 20, 4],
      ['pink', 20, 9],
      ['orange', 20, 14],
      ['blue', 20, 19],
      ['blue', 32, 4],
      ['orange', 32, 9],
      ['pink', 32, 14],
      ['yel', 32, 19]
    ],
    plates: [8, 20, 32],
    spawns: [
      [1, 4],
      [46, 4]
    ],
    doors: true,
    enemies: ['pratt', 'crab', 'pratt', 'crab']
  },
  // (Workshop stage13-r1, Chris 2026-11-10: Fable's tidy layout)
  // 1-3 CONVEYOR LINE: the two belts run opposite ways, so the stage is the same turned upside down (a pinwheel). The belts and the side
  // ladders make the big loop; the two long ladders in the spaces (17 from the top to the lower belt, 30 from the upper belt to the bottom)
  // make a small loop round the middle column. Both loops run clockwise with the belts. One short ladder off the top, its twin off the bottom.
  {
    name: 'CONVEYOR LINE',
    start: [19, 19],
    tip: 'RIDE THE BELTS',
    floors: [
      [4, 0, 47],
      [9, 0, 47],
      [14, 0, 47],
      [19, 0, 47]
    ],
    belts: [
      [9, 0, 47, 1],
      [14, 0, 47, -1]
    ],
    ladders: [
      [6, 4, 19],
      [41, 4, 19],
      [17, 4, 14],
      [30, 9, 19],
      [36, 4, 9],
      [11, 14, 19]
    ],
    pieces: [
      ['orange', 8, 4],
      ['pink', 8, 9],
      ['yel', 8, 14],
      ['blue', 8, 19],
      ['blue', 20, 4],
      ['yel', 20, 9],
      ['pink', 20, 14],
      ['orange', 20, 19],
      ['yel', 32, 4],
      ['orange', 32, 9],
      ['blue', 32, 14],
      ['pink', 32, 19]
    ],
    plates: [8, 20, 32],
    spawns: [
      [1, 4],
      [46, 4]
    ],
    doors: true,
    enemies: ['pratt', 'pratt', 'crab', 'pratt']
  },
  // (Workshop stage24-r1, Chris 2026-11-10: Fable's tidy layout)
  // 2-4 PIER 9: an S. The same turned upside down. The second catwalk is broken right of the middle column, the third left of it; the long
  // part of each is a belt that carries you away from the break, out toward the side ladder (so the dead ends are the calm spots). One
  // ladder in the middle joins the two belts; the short parts each have a short ladder as a back door.
  {
    name: 'PIER 9',
    start: [19, 19],
    tip: 'NEW PIER',
    floors: [
      [4, 0, 47],
      [9, 0, 27],
      [9, 32, 47],
      [14, 0, 15],
      [14, 20, 47],
      [19, 0, 47]
    ],
    belts: [
      [9, 0, 27, -1],
      [14, 20, 47, 1]
    ],
    ladders: [
      [6, 4, 19],
      [41, 4, 19],
      [17, 4, 9],
      [30, 14, 19],
      [36, 4, 9],
      [11, 14, 19],
      [23, 9, 14]
    ],
    pieces: [
      ['blue', 8, 4],
      ['orange', 8, 9],
      ['pink', 8, 14],
      ['yel', 8, 19],
      ['pink', 20, 4],
      ['blue', 20, 9],
      ['yel', 20, 14],
      ['orange', 20, 19],
      ['orange', 32, 4],
      ['yel', 32, 9],
      ['blue', 32, 14],
      ['pink', 32, 19]
    ],
    plates: [8, 20, 32],
    spawns: [
      [1, 4],
      [46, 4]
    ],
    doors: true,
    enemies: ['pratt', 'crab', 'pratt', 'pratt', 'pratt']
  },
  // (Workshop stage35-r1, Chris 2026-11-10: Fable's tidy layout)
  // 3-5 LAST CALL: Pier 9's S the other way round (a Z), with the belts now dragging you INTO the dead ends, the top catwalk a belt too, and
  // the side ladders each one floor short. The same turned upside down (only the top belt has no twin). Breaks are whole spaces, ladders on
  // the house columns, none beside a door.
  {
    name: 'LAST CALL',
    start: [24, 19],
    tip: 'THE FINALE',
    floors: [
      [4, 0, 47],
      [9, 0, 15],
      [9, 20, 47],
      [14, 0, 27],
      [14, 32, 47],
      [19, 0, 47]
    ],
    belts: [
      [4, 0, 47, 1],
      [9, 20, 47, -1],
      [14, 0, 27, 1]
    ],
    ladders: [
      [6, 4, 14],
      [41, 9, 19],
      [17, 4, 19],
      [30, 4, 19],
      [36, 4, 9],
      [11, 14, 19]
    ],
    pieces: [
      ['pink', 8, 4],
      ['blue', 8, 9],
      ['orange', 8, 14],
      ['yel', 8, 19],
      ['orange', 20, 4],
      ['yel', 20, 9],
      ['pink', 20, 14],
      ['blue', 20, 19],
      ['yel', 32, 4],
      ['pink', 32, 9],
      ['blue', 32, 14],
      ['orange', 32, 19]
    ],
    plates: [8, 20, 32],
    spawns: [
      [1, 4],
      [46, 4]
    ],
    doors: true,
    enemies: ['pratt', 'crab', 'pratt', 'crab', 'pratt']
  }
];
// SHIFTS (Chris 2026-11-08, classic arcade style): G.loop is the shift (0 = the first), G.level the stage in it, which is also the layout. Shift 1
// plays layouts 1-3. Every shift after replays every layout so far, faster, and ends on one new layout: shift 2 is the first three at
// night plus PIER 9 (2-1 to 2-4); shift 3 would add the next new layout, and so on. Until there's a new one, a shift replays them all.
// OVERTIME (Chris 2026-11-09: overtime 1 shift 1 with all the shift 1 stages, overtime 1 shift 2 with the shift 2 ones, and so on): after
// shift 3, each OVERTIME n replays shift 1 (day, 3 stages), shift 2 (night, 4) and shift 3 (storm, 5) in turn. G.loop keeps counting
// shifts; baseShift() is the shift 1-3 it replays and otNum() which overtime it is (0 before).
function baseShift(w = G.loop) {
  return w < 3 ? w : (w - 3) % 3;
}
function otNum(w = G.loop) {
  return w < 3 ? 0 : 1 + Math.floor((w - 3) / 3);
}
function worldLen(w = G.loop) {
  return Math.min(LEVELS.length, 3 + baseShift(w));
}
function firstWorld(i) {
  return Math.max(0, i - 2);
} // the shift a layout first appears in, as its finale
function stagesBefore(w) {
  let n = 0;
  for (let i = 0; i < w; i++) n += worldLen(i);
  return n;
}
function stageReached() {
  return stagesBefore(G.loop) + G.level + 1;
} // counting every stage played: 1, 2, 3 ...
function stageLabel() {
  return baseShift() + 1 + '-' + (G.level + 1);
} // 1-1 1-2 1-3 2-1 2-2 2-3 2-4 3-1 ... (Chris 2026-11-09: overtime is branded on its own, so the stage number reads as before)
function stageId() {
  return (otNum() ? 'OT' + otNum() + ' ' : '') + stageLabel();
} // for logs and the bots: OT1 2-3
function stageTip() {
  // the intro card's line under the name: the night shift starts, or a layout is new
  if (G.level === 0 && LOOK() !== 'day') return LOOK() === 'night' ? 'NIGHT SHIFT' : 'STORM SHIFT';
  return G.loop === firstWorld(G.level) ? L.def.tip || '' : '';
}
function stageRoster() {
  // (2026-11-10) rolled once per stage and kept: each life (and the play log) used to re-roll the crab/Forklift mix
  const key = G.level + '|' + G.loop;
  if (!L || !L.def) return rollRoster();
  if (L.rosterKey !== key) (L.roster = rollRoster()), (L.rosterKey = key);
  return L.roster.slice();
}
function rollRoster() {
  // the enemies for this stage: the layout's list, with some of its walkers turned into Night Watchmen from shift 2 on. Shift 2 ramps a
  // quarter, half, three quarters, all (2-1 to 2-4); later shifts are all Watchmen.
  // (Chris 2026-11-09) overtime replays the whole game's structure: its shift 1 has Pratts and crabs again, its shift 2 brings in the
  // Watchmen, its shift 3 the Forklifts and gulls, but each starts further along and ramps faster (otRamp), and one more walker of that
  // shift's kind comes in each overtime
  const base = L.def.enemies.slice(),
    s = baseShift(),
    n = heat(),
    extra = n <= 6 ? n : 6 + Math.floor(Math.log2(n - 5)); // one more walker each overtime, then one more every time the overtime doubles
  if (!s) {
    // (Chris 2026-11-10, from the new-player review: 1-2 was harder than 1-3) shift 1's Broken Deck has one crab, not two (overtime's
    // shift 1 too, which replays it); later shifts keep both
    if (G.level === 1) base.splice(base.lastIndexOf('crab'), 1);
    for (let i = 0; i < extra; i++) base.push('pratt');
    return base;
  }
  const f = s >= 2 ? 1 : Math.min(1, (G.level + 1) / worldLen() + 0.25 * n),
    walk = base.map((t, i) => (t === 'pratt' ? i : -1)).filter(i => i >= 0),
    k = Math.max(1, Math.round(f * walk.length));
  walk.forEach((i, j) => {
    if (Math.floor(((j + 1) * k) / walk.length) > Math.floor((j * k) / walk.length)) base[i] = 'watch';
  });
  if (s >= 2) {
    // the Forklift takes over from the Captain (Chris 2026-11-09): on 3-1 about 40% of the guards are forklifts, rising to all of them on
    // the shift's last stage; after shift 3, all forklifts
    // (Chris 2026-11-09: ramp slower) about 15% on 3-1, a quarter on 3-2, under half on 3-3, then 70% and all on the finale
    const f = Math.min(1, 0.15 + 0.85 * Math.pow(G.level / Math.max(1, worldLen() - 1), 1.6) + 0.3 * n);
    for (let i = 0; i < base.length; i++) if (base[i] === 'crab' && rand() < f) base[i] = 'fork';
    // the Gull (Chris 2026-11-09: later stages fewer enemies but tougher ones): he takes the place of a walker rather than adding one;
    // one on 3-1 to 3-4, two on the finale and in overtime. The last walkers in the list give way.
    const gulls = G.level >= 4 || n >= 2 ? 2 : 1;
    for (let g = 0; g < gulls; g++) {
      const i = base.lastIndexOf('watch');
      if (i < 0) break;
      base[i] = 'gull';
    }
  }
  for (let i = 0; i < extra; i++) base.push('watch');
  return base;
}
// OVERTIME (Chris 2026-11-09: not many more worlds, then everything starts over from map one, harder and harder, forever, until it's
// impossible): after the storm shift come OVERTIME 1, 2, 3...; each replays shift 1, shift 2 and shift 3 with their own enemies and looks
// (baseShift). heat() is which overtime it is (0 before). (Chris 2026-11-09, later the same day) it's the same structure as the game: so
// overtime 1 drops back to Pratts on its first stage, but everything starts further along and ramps faster (otRamp): walkers quicker,
// guards harder, more Watchmen sooner in its shift 2, more Forklifts and bolder gulls in its shift 3, one more walker each overtime. Per
// overtime, flat: Watchmen and guards sharper, everyone chases more, enemies back sooner. Your own rules (horns, stuns, par) never change.
// (Chris 2026-11-11: "it should keep scaling", no overtime where it all stops) every value overtime pushes keeps moving forever: the ones
// that used to stop at a hard limit (kept so the game can't break: enemies too fast to see, back the instant they're squashed) now ease off
// past that point instead, a little less each overtime but never quite stopping.
// softUp: v climbing past knee grows on, more and more slowly (logarithmically).
function softUp(v, knee, k) {
  return v <= knee ? v : knee + k * Math.log(1 + (v - knee) / k);
}
// softDown: v falling by `step` an overtime: past knee it keeps shrinking by the factor keep for each step's worth, never below low
function softDown(v, knee, step, keep, low) {
  return v >= knee ? v : Math.max(low, knee * Math.pow(keep, (knee - v) / step));
}
function heat() {
  return otNum();
}
// overtime's version of a value that climbs through a shift (Chris 2026-11-09: the same structure, it just starts with more and ramps up
// faster): v is the value at this stage in the shift being replayed, v0 at its first stage; overtime n starts a step higher and climbs
// three quarters as fast again per overtime (Chris 2026-11-09: harder than it was). Before overtime it's just v.
function otRamp(v, v0, step) {
  const n = heat();
  return n ? v + step * n + (v - v0) * 0.75 * n : v;
}
// (Chris 2026-11-09: fewer horns felt like pulling the rug out; the rules should feel seriously fair, only the enemies a lot harder) your
// rules never change in overtime: par and free horns are the same as ever (Buck's pace, and with it the stun and rush, since build 214). Only the enemies' side gets tougher.
function parSecs() {
  return 90; // (Chris 2026-11-09) a minute and a half, every stage (was two minutes; real clears are 30-70 s)
}
// Buck's pace (Chris 2026-11-11: "buck can get faster for overtime scaling", once the walkers get near his speed, but "it must keep getting
// harder"): 1 until overtime; there, once this stage's fastest walker passes 0.9, Buck gains 60% of every bit they gain past it, so the gap
// still closes stage by stage (OT1 2-4: Watchman 1.03, Buck 1.08; OT2 2-4: 1.24 against 1.20) without a sudden wall. Worked out once a stage.
function buckSpeed() {
  if (!heat() || !L) return 1;
  const key = G.level + '|' + G.loop;
  if (L.buckKey !== key) {
    const types = [...new Set(stageRoster())].filter(t => ENEMY_DEF[t] && ENEMY_DEF[t].home != null);
    const top = Math.max(0, ...types.map(walkerSpeed));
    L.buckKey = key;
    L.buckSpeed = 1 + 0.6 * Math.max(0, top - 0.9);
  }
  return L.buckSpeed;
}
// (Chris 2026-11-11) and the things that last a while shrink with his pace, so a quicker Buck doesn't get a stun or a POWER RUSH that seems
// to last forever: the horn's stun and the rush run 1/buckSpeed as long (both exactly as before until Buck speeds up)
function stunTime() {
  return Math.round(160 / buckSpeed());
}
function respawnDelay() {
  return Math.round(softDown(220 - 35 * heat(), 60, 35, 0.88, 12)); // enemies come back sooner (their side), sooner every overtime
}
function freeHorns() {
  return 5;
}
// each shift has its look (Chris 2026-11-09): day, the night harbor, the storm at dusk, then round again
const SHIFT_LOOKS = ['day', 'night', 'storm'];
function LOOK() {
  return L && !['title', 'board', 'initials', 'splash', 'studio'].includes(G.state) ? SHIFT_LOOKS[baseShift()] : 'day';
}
function NIGHT() {
  return LOOK() === 'night';
}
function STORM() {
  return LOOK() === 'storm';
}
let L = null; // the stage being played: geometry built from its lists
function rowY(r) {
  return FY + r * T;
}
function buildLevel(def) {
  const floor = Array.from({ length: ROWS }, () => new Uint8Array(COLS));
  for (const [r, a, b] of def.floors) for (let c = a; c <= b; c++) floor[r][c] = 1;
  const ladders = def.ladders.map(([c, t, b]) => ({ c, x: c * T + 4, top: rowY(t), bot: rowY(b), rt: t, rb: b }));
  const belts = (def.belts || []).map(([r, a, b, dir]) => ({ r, a, b, dir, y: rowY(r) }));
  return { def, floor, ladders, belts, plateY: rowY(PLATE_ROW) };
}
// ---------- conveyor belts: anyone standing on one (not on a ladder) is carried along it ----------
const BELT_SPEED = 0.38; // pixels a frame; Buck walks 1, Pratt 0.6
function beltUnder(o) {
  if (!L || !L.belts) return null;
  for (const b of L.belts) if (o.y === b.y && colOf(o.x) >= b.a && colOf(o.x) <= b.b) return b;
  return null;
}
function beltCarry(o, isPlayer) {
  const b = beltUnder(o);
  if (!b) {
    o.beltAcc = 0;
    return;
  }
  o.beltAcc = (o.beltAcc || 0) + BELT_SPEED;
  let moved = false;
  while (o.beltAcc >= 1) {
    o.beltAcc -= 1;
    const nx = o.x + b.dir;
    if (!hasFloor(floorRowAt(o.y), colOf(nx)) || nx < 2 || nx > COLS * T - 2) break;
    o.x = nx;
    moved = true;
    if (isPlayer) pressPieces(o);
  }
  return moved;
}
function updateBelts() {
  if (!L.belts || !L.belts.length) return;
  const p = G.p;
  if (!(p.climb && floorRowAt(p.y) < 0)) beltCarry(p, true);
  for (const e of G.enemies) if ((e.state === 'walk' || e.state === 'stun') && !e.dy) beltCarry(e, false);
}
