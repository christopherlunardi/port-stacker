// ---------- the dock pests that chase you ----------
// They walk the same floors and ladders. At every crossing (a ladder meeting a floor) or dead end they pick a way: mostly toward the
// worker, sometimes not (chase), never straight back unless there's no other way. The air horn stuns them; a stunned one can be walked through.
const ENEMY_DEF = {
  pratt: { speed: 0.52, top: 0.66, home: 0, chase: 0.8, pts: 150, worth: 1 }, // (Chris 2026-11-09: early enemies a little easier, was 0.55 to 0.68) // Inspector Pratt, the harbor inspector: shift 1's walker
  gull: { speed: 0.55, chase: 0, pts: 300, worth: 1.5 }, // the Gull (shift 3, Chris 2026-11-09): flies, ignores ladders, dive-bombs you (updateGull)
  watch: { speed: 0.72, top: 0.82, home: 1, chase: 1, pts: 200, worth: 1.25, last: 0.86 }, // (Chris 2026-11-11: ramp a tiny bit more: Pratt's top 0.64 -> 0.66, the Watchman's start 0.70 -> 0.72 (still a step quicker than Pratt), top 0.80 -> 0.82, 0.84 -> 0.86 on 3-5) // (Chris 2026-11-09: was 0.76 to 0.86) last: his speed on 3-5, rising from top over shift 3 // top lowered from 0.94 (bot report: 2-4 cleared 1 in 6) // the Night Watchman (World 2): like Pratt, but turns round when you're behind him (updateWatch); chase 1 (Chris 2026-11-11): he never takes a wrong turn
  crab: { speed: 0.45, chase: 0, pts: 250, worth: 1.25 },
  fork: { speed: 0.5, chase: 0, pts: 300, worth: 1.5 }, // the Forklift (shift 3, Chris 2026-11-09): a catwalk guard like the crab, a longer rev, charges to the end // guards one catwalk: patrols, and when you're on its catwalk winds up and charges (updateCrab)
  rat: { speed: 0.5, chase: 0.5, pts: 200, worth: 1 } // wanders
};
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, -1],
  [0, 1]
];
// Where an enemy will come in, picked a few seconds ahead so the stage can warn you (Chris 2026-11-07): Pratt comes out of a door at the top
// corners (its lamps light one by one, then it rattles open); a crab hauls itself up over the front edge of a catwalk (its claws poke up and
// snap first). Both pick the spot farthest from the worker, with some randomness.
// the crab drops in (Chris's pick, Workshop crab entrance round 1, C, 2026-11-08): a shadow grows where he'll land, a falling whistle,
// then he falls from the top of the screen (the first 21 of his 46 spawn frames) and lands with a squash and a puff of dust
const CRAB_WHISTLE = 40,
  CRAB_LAND = 25;
const SPAWN_WARN = 180,
  DOOR_W = 24,
  DOOR_H = 34;
function doorRect(i) {
  const [c, r] = L.def.spawns[i],
    bot = rowY(r),
    x = c * T + 4 < PW / 2 ? 0 : PW - DOOR_W;
  return { x, top: bot - DOOR_H, bot, cx: x + DOOR_W / 2 };
}
const CRAB_MIN_RUN = 24; // columns: the Captain only lands on catwalks at least this long (half the field)
function pickSpawn(type) {
  const p = G.p,
    far = (x, y) => Math.abs(x - p.x) + Math.abs(y - p.y) * 1.5 + rand() * 90;
  if (type === 'gull') return { x: G.p.x < PW / 2 ? PW + 12 : -12, y: 0, door: -1, gull: true }; // in from the side away from Buck
  if (!GUARD(type)) {
    let best = 0,
      bd = -1;
    L.def.spawns.forEach((s, i) => {
      const d = doorRect(i),
        v = far(d.cx, d.bot);
      if (v > bd) {
        bd = v;
        best = i;
      }
    });
    const d = doorRect(best);
    return { x: d.cx, y: d.bot, door: best };
  }
  const lad = new Set(L.ladders.map(l => l.c)),
    cand = [];
  for (const [r, a, b] of L.def.floors) {
    if (b - a + 1 < CRAB_MIN_RUN) continue; // never on the short pieces of a broken catwalk: his charge corners you there (Chris 2026-11-08, bot report)
    for (let c = a + 3; c <= b - 3; c += 2)
      if (!lad.has(c) && !lad.has(c - 1) && !lad.has(c + 1)) {
        const x = c * T + 4,
          y = rowY(r);
        if (
          G.enemies.some(e => e.y === y && Math.abs(e.x - x) < 30) ||
          G.spawnQ.some(q => q.at && q.at.y === y && Math.abs(q.at.x - x) < 48)
        )
          continue;
        if (
          L.def.spawns.some((s, i) => {
            const d = doorRect(i);
            return y === d.bot && x > d.x - 40 && x < d.x + DOOR_W + 40;
          })
        )
          continue;
        cand.push([x, y]);
      }
  }
  let best = cand[0] || [PW / 2, rowY(L.def.floors[0][0])],
    bd = -1;
  for (const [x, y] of cand) {
    const v = far(x, y);
    if (v > bd) {
      bd = v;
      best = [x, y];
    }
  }
  return { x: best[0], y: best[1], door: -1, crab: true };
}
function spawnEnemy(type, at) {
  if (type === 'gull') return spawnGull(at);
  at = at || pickSpawn(type);
  const D = ENEMY_DEF[type],
    crab = GUARD(type);
  const e = {
    type,
    x: at.x,
    y: at.y,
    dx: at.x < PW / 2 ? 1 : -1,
    dy: 0,
    acc: 0,
    speed: walkerSpeed(type),
    chase: D.chase && heat() ? Math.min(0.99, D.chase + (1 - D.chase) * 0.4 * heat()) : D.chase, // smarter each overtime
    state: 'spawn',
    t: crab ? 46 : 36,
    anim: 0,
    rideOff: 0,
    mode: 'patrol',
    mt: 0,
    door: crab ? -1 : at.door
  };
  if (crab) e.dx = G.p.x < at.x ? -1 : 1;
  if (!canStep(e, e.dx, 0)) e.dx = -e.dx;
  if (!crab) SFX.doorOpen(); // (a crab's whistle and landing are timed in updateEnemies)
  G.enemies.push(e);
}
function updateDoors() {
  // each door's shutter rolls up while someone is coming out, and down again once they're clear
  if (!L.doorOpen) L.doorOpen = L.def.spawns.map(() => 0);
  L.def.spawns.forEach((s, i) => {
    const d = doorRect(i);
    for (const e of G.enemies) if (e.door === i && e.state !== 'spawn' && (e.y !== d.bot || Math.abs(e.x - d.cx) > 16)) e.door = -1;
    const want = G.enemies.some(e => e.door === i);
    L.doorOpen[i] = want ? Math.min(1, L.doorOpen[i] + 1 / 10) : Math.max(0, L.doorOpen[i] - 1 / 14);
  });
}
function spawnWarn() {
  // what's about to come in: for each queued enemy close to its time, where and how close (0 -> 1)
  return G.spawnQ.filter(q => q.at && q.t > 0).map(q => ({ at: q.at, k: 1 - q.t / SPAWN_WARN, t: q.t, type: q.type }));
}
// walker speeds (Chris 2026-11-08): each walker has a home shift, ramps from its start speed on that shift's first stage to its top
// speed on its last, and stays at the top after (Pratt is shift 1's: 1-1 to 1-3; the Watchman shift 2's: 2-1 to 2-4; a new walker
// will take shift 3 the same way). Others (the crab) speed up with difficulty(). Nothing walks faster than WALK_MAX (Buck is 1).
const WALK_MAX = 0.94;
function walkerSpeed(type) {
  const D = ENEMY_DEF[type];
  if (D.home == null) return Math.min(D.speed * difficulty(), WALK_MAX);
  if (!heat() && G.loop < D.home) return D.speed;
  // his speed at a stage of a shift (s: the shift being played, or replayed in overtime), then overtime's push on top
  const n = worldLen() - 1,
    s = baseShift(),
    at = l =>
      s < D.home
        ? D.speed
        : s > D.home
          ? D.last
            ? D.top + ((D.last - D.top) * l) / (n || 1)
            : D.top
          : Math.min(D.speed + ((D.top - D.speed) * l) / (n || 1), WALK_MAX);
  return softUp(otRamp(at(G.level), at(0), 0.12), 1.25, 0.4); // past 1.25 (deep in overtime) still quicker each overtime, more slowly // each overtime's walkers start 0.12 quicker, was 0.08 (Chris 2026-11-11: a bigger bump at the reset), so OT1 1-1's Pratts start at 1-3's top speed
}
function killEnemy(e) {
  const i = G.enemies.indexOf(e);
  if (i < 0) return;
  G.enemies.splice(i, 1);
  G.spawnQ.push({ type: e.type, t: respawnDelay() });
}
function isCrossing(e) {
  const r = floorRowAt(e.y);
  return r >= 0 && hasFloor(r, colOf(e.x)) && onLadderLine(e.x, e.y);
}
// The way to Buck along the catwalks and ladders (Chris 2026-11-11: on a broken catwalk Pratt and the Watchman "can't seem to find me", heading
// for the other side): every 8-px step's walking distance to him, worked out again whenever he moves to another step. An enemy choosing at
// a crossing counts a way as "toward him" when it really brings him closer by walking, not just when it points at him across a gap.
let PATHD = null,
  PATHK = '';
function pathStep(x, y) {
  // the step a point is on: its column's middle, and the nearest 8 px down the screen
  return [colOf(x) * T + T / 2, FY + Math.round((y - FY) / T) * T];
}
function pathNode(x, y) {
  const r = floorRowAt(y);
  return (r >= 0 && hasFloor(r, colOf(x))) || onLadderLine(x, y);
}
function pathDist() {
  const p = G.p;
  if (!p || !L) return null;
  let [sx, sy] = pathStep(p.x, p.y);
  if (!pathNode(sx, sy)) [sx, sy] = pathStep(p.x, p.y - T / 2); // part way up a ladder
  const k = sx + ',' + sy + ',' + G.level + ',' + G.loop;
  if (k === PATHK) return PATHD;
  PATHK = k;
  const D = new Map(),
    q = [[sx, sy]];
  if (!pathNode(sx, sy)) return (PATHD = null);
  D.set(sx + ',' + sy, 0);
  while (q.length) {
    const [x, y] = q.shift(),
      d = D.get(x + ',' + y);
    for (const [dx, dy] of DIRS) {
      const nx = x + dx * T,
        ny = y + dy * T,
        nk = nx + ',' + ny;
      if (D.has(nk) || nx < 0 || nx > PW) continue;
      const ok = dy
        ? onLadderLine(x, y) &&
          onLadderLine(nx, ny) &&
          L.ladders.some(l => l.x === x && Math.min(y, ny) >= l.top && Math.max(y, ny) <= l.bot)
        : floorRowAt(y) >= 0 && hasFloor(floorRowAt(y), colOf(x)) && hasFloor(floorRowAt(y), colOf(nx));
      if (!ok) continue;
      D.set(nk, d + 1);
      q.push([nx, ny]);
    }
  }
  return (PATHD = D);
}
function decide(e) {
  const opts = DIRS.filter(d => canStep(e, d[0], d[1]));
  if (!opts.length) return;
  let pool = opts.filter(d => !(d[0] === -e.dx && d[1] === -e.dy));
  if (!pool.length) pool = opts;
  const p = G.p,
    D = pathDist(),
    [hx, hy] = pathStep(e.x, e.y),
    here = D && D.get(hx + ',' + hy);
  let best = pool[0],
    bs = -1e9;
  for (const d of pool) {
    let s = rand() * 40 * (1 - e.chase) * 2; // (the Watchman's chase is 1: no wrong turns)
    const there = here != null ? D.get(hx + d[0] * T + ',' + (hy + d[1] * T)) : null;
    if (here != null && there != null) {
      // by the real way round: a step that shortens his walk to Buck
      if (there < here) s += (d[1] !== 0 ? 50 : p.y === e.y ? 60 : 30) * e.chase;
    } else if (d[1] !== 0) {
      if (p.y !== e.y && Math.sign(p.y - e.y) === d[1]) s += 50 * e.chase;
    } else if (Math.sign(p.x - e.x) === d[0]) s += (p.y === e.y ? 60 : 18) * e.chase;
    // no shadowing (Chris 2026-11-07): an enemy right behind another tends to pick a different way at a junction, unless it's straight at Buck on his catwalk
    if (
      G.enemies.some(
        o => o !== e && o.state === 'walk' && Math.abs(o.x - e.x) + Math.abs(o.y - e.y) < 24 && o.dx === d[0] && o.dy === d[1]
      ) &&
      !(d[1] === 0 && p.y === e.y && Math.sign(p.x - e.x) === d[0]) &&
      e.type !== 'watch' // (the Watchman never gives up the quickest way)
    )
      s -= 45;
    if (s > bs) {
      bs = s;
      best = d;
    }
  }
  e.dx = best[0];
  e.dy = best[1];
}
function updateEnemies() {
  updateLaunched(); // bashed enemies flying off (06b-gold.js)
  if (G.flats) {
    for (const f of G.flats) f.t--;
    G.flats = G.flats.filter(f => f.t > 0);
  }
  if (!DEV.noEnemies) {
    for (const q of G.spawnQ) {
      q.t--;
      if (q.t <= SPAWN_WARN && !q.at) q.at = pickSpawn(q.type);
      if (q.at && q.t > 0) {
        const n = Math.floor((1 - q.t / SPAWN_WARN) * 4);
        if (!q.at.crab && !q.at.gull && n > (q.lit || 0) && n <= 3) SFX.doorTick(n);
        q.lit = n; // a door lamp lights
        if (q.at.crab && q.t === CRAB_WHISTLE) SFX.crabFall(); // a falling whistle as the crab's shadow nears full size
      }
    } // claws snapping, faster as it nears
    const ready = G.spawnQ.filter(q => q.t <= 0);
    G.spawnQ = G.spawnQ.filter(q => q.t > 0);
    for (const q of ready) spawnEnemy(q.type, q.at);
  }
  updateDoors();
  for (const e of G.enemies) {
    e.anim++;
    if (e.state === 'spawn') {
      if (GUARD(e.type) && e.t === CRAB_LAND) SFX.crabLand();
      if (--e.t <= 0) e.state = 'walk';
      continue;
    }
    if (e.state === 'stun') {
      if (e.type === 'gull') gullFall(e); // a gull horned in the air drops to the catwalk below
      if (--e.t <= 0) e.state = 'walk';
      continue;
    }
    if (e.type === 'gull' && e.state === 'walk') {
      updateGull(e);
      continue;
    }
    if (e.state !== 'walk') continue;
    if (GUARD(e.type)) {
      updateCrab(e);
      continue;
    }
    if (e.type === 'watch' && updateWatch(e)) continue;
    e.acc += e.type === 'watch' && e.spotT > 0 ? watchRun(e.speed) : e.speed; // in his flashlight: running
    const n = Math.floor(e.acc);
    e.acc -= n;
    for (let i = 0; i < n; i++) {
      if (!canStep(e, e.dx, e.dy)) {
        decide(e);
        if (!canStep(e, e.dx, e.dy)) break;
      }
      if (
        G.enemies.some(
          o =>
            o !== e &&
            o.state === 'walk' &&
            o.dx === e.dx &&
            o.dy === e.dy &&
            (e.dy
              ? o.x === e.x && (o.y - e.y) * e.dy > 0 && (o.y - e.y) * e.dy < 6
              : o.y === e.y && (o.x - e.x) * e.dx > 0 && (o.x - e.x) * e.dx < 6)
        )
      )
        break; // close behind is fine (Chris likes catching a close pair), but never exactly on top of each other
      e.x += e.dx;
      e.y += e.dy;
      e.dist = (e.dist || 0) + 1;
      if (isCrossing(e)) decide(e);
    }
  }
}
// ---------- the Night Watchman (World 2, Chris 2026-11-08): Pratt can be shaken off because he never turns round; the Watchman can.
// When he's walking along a catwalk and the worker is on the same catwalk behind him (within WATCH.sight), he stops, swings his
// flashlight round (WATCH.turn frames, the warning that makes it fair), and turns to face him. Then he can't turn again for WATCH.cool.
// In his flashlight (Chris 2026-11-11): Buck on his catwalk in front of him, inside the beam (WATCH.beam px ahead, no gap between), and he
// breaks into a run (WATCH.run times his speed), the beam brighter, until Buck has been out of it for WATCH.keep frames.
const WATCH = { sight: 120, turn: 26, cool: 150, beam: 56, run: 1.45, keep: 30, runMax: 0.98 };
// (Chris 2026-11-11: "a bit more" than 1.3) his running speed: 1.45 times his walk, but only just short of Buck's own (1), so walking
// straight away you still pull clear, slowly (or dash, or horn him); in overtime, when he already walks near that, a tenth more
function watchRun(s) {
  return Math.min(s * WATCH.run, Math.max(WATCH.runMax, s * 1.1));
}
function inBeam(e, p) {
  const dx = (p.x - e.x) * e.dx;
  return !e.dy && p.y === e.y && floorRowAt(p.y) >= 0 && dx > 0 && dx < WATCH.beam + 10 && walkable(floorRowAt(p.y), e.x, p.x);
}
function updateWatch(e) {
  // returns true while he's busy turning (no walking this frame)
  if (e.cool > 0) e.cool--;
  if (G.p && inBeam(e, G.p) && PLAYING()) {
    if (!(e.spotT > 0)) SFX.watchSpot();
    e.spotT = WATCH.keep;
  } else if (e.spotT > 0) e.spotT--;
  if (e.turnT > 0) {
    if (--e.turnT === 0) {
      e.dx = -e.dx;
      e.cool = Math.round(softDown(WATCH.cool - 25 * heat(), 60, 25, 0.9, 20));
    }
    return true;
  }
  const p = G.p;
  const behind =
    p.y === e.y &&
    floorRowAt(p.y) >= 0 &&
    Math.sign(p.x - e.x) === -e.dx &&
    Math.abs(p.x - e.x) < WATCH.sight * (1 + 0.2 * heat()) &&
    walkable(floorRowAt(p.y), e.x, p.x); // on his catwalk, at his back (and no gap between: then turning round gets him nowhere)
  if (!e.dy && !e.cool && PLAYING() && canStep(e, -e.dx, 0) && (behind || watchNextDoor(e, p))) {
    e.turnT = Math.round(softDown(WATCH.turn - 4 * heat(), 14, 4, 0.9, 6)); // still a warning, shorter each overtime
    SFX.watchTurn();
    return true;
  }
  return false;
}
function catwalkRows() {
  return [...new Set(L.def.floors.map(f => f[0]))].sort((a, b) => a - b);
}
function walkable(r, x0, x1) {
  // every column between two points on catwalk r has floor (no gap in the way)
  for (let c = colOf(Math.min(x0, x1)); c <= colOf(Math.max(x0, x1)); c++) if (!hasFloor(r, c)) return false;
  return true;
}
function watchNextDoor(e, p) {
  // (Chris 2026-11-08) Buck on the catwalk just above or below, within sight: if the quickest ladder over to him is behind the Watchman
  // (and clearly quicker than any ladder ahead), he turns round to go and take it. Only next-door catwalks, so a crowd of them stays fair.
  const er = floorRowAt(e.y),
    pr = floorRowAt(p.y);
  if (er < 0 || pr < 0 || pr === er || Math.abs(p.x - e.x) > WATCH.sight * 1.4 * (1 + 0.2 * heat())) return false;
  const rows = catwalkRows();
  if (Math.abs(rows.indexOf(pr) - rows.indexOf(er)) !== 1) return false;
  const top = Math.min(e.y, p.y),
    bot = Math.max(e.y, p.y);
  let back = 1e9,
    ahead = 1e9;
  for (const l of L.ladders) {
    if (l.top > top || l.bot < bot || !walkable(er, e.x, l.x) || !walkable(pr, l.x, p.x)) continue;
    const cost = Math.abs(l.x - e.x) + Math.abs(l.x - p.x),
      side = Math.sign(l.x - e.x);
    if (side === -e.dx) back = Math.min(back, cost);
    else ahead = Math.min(ahead, cost);
  }
  return back < ahead - 24;
}
// ---------- the crab: a floor guard, not a chaser ----------
// It never climbs. It patrols its catwalk; when the worker is on the same catwalk and in front of it (or it turns to face him), it stops
// and shakes for half a second (the warning), charges sideways three times faster until it passes him or hits the end, then rests.
const CRAB = { wind: 32, charge: 2.1, rest: 50, sight: 150, reach: 96 }; // reach (Chris 2026-11-11: "I should be able to outrun him"): a charge runs out after 96 px (a container and a half)
// the Forklift (Chris 2026-11-09): revs up for longer (more warning), then charges flat out (he doesn't stop once he's past you) until his
// charge runs out or the catwalk ends, and needs longer to cool off
const FORK = { wind: 54, charge: 2.5, rest: 80, sight: 170, reach: 160 }; // reach: his charge runs out after 160 px, or at the end of the catwalk if that comes first (Chris 2026-11-11; it used to be always the end)
// ---------- the Gull (shift 3, Chris 2026-11-09) ----------
// He ignores ladders. He flies in from a side of the screen above the top catwalk, glides along toward Buck, and when Buck is below him
// and not too far off he dives at where Buck is standing, lands on that catwalk, struts toward him for a moment, then takes off again.
// The horn knocks him out of the air (he drops to the catwalk below, dizzy); landed, he can be squashed or ridden down like anyone.
// He gets bolder over the shift (e.gk, 0 on 3-1 to 0.8 on its last stage, eased 2026-11-09; from 1.35 in overtime, +0.35 each): faster, shorter breaks between dives, wider sight.
const GULL = { cruise: -12, sight: 50, dive: 1.7, land: 140, cool: 110 }; // cruise: height above the top catwalk
function gullSkill() {
  if (baseShift() < 2) return 0;
  const g = l => 0.8 * Math.pow(l / Math.max(1, worldLen() - 1), 1.6);
  return otRamp(g(G.level), g(0), 0.45); // bolder slowly, then fast at the end
}
function cruiseY() {
  return rowY(Math.min(...L.def.floors.map(f => f[0]))) + GULL.cruise;
}
function onCatwalk(x, y) {
  const r = floorRowAt(y);
  return r >= 0 && hasFloor(r, colOf(x));
}
function floorBelow(x, y) {
  // the first catwalk at or below y under x
  const rows = [...new Set(L.def.floors.map(f => f[0]))].sort((a, b) => a - b);
  for (const r of rows) if (rowY(r) >= y && hasFloor(r, colOf(x))) return rowY(r);
  return null;
}
function spawnGull(at) {
  const side = at && at.x != null ? (at.x < PW / 2 ? -1 : 1) : G.p.x < PW / 2 ? 1 : -1, // in from the side away from Buck
    k = gullSkill();
  G.enemies.push({
    type: 'gull',
    x: side < 0 ? -12 : PW + 12,
    y: cruiseY(),
    dx: side < 0 ? 1 : -1,
    dy: 0,
    acc: 0,
    speed: 0.7 + 0.35 * k,
    chase: 0,
    state: 'walk',
    t: 0,
    anim: 0,
    rideOff: 0,
    mode: 'fly',
    mt: Math.max(20, Math.round(GULL.cool * (1 - 0.45 * k))),
    gk: k,
    door: -1
  });
  SFX.squawk();
}
function updateGull(e) {
  const p = G.p,
    k = e.gk || 0;
  e.anim++;
  if (e.mode === 'fly') {
    // cruise along the top toward Buck, turning at the screen's edges
    if (e.mt > 0) e.mt--;
    const want = Math.sign(p.x - e.x);
    if (want && Math.abs(p.x - e.x) > 30 && e.mt < 40) e.dx = want;
    e.x += e.dx * e.speed;
    if (e.x < 8) e.dx = 1;
    if (e.x > PW - 8) e.dx = -1;
    e.y = cruiseY() + Math.sin(e.anim * 0.08) * 2;
    const ty = floorBelow(p.x, p.y);
    if (!e.mt && PLAYING() && ty != null && Math.abs(p.x - e.x) < GULL.sight + 50 * k + (ty - e.y) * 0.5) {
      e.mode = 'dive';
      e.tx = p.x;
      e.ty = ty;
      e.dx = Math.sign(p.x - e.x) || e.dx;
      SFX.squawk();
    }
    return;
  }
  if (e.mode === 'dive') {
    // straight at where Buck stood
    const vx = e.tx - e.x,
      vy = e.ty - e.y,
      d = Math.hypot(vx, vy),
      sp = GULL.dive + 0.7 * k;
    if (d <= sp) {
      e.x = Math.round(e.tx);
      e.y = e.ty;
      if (!onCatwalk(e.x, e.y)) {
        const below = floorBelow(e.x, e.y + 1);
        if (below == null) {
          e.mode = 'rise';
          return;
        }
        e.ty = below;
        return;
      }
      e.mode = 'land';
      e.mt = Math.round(softDown(GULL.land * (1 - 0.3 * k), 30, 42, 0.85, 8));
      e.x = Math.round(e.x);
      e.landT = 0;
      return;
    }
    e.x += (vx / d) * sp;
    e.y += (vy / d) * sp;
    return;
  }
  if (e.mode === 'land') {
    // strut along the catwalk toward Buck if he's on it, then take off
    if (--e.mt <= 0 || !onCatwalk(e.x, e.y)) {
      e.mode = 'rise';
      SFX.flap();
      return;
    }
    e.landT = (e.landT || 0) + 1;
    if (p.y === e.y) e.dx = Math.sign(p.x - e.x) || e.dx;
    e.moving = e.landT >= 10 && e.mt >= 14; // touch down, strut, crouch, go
    if (!e.moving) return;
    e.acc += 0.45 + 0.2 * k;
    const n = Math.floor(e.acc);
    e.acc -= n;
    for (let i = 0; i < n; i++) {
      if (!canStep(e, e.dx, 0)) {
        e.dx = -e.dx;
        break;
      }
      e.x += e.dx;
      e.dist = (e.dist || 0) + 1;
    }
    return;
  }
  if (e.mode === 'rise') {
    // a gentle climb, forward and up (Chris 2026-11-09: going straight up looked silly), turning at the screen's edges
    e.y -= 0.55;
    e.x += e.dx * 1.1;
    if (e.x < 8) e.dx = 1;
    if (e.x > PW - 8) e.dx = -1;
    if (e.y <= cruiseY()) {
      e.y = cruiseY();
      e.mode = 'fly';
      e.mt = Math.round(softDown(GULL.cool * (1 - 0.45 * k), 20, 50, 0.85, 6));
    }
  }
}
function gullFall(e) {
  // horned in the air: drop to the catwalk below and sit there dizzy
  if (onCatwalk(e.x, e.y)) {
    if (e.mode !== 'land') {
      e.mode = 'land';
      e.mt = GULL.land;
    }
    return;
  }
  const below = floorBelow(e.x, e.y);
  if (below == null) return;
  e.y = Math.min(below, e.y + 2.5);
  if (e.y === below) {
    e.mode = 'land';
    e.mt = GULL.land;
    e.x = Math.round(e.x);
  }
}
function GUARD(t) {
  return t === 'crab' || t === 'fork';
} // the catwalk guards: drop in, never climb, charge
function updateCrab(e) {
  const K = e.type === 'fork' ? FORK : CRAB,
    p = G.p,
    same = p.y === e.y && floorRowAt(p.y) >= 0,
    dir = Math.sign(p.x - e.x) || e.dx;
  if (e.mode === 'patrol') {
    if (same && Math.abs(p.x - e.x) < K.sight * (1 + 0.15 * heat()) && PLAYING()) {
      e.dx = dir;
      e.mode = 'wind';
      e.mt = Math.round(K.wind * softDown(1 - 0.1 * heat(), 0.5, 0.1, 0.92, 0.2)); // a shorter rev each overtime, easing off past half
      if (e.type === 'fork') SFX.rev();
      else SFX.stun();
      return;
    }
    e.acc += e.speed;
  } else if (e.mode === 'wind') {
    if (--e.mt <= 0) {
      e.mode = 'charge';
      e.from = e.x;
    }
    return;
  } else if (e.mode === 'charge') {
    e.acc += K.charge * softUp(Math.min(difficulty(), 1.7) * (1 + 0.15 * heat()), 2.3, 0.8); // faster each overtime (as before up to OT2), more slowly deep in it
    // a charge runs out after K.reach (Chris 2026-11-11: run the moment he revs and you can get away), and the Captain also stops once he's
    // well past you or you've left his catwalk
    if (Math.abs(e.x - e.from) >= K.reach || (e.type !== 'fork' && ((p.x - e.x) * e.dx < -28 || (!same && Math.abs(e.x - e.from) > 90)))) {
      e.mode = 'rest';
      e.mt = K.rest;
    }
  } else if (e.mode === 'rest') {
    if (--e.mt <= 0) e.mode = 'patrol';
    return;
  }
  const n = Math.floor(e.acc);
  e.acc -= n;
  for (let i = 0; i < n; i++) {
    if (!canStep(e, e.dx, 0)) {
      e.dx = -e.dx;
      if (e.mode === 'charge') {
        e.mode = 'rest';
        e.mt = K.rest;
        if (e.type === 'fork') SFX.clank(); // hits the end of the catwalk
      }
      break;
    }
    e.x += e.dx;
    e.dist = (e.dist || 0) + 1;
  }
}
