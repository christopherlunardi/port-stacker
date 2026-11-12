// Playtest bots (Chris 2026-11-08): bots that play real games of the built page, headless and much faster than real time, and report how
// the stages go (clears, times against par, deaths and what caused them, scores, combos...). Each decision looks ahead: it saves the
// game, tries each move for a second or so with the game's own rules, puts the game back, and picks the move that scores and progresses
// without getting caught.
//   node game/tools/probot.js PAGE.html TIER GAMES FIRSTSEED [MAXSTAGES] [STARTLOOP] > out.jsonl   (STARTLOOP 3: start in OVERTIME 1)
//   TIER: novice | good | expert   (how often it decides, how far it looks ahead, how often it fumbles)
// One JSON line per game.
const fs = require('fs'),
  vm = require('vm');
const [file, tier = 'good', nGames = '4', seed0 = '1', maxStages = '16', startLoop = '0'] = process.argv.slice(2); // startLoop: the shift to start in (3 = OVERTIME 1)
const html = fs.readFileSync(file, 'utf8');
const js = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
const mem = {},
  localStorage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => (mem[k] = String(v)), clear: () => {} };
const ctx = vm.createContext({ window: { __HEADLESS: true }, console, Math, JSON, Date, localStorage, structuredClone });
vm.runInContext(js, ctx, { filename: 'game.js' });
const TIERS = {
  // blind (Chris 2026-11-11: the tiers planned differently but all died about once a stage, unlike people): the chance that a decision
  // doesn't see the enemies at all (it plans as if they weren't a danger), so the tiers dodge as differently as real players do
  novice: { K: 16, H: 30, C: 8, eps: 0.06, hornCost: 60, blind: 0.3 },
  good: { K: 10, H: 45, C: 10, eps: 0.02, hornCost: 90, blind: 0.12 }, // a horn kept is worth 2,000 at the end of the stage now
  expert: { K: 6, H: 60, C: 10, eps: 0, hornCost: 100, blind: 0.04 },
  elite: { K: 4, H: 90, C: 12, eps: 0, hornCost: 100, blind: 0 } // (2026-11-09) thinks more often and further ahead, to see how deep into overtime good play gets
};
const brain = `
var BOT = (() => {
  const NONE = { held: {}, pressed: {} };
  const snap = () => ({ g: structuredClone(G), s: _seed, d: L.doorOpen ? L.doorOpen.slice() : null });
  const restore = S => { for (const k of Object.keys(G)) delete G[k]; Object.assign(G, structuredClone(S.g)); _seed = S.s; if (S.d) L.doorOpen = S.d.slice(); };
  const key = (x, y) => x * 4096 + y;
  const onFloor = (x, y) => { const r = floorRowAt(y); return r >= 0 && hasFloor(r, colOf(x)); };
  function nbrs(x, y) {
    const out = [];
    if (onFloor(x, y)) for (const dx of [-8, 8]) if (onFloor(x + dx, y)) out.push([x + dx, y]);
    for (const l of L.ladders) if (l.x === x && y >= l.top && y <= l.bot) { if (y - 8 >= l.top) out.push([x, y - 8]); if (y + 8 <= l.bot) out.push([x, y + 8]); }
    return out;
  }
  function starts() {
    const p = G.p;
    if ((p.y - FY) % 8 !== 0) { const up = FY + Math.floor((p.y - FY) / 8) * 8; return [[p.x, up], [p.x, up + 8]]; }
    return [[Math.floor(p.x / 8) * 8 + 4, p.y]];
  }
  // a BFS from Buck over the catwalk/ladder grid: distance to every node, and the first step toward each
  function bfs() {
    const dist = new Map(), first = new Map(), q = [];
    for (const s of starts()) { const k = key(s[0], s[1]); dist.set(k, 0); first.set(k, s); q.push(s); }
    for (let i = 0; i < q.length; i++) {
      const [x, y] = q[i], k = key(x, y), d = dist.get(k);
      for (const n of nbrs(x, y)) { const nk = key(n[0], n[1]); if (dist.has(nk)) continue; dist.set(nk, d + 1); first.set(nk, d === 0 ? n : first.get(k)); q.push(n); }
    }
    return { dist, first };
  }
  const panels = pc => { const sw = (PIECE_W * T) / PANELS, out = []; pc.segs.forEach((s, i) => { if (!s) out.push([Math.floor((pc.x + i * sw + sw / 2) / 8) * 8 + 4, pc.y]); }); return out; };
  // where to go: the scorer weighs enemies on the container (riders) and under it (squashes) against the walk
  function pickGoal(B, mode) {
    let best = null, bv = 1e9;
    for (const pc of G.pieces) {
      if (pc.state !== 'rest') continue;
      let d = 1e9, at = null;
      for (const t of panels(pc)) { const v = B.dist.get(key(t[0], t[1])); if (v != null && v < d) { d = v; at = t; } }
      if (!at) continue;
      let bonus = 0;
      if (mode === 'scorer') {
        const x0 = pc.x - 2, x1 = pc.x + PIECE_W * T + 2;
        for (const e of G.enemies) {
          if (e.state !== 'walk' && e.state !== 'stun') continue;
          if (e.x < x0 || e.x > x1) continue;
          if (e.y === pc.y) bonus += 10; else if (e.y > pc.y && e.y <= pc.y + 90) bonus += 5;
        }
      }
      const v = d - bonus * 3;
      if (v < bv) { bv = v; best = at; }
    }
    return best;
  }
  function navInput(goal, B) {
    const p = G.p;
    if (!goal) return NONE;
    B = B || bfs();
    const step = B.first.get(key(goal[0], goal[1]));
    const held = {};
    if (!step) return NONE;
    let [nx, ny] = step;
    if (nx === Math.floor(p.x / 8) * 8 + 4 && ny === p.y && (nx !== goal[0] || ny !== goal[1])) return NONE;
    if (ny !== p.y && Math.abs(nx - p.x) < 1) held[ny < p.y ? 'up' : 'down'] = true;
    else if (nx !== p.x) held[nx < p.x ? 'left' : 'right'] = true;
    else if (ny !== p.y) held[ny < p.y ? 'up' : 'down'] = true;
    else held[p.x % 8 < 4 ? 'right' : 'left'] = true;
    return { held, pressed: {} };
  }
  const lit = () => G.pieces.reduce((a, pc) => a + (pc.state === 'rest' ? pc.segs.filter(Boolean).length : 4), 0);
  const CANDS = ['nav', 'left', 'right', 'up', 'down', 'stay', 'horn', 'hornUp', 'hornDown', 'dash'];
  function candInput(c, navIn, f) {
    const held = Object.assign({}, navIn.held), pressed = {};
    if (c === 'left' || c === 'right' || c === 'up' || c === 'down') return { held: { [c]: true }, pressed: {} };
    if (c === 'stay') return NONE;
    if (c === 'horn' && f === 0) pressed.a = true;
    if (c === 'hornUp') { if (f === 0) pressed.a = true; return { held: { up: true }, pressed }; }
    if (c === 'hornDown') { if (f === 0) pressed.a = true; return { held: { down: true }, pressed }; }
    if (c === 'dash' && f === 0) pressed.b = true;
    return { held, pressed };
  }
  // try one candidate: C frames of it, then follow the route, H frames in all; the value of where that leaves us
  function trial(S, c, cfg, mode, blind) {
    restore(S);
    const s0 = G.score, l0 = lit(), h0 = G.p.horns;
    let goal = null, B = null, navIn = NONE;
    for (let f = 0; f < cfg.H; f++) {
      if (f % 4 === 0) { B = bfs(); goal = pickGoal(B, mode); navIn = navInput(goal, B); }
      update(f < cfg.C ? candInput(c, navIn, f) : navIn);
      if (G.state === 'dying' || G.state === 'over') { if (blind) break; return -1e6 + f * 1000; }
      if (G.state !== 'play') break;
    }
    B = bfs(); goal = pickGoal(B, mode);
    const d = goal ? B.dist.get(key(goal[0], goal[1])) : 0;
    let danger = 0; // how close the nearest walking enemy ends up
    if (!blind) for (const e of G.enemies) if (e.state === 'walk') { const dd = Math.abs(e.x - G.p.x) + Math.abs(e.y - G.p.y) * 1.2; if (dd < 40) danger += (40 - dd); }
    return (G.score - s0) * (mode === 'scorer' ? 0.05 : 0.01) + (lit() - l0) * 30 - (d || 0) * 1.5 - (h0 - G.p.horns) * cfg.hornCost - danger * 0.6;
  }
  function decide(cfg, mode) {
    const S = snap();
    let best = 'nav', bv = -1e9;
    const vals = {}, blind = cfg.blind && rand2() < cfg.blind;
    for (const c of CANDS) { const v = trial(S, c, cfg, mode, blind); vals[c] = v; if (v > bv) { bv = v; best = c; } }
    restore(S);
    if (cfg.eps && rand2() < cfg.eps) best = CANDS[Math.floor(rand2() * CANDS.length)];
    return best;
  }
  // ---- the record (Chris 2026-11-11: "record absolutely everything"): every real event of every stage, in order, with the stage clock
  // (frames). Only the real game is logged, never the look-ahead trials (REC.live is on only around the real update() calls).
  //   score  {label, base, pts, mult, combo}   every score popup (landings, knock-ons, riders, squashes, close calls, bonuses...)
  //   fall   {col, row, by: walk|chain, riders}   a container starts falling
  //   chain  {n}   a knock-on (1 = DOUBLE KNOCK ...)        horn {x, y, aim, left}   dash {x, y}        stun {type}
  //   spawn  {type}        rush {}        life {lives}        comboEnd {n}        death {x, y, by, near: [[type, dx, dy]...], horns, combo}
  // and path: Buck's [x, y] every half second.
  const REC = { live: false, ev: null, path: null };
  const clock = () => (G.st ? G.st.f : 0);
  const log = (k, o) => { if (REC.live && REC.ev) REC.ev.push(Object.assign({ t: clock(), k }, o || {})); };
  addScore = (o => function (n, x, y, label) { const l0 = G.lives, pts = o.apply(this, arguments); log('score', { label: label || '', base: n, pts, mult: n ? Math.round(pts / n) : 1, combo: G.combo }); if (G.lives > l0) log('life', { lives: G.lives }); return pts; })(addScore);
  chainBonus = (o => function (pc) { if (pc.chain) log('chain', { n: pc.chain }); return o.apply(this, arguments); })(chainBonus);
  startFall = (o => function (pc, from) { const r = o.apply(this, arguments); log('fall', { col: pc.c, row: pc.row, by: from ? 'chain' : 'walk', riders: (pc.riders || []).length }); return r; })(startFall);
  blowHorn = (o => function (p, v) { const h0 = p.horns, r = o.apply(this, arguments); if (p.horns < h0) log('horn', { x: Math.round(p.x), y: p.y, aim: v ? (v < 0 ? 'up' : 'down') : p.face < 0 ? 'left' : 'right', left: p.horns }); return r; })(blowHorn);
  goldStart = (o => function () { log('rush'); return o.apply(this, arguments); })(goldStart);
  spawnEnemy = (o => function (type) { log('spawn', { type }); return o.apply(this, arguments); })(spawnEnemy);
  updateClouds = (o => function () { const was = G.enemies.map(e => e.state); const r = o.apply(this, arguments); G.enemies.forEach((e, i) => { if (e.state === 'stun' && was[i] !== 'stun') log('stun', { type: e.type }); }); return r; })(updateClouds);
  updatePlayer = (o => function () { const d0 = G.p.dash; const r = o.apply(this, arguments); if (!d0 && G.p.dash > 0) log('dash', { x: Math.round(G.p.x), y: G.p.y }); return r; })(updatePlayer);
  let lastCombo = 0;
  function realUpdate(inp) {
    REC.live = true;
    update(inp);
    REC.live = false;
    if (lastCombo > 1 && G.combo === 0 && REC.ev) REC.ev.push({ t: clock(), k: 'comboEnd', n: lastCombo });
    lastCombo = G.combo;
    if (REC.path && G.p && G.state === 'play' && clock() % 30 === 0) REC.path.push([Math.round(G.p.x), G.p.y]);
  }
  let r2 = 1; const rand2 = () => ((r2 = (r2 * 16807) % 2147483647) / 2147483647);
  function playGame(cfg, seedN, maxStages, mode, startLoop) {
    r2 = seedN * 7919 + 1;
    seed(seedN);
    G.state = 'title';
    newGame();
    if (startLoop) { G.loop = startLoop; startLevel(0); }
    const stages = [];
    let cur = null, plan = 'nav', planLeft = 0, frames = 0, lastLit = 0, lastLitF = 0;
    const startStage = () => { const c = { label: stageId(), name: L.def.name, deaths: 0, killers: {}, lives0: G.lives, earned: 0, ev: [], path: [] }; REC.ev = c.ev; REC.path = c.path; return c; };
    cur = startStage();
    let livesSeen = G.lives;
    while (frames < 60 * 60 * 90) {
      frames++;
      const st = G.state;
      if (st === 'over') { cur.cleared = false; cur.f = G.st.f; cur.earned = G.lives - cur.lives0 + cur.deaths; stages.push(cur); break; }
      if (st === 'clear') {
        if (!cur.done) {
          cur.done = true; cur.cleared = true;
          Object.assign(cur, { f: G.st.f, total: G.st.total, delta: G.st.delta, left: G.st.left, combo: G.st.combo, riders: G.st.riders, squash: G.st.squash, drop: G.st.drop, horns: G.st.horns, hornsLeft: G.st.hornsLeft, hornBonus: G.st.hornBonus, close: G.st.close || 0, cleanBonus: G.st.cleanBonus || 0, kn: G.st.kn || null });
        }
        realUpdate(G.t > 400 ? { held: {}, pressed: { a: true } } : NONE);
        if (G.state === 'intro') { cur.counts = cur.ev.reduce((a, e) => ((a[e.k] = (a[e.k] || 0) + 1), a), {}); cur.earned = G.lives - cur.lives0 + cur.deaths; stages.push(cur); if (stages.length >= maxStages) break; cur = startStage(); livesSeen = G.lives; lastLitF = frames; }
        continue;
      }
      if (st !== 'play') { realUpdate(NONE); if (G.state === 'dying' && st === 'play') {} continue; }
      const l = lit();
      if (l !== lastLit) { lastLit = l; lastLitF = frames; }
      if (frames - lastLitF > 60 * 90) { cur.stuck = true; cur.f = G.st.f; stages.push(cur); break; } // no progress in 90 s: stuck
      if (planLeft <= 0) { plan = decide(cfg, mode); planLeft = cfg.K; }
      const B = bfs(), navIn = navInput(pickGoal(B, mode), B);
      const inp = candInput(plan, navIn, cfg.K - planLeft);
      planLeft--;
      realUpdate(inp);
      if (G.state === 'dying') {
        cur.deaths++; const by = G.killedBy || '?'; cur.killers[by] = (cur.killers[by] || 0) + 1; planLeft = 0;
        cur.ev.push({ t: clock(), k: 'death', x: Math.round(G.p.x), y: G.p.y, by, horns: G.p.horns, combo: G.combo, near: G.enemies.filter(e => Math.abs(e.x - G.p.x) < 64 && Math.abs(e.y - G.p.y) < 48).map(e => [e.type, Math.round(e.x - G.p.x), Math.round(e.y - G.p.y), e.state]) });
      }
    }
    return { seed: seedN, score: G.score, reached: stages.length ? stages[stages.length - 1].label : '1-1', stages, livesLeft: G.lives };
  }
  return { playGame };
})();
`;
vm.runInContext(brain, ctx);
const cfg = TIERS[tier];
const mode = tier === 'novice' ? 'survivor' : 'scorer';
for (let i = 0; i < +nGames; i++) {
  const t0 = Date.now();
  const r = vm.runInContext(`BOT.playGame(${JSON.stringify(cfg)}, ${+seed0 + i}, ${+maxStages}, '${mode}', ${+startLoop})`, ctx);
  r.tier = tier;
  r.secs = Math.round((Date.now() - t0) / 1000);
  console.log(JSON.stringify(r));
}
