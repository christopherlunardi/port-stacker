// Checks the rider and squash pips (Chris 2026-11-11: "make sure they're accurate"): plays random games of the built page, and at random
// moments drops a random resting container (as if Buck had just finished walking it), lets the drop play out with no input, and compares
// the pips' counts at that moment (wouldRide; enemiesUnder, which since build 212 is simply who's below it, Chris's call) with the riders it
// really carried and the enemies it (and its knock-ons) squashed.
//   node game/tools/pipcheck.js PAGE.html [trials] [seed]
const fs = require('fs'),
  vm = require('vm');
const [file, nTrials = '400', seed0 = '1'] = process.argv.slice(2);
const html = fs.readFileSync(file, 'utf8');
const js = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
const mem = {},
  localStorage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => (mem[k] = String(v)), clear: () => {} };
const ctx = vm.createContext({ window: { __HEADLESS: true }, console, Math, JSON, Date, localStorage, structuredClone });
vm.runInContext(js, ctx, { filename: 'game.js' });
const out = vm.runInContext(
  `(() => {
  const snap = () => ({ g: structuredClone(G), s: _seed, d: L.doorOpen ? L.doorOpen.slice() : null });
  const restore = S => { for (const k of Object.keys(G)) delete G[k]; Object.assign(G, structuredClone(S.g)); _seed = S.s; if (S.d) L.doorOpen = S.d.slice(); };
  const res = { trials: 0, rideOk: 0, squashOk: 0, rideBad: [], squashBad: [], withSquash: 0 };
  let rnd = ${+seed0} * 9301 + 49297;
  const R = () => ((rnd = (rnd * 9301 + 49297) % 233280) / 233280);
  for (let game = 0; res.trials < ${+nTrials} && game < 400; game++) {
    seed(${+seed0} + game);
    newGame(); G.state = 'play'; G.p.inv = 1e9; // Buck can't die, so the games keep going
    if (R() < 0.6) startLevel(Math.floor(R() * 5));
    G.p.inv = 1e9;
    let held = {};
    for (let f = 0; f < 3600 && res.trials < ${+nTrials}; f++) {
      if (f % 20 === 0) held = { [['left', 'right', 'up', 'down'][Math.floor(R() * 4)]]: true };
      update({ held, pressed: R() < 0.01 ? { a: true } : {} });
      if (G.state !== 'play') { G.state = 'play'; }
      if (f % 15 || G.pieces.some(p => p.state === 'fall')) continue;
      const rest = G.pieces.filter(p => p.state === 'rest' && !p.gold);
      // prefer containers that have someone on or under them, so the test spends its time where the pips matter
      const live = rest.filter(pc => G.enemies.some(e => wouldRide(e, pc)) || enemiesUnder(pc) > 0 || G.enemies.some(e => Math.abs(e.x - pc.x - 32) < 50 && e.y > pc.y));
      const pool = live.length && R() < 0.85 ? live : rest;
      if (!pool.length) continue;
      const S = snap();
      const pc = pool[Math.floor(R() * pool.length)], i = G.pieces.indexOf(pc);
      let r = 0; for (const e of G.enemies) if (wouldRide(e, pc)) r++;
      const s = enemiesUnder(pc), sq0 = G.st.squash, drop = G.dropN + 1;
      const at0 = new Map(G.enemies.map(e => [e, { x: e.x, y: e.y, st: e.state, f: G.frame }]));
      const killed = [], _k = killEnemy;
      killEnemy = e => { if (G.dropNow) killed.push({ was: at0.get(e), now: { x: e.x, y: e.y, st: e.state, f: G.frame }, by: G.pieces.filter(q => q.drop === G.dropNow).map(q => q === pc ? 'it' : 'knock') }); return _k(e); };
      startFall(pc);
      const realR = pc.riders.length;
      for (let k = 0; k < 600 && G.pieces.some(p => p.state === 'fall'); k++) update({ held: {}, pressed: {} });
      const realS = G.st.squash - sq0; killEnemy = _k;
      res.trials++;
      if (s) res.withSquash++;
      if (realR === r) res.rideOk++; else res.rideBad.push({ stage: G.level, row: S.g.pieces[i].row, c: S.g.pieces[i].c, pips: r, real: realR });
      if (realS === s) res.squashOk++; else res.squashBad.push({ stage: S.g.level, row: S.g.pieces[i].row, c: S.g.pieces[i].c, x: S.g.pieces[i].x, y: S.g.pieces[i].y, riders: r, pips: s, real: realS, killed: killed.filter(k => !k.was || k.was.st !== 'ride') });
      restore(S);
    }
  }
  return res;
})()`,
  ctx
);
console.log(`trials ${out.trials} (${out.withSquash} with blue pips)  riders right ${out.rideOk}  squashes right ${out.squashOk}`);
const tally = a => { const m = {}; for (const b of a) { const k = 'pips ' + b.pips + ' real ' + b.real; m[k] = (m[k] || 0) + 1; } return m; };
console.log('rider misses', JSON.stringify(tally(out.rideBad)));
console.log('squash misses', JSON.stringify(tally(out.squashBad)));
console.log(JSON.stringify(out.squashBad.slice(0, 12)));
