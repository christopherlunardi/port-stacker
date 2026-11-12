// Fast tests (seconds): runs the built game with no page and checks it.
//   node game/tools/fasttest.js game/stack-style.html [scenario...]
// scenarios: levels (every stage's lists make sense), bot (a bot walks every stage clean with enemies off), soak (random play with
// enemies, invincible, checking nothing breaks), death (getting caught costs a life and the game comes back; game over returns to title),
// text (no popup or menu line says undefined/NaN). Default: all.
const fs = require('fs'), vm = require('vm');
const file = process.argv[2] || 'game/stack-style.html'; const want = process.argv.slice(3);
const html = fs.readFileSync(file, 'utf8');
const js = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
const mem = {}; const localStorage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, clear: () => { for (const k in mem) delete mem[k]; } }; // stand-in browser storage
const ctx = vm.createContext({ window: { __HEADLESS: true }, console, Math, JSON, Date, localStorage });
vm.runInContext(js, ctx, { filename: 'game.js' });
const R = s => vm.runInContext(s, ctx);
const NONE = { held: {}, pressed: {} };
let fails = 0; const fail = (m) => { fails++; console.log('  FAIL', m); };
const ok = (c, m) => { if (!c) fail(m); };
function step(inp) { R('update')(inp || NONE); }

function levels() {
  const LEVELS = R('LEVELS'), PIECE_W = R('PIECE_W');
  LEVELS.forEach((def, li) => {
    const tag = 'stage ' + (li + 1) + ': ';
    // (Chris 2026-11-08: two ladders side by side on Pier 9) no two ladders within 3 columns of each other where their rows overlap
    def.ladders.forEach((l1, i) => def.ladders.forEach((l2, j) => { if (j > i && Math.abs(l1[0] - l2[0]) <= 3 && l1[1] < l2[2] && l2[1] < l1[2]) fail(tag + `ladders at cols ${l1[0]} and ${l2[0]} are side by side`); }));
    R('(d => { L = buildLevel(d); })')(def);
    const has = (r, c) => R('hasFloor')(r, c);
    for (const [t, c, r] of def.pieces) {
      ok(R('PIECEDEF')[t], tag + 'unknown piece ' + t);
      for (let k = 0; k < PIECE_W; k++) ok(has(r, c + k), tag + `piece ${t}@${c},${r} not on a floor at col ${c + k}`);
      ok(def.plates.includes(c), tag + `no plate under the ${t} at column ${c}`);
    }
    for (const c of def.plates) ok(def.pieces.some(p => p[1] === c), tag + 'empty plate at ' + c);
    for (const [c, t, b] of def.ladders) {
      ok(t < b, tag + `ladder ${c} upside down`); ok(has(t, c) && has(b, c), tag + `ladder ${c} ${t}-${b} doesn't end on floors`);
      for (const [pt, pc, pr] of def.pieces) if (pr > t && pr < b && c >= pc && c < pc + PIECE_W) fail(tag + `ladder ${c} runs through the ${pt} at ${pc},${pr}`);
    }
    ok(has(def.start[1], def.start[0]), tag + 'start not on a floor');
    for (const [c, r] of def.spawns) ok(has(r, c), tag + `spawn ${c},${r} not on a floor`);
    // every floor tile reachable from the start
    const seen = new Set(), q = [[def.start[0], def.start[1]]]; const key = (c, r) => c + ',' + r;
    const lad = def.ladders;
    while (q.length) { const [c, r] = q.pop(); const k = key(c, r); if (seen.has(k)) continue; seen.add(k);
      for (const dc of [-1, 1]) if (has(r, c + dc)) q.push([c + dc, r]);
      for (const [lc, t, b] of lad) if (lc === c && r >= t && r <= b) for (let rr = t; rr <= b; rr++) if (has(rr, c)) q.push([c, rr]); }
    for (const [r, a, b] of def.floors) for (let c = a; c <= b; c++) if (!seen.has(key(c, r))) { fail(tag + `floor ${r} col ${c} can't be reached`); break; }
  });
}
// a bot that walks the real movement code: BFS over tile-centre nodes, steer toward the next one
function botInput() {
  const st = R('({p:{x:G.p.x,y:G.p.y}, pieces:G.pieces.map(p=>({x:p.x,y:p.y,state:p.state,segs:p.segs.slice()})), floor:L.floor, lad:L.ladders.map(l=>({x:l.x,top:l.top,bot:l.bot}))})');
  const FY = R('FY'), T = R('T'); const p = st.p;
  const targets = []; for (const pc of st.pieces) if (pc.state === 'rest') { const sw = 64 / pc.segs.length; pc.segs.forEach((s, i) => { if (!s) targets.push([pc.x + i * sw + 4, pc.y]); }); }
  if (!targets.length) return NONE;
  const nodeKey = (x, y) => x + ',' + y;
  const isFloor = (x, y) => (y - FY) % T === 0 && st.floor[(y - FY) / T] && st.floor[(y - FY) / T][Math.floor(x / T)] === 1;
  const nbrs = (x, y) => { const out = [];
    if (isFloor(x, y)) for (const dx of [-8, 8]) if (isFloor(x + dx, y)) out.push([x + dx, y]);
    for (const l of st.lad) if (l.x === x && y >= l.top && y <= l.bot) { if (y - 8 >= l.top) out.push([x, y - 8]); if (y + 8 <= l.bot) out.push([x, y + 8]); }
    return out; };
  let starts = [[Math.floor(p.x / 8) * 8 + 4, p.y]];
  if ((p.y - FY) % 8 !== 0) { const up = FY + Math.floor((p.y - FY) / 8) * 8, dn = up + 8; starts = (p.y - up <= dn - p.y) ? [[p.x, up], [p.x, dn]] : [[p.x, dn], [p.x, up]]; } // part way up a ladder: the nearer end first
  const tset = new Set(targets.map(t => nodeKey(t[0], t[1])));
  const prev = new Map(starts.map(s => [nodeKey(s[0], s[1]), null])); const q = starts.slice(); let goal = null;
  while (q.length) { const [x, y] = q.shift(); if (tset.has(nodeKey(x, y))) { goal = [x, y]; break; } for (const n of nbrs(x, y)) { const k = nodeKey(n[0], n[1]); if (!prev.has(k)) { prev.set(k, [x, y]); q.push(n); } } }
  if (!goal) return null;
  let cur = goal, path = [goal]; while (true) { const pv = prev.get(nodeKey(cur[0], cur[1])); if (!pv) break; path.unshift(pv); cur = pv; }
  let next = path.length > 1 ? path[1] : path[0];
  if (p.y !== path[0][1]) next = path[0]; // part way up a ladder: finish reaching the floor first
  const held = {};
  if (next[1] !== p.y && next[0] === p.x) held[next[1] < p.y ? 'up' : 'down'] = true;
  else if (next[0] !== p.x) held[next[0] < p.x ? 'left' : 'right'] = true;
  else if (next[1] !== p.y) held[next[1] < p.y ? 'up' : 'down'] = true;
  else { // standing on the target node: nudge across it
    held[p.x % 8 < 4 ? 'right' : 'left'] = true; }
  return { held, pressed: {} };
}
function bot() {
  const n = R('LEVELS.length');
  for (let li = 0; li < n; li++) {
    R('DEV.noEnemies = true; DEV.inv = true; newGame(); startLevel(' + li + '); G.state = "play"');
    let f = 0, stuck = 0;
    for (; f < 60 * 60 * 5; f++) {
      const st = R('G.state'); if (st === 'clear') break;
      if (st !== 'play') { step(); continue; }
      const inp = botInput(); if (!inp) { fail('stage ' + (li + 1) + ': bot found no way to the next piece'); break; }
      step(inp);
    }
    const done = R('G.pieces.filter(p=>p.state==="plate").length'), all = R('G.pieces.length');
    ok(R('G.state') === 'clear', `stage ${li + 1}: bot didn't clear it (${done}/${all} pieces plated, ${f} frames)`);
    const stacks = R('JSON.stringify(G.stackN)'), tot = R('JSON.stringify(G.colTotal)'); ok(stacks === tot, `stage ${li + 1}: plates ${stacks} vs pieces ${tot}`);
    console.log(`  stage ${li + 1}: bot cleared in ${(f / 60).toFixed(1)}s`);
  }
  R('DEV.noEnemies = false; DEV.inv = false');
}
function sane(tag) {
  const bad = R(`(() => { const out = [];
    const chk = (o, n) => { for (const k of ['x','y']) if (!Number.isFinite(o[k])) out.push(n + ' ' + k + '=' + o[k]); if (o.x < -20 || o.x > PW + 20 || o.y < 0 || o.y > PH + 20) out.push(n + ' off the stage at ' + o.x + ',' + o.y); };
    if (G.p) chk(G.p, 'buck'); G.enemies.forEach((e, i) => chk(e, e.type + i)); G.pieces.forEach((p, i) => chk(p, 'piece' + i));
    if (G.enemies.length + G.spawnQ.length > L.def.enemies.length) out.push('too many enemies: ' + G.enemies.length + '+' + G.spawnQ.length);
    for (const p of G.pops) if (/undefined|NaN|null|\\[object/.test(p.text)) out.push('BADTEXT ' + p.text);
    return out; })()`);
  for (const b of bad) fail(tag + ': ' + b);
  return bad.length;
}
function soak() {
  const n = R('LEVELS.length'); R('seed(42)');
  const names = ['up', 'down', 'left', 'right'];
  for (let li = 0; li < n; li++) {
    R('DEV.inv = true; newGame(); startLevel(' + li + '); G.state = "play"');
    let held = {}, plated = 0;
    for (let f = 0; f < 60 * 300; f++) {
      if (f % 23 === 0) { held = {}; held[names[(f * 7 + li) % 4]] = true; if (f % 69 === 0) held[names[(f * 3) % 4]] = true; }
      const pressed = {}; if (f % 97 === 0) pressed.a = true; if (f % 131 === 0) pressed.b = true;
      try { step({ held, pressed }); } catch (e) { fail(`stage ${li + 1} soak threw at frame ${f}: ${e.stack.split('\n').slice(0, 3).join(' | ')}`); break; }
      if (R('G.state') !== 'play' && R('G.state') !== 'clear') R('G.state = "play"');
      if (R('G.state') === 'clear') break;
      if (f % 300 === 0 && sane(`stage ${li + 1} f${f}`)) break;
    }
    plated = R('G.pieces.filter(p=>p.state==="plate").length');
    console.log(`  stage ${li + 1}: 5 min of random play, ${plated} pieces plated, enemies ${R('G.enemies.length')}`);
  }
  R('DEV.inv = false');
}
function death() {
  R('seed(7); DEV.inv = false; DEV.noEnemies = false; newGame(); G.state = "play"');
  let lives0 = R('G.lives'), died = false;
  for (let f = 0; f < 60 * 120; f++) { step(); if (R('G.state') === 'dying') { died = true; break; } }
  ok(died, 'death: standing still for 2 minutes, nobody caught Buck');
  for (let f = 0; f < 200; f++) step();
  ok(R('G.lives') === lives0 - 1 && R('G.state') === 'play', 'death: after getting caught: lives ' + R('G.lives') + ', state ' + R('G.state'));
  R('G.lives = 0'); for (let f = 0; f < 60 * 120 && R('G.state') !== 'over'; f++) step();
  ok(R('G.state') === 'over', 'death: last life lost but no game over (' + R('G.state') + ')');
  for (let f = 0; f < 400 && R('G.state') === 'over'; f++) step(f === 120 ? { held: {}, pressed: { a: true } } : undefined); // the game-over card waits for a press if (R('G.state') === 'initials') for (let k = 0; k < 3; k++) step({ held: {}, pressed: { a: true } });
  for (let f = 0; f < 600 && R('G.state') !== 'title'; f++) step(R('G.state') === 'board' && f % 30 === 29 ? { held: {}, pressed: { a: true } } : undefined); // the board waits for a press
  ok(R('G.state') === 'title', 'death: game over never went back to the title (' + R('G.state') + ')');
}
function text() {
  R('newGame(); G.state = "pause"; DEV.on = true');
  const lines = R('pauseItems().map(i => i[0])'); for (const l of lines) if (/undefined|NaN|null|\[object/.test(l)) fail('BADTEXT menu: ' + l);
  for (let i = 0; i < lines.length; i++) { const lab = lines[i]; if (/QUIT|RESTART|NEXT STAGE|CLEAR/.test(lab)) continue; R('G.state="pause"; G.menu=' + i); step({ held: {}, pressed: { a: true } }); }
  R('DEV.on = false');
}
function ladders() { // getting on a ladder from a little off-centre, and off it from a little short of the catwalk
  // (Chris 2026-11-09, 3-5) a ladder carrying on from another one a column or two off looks like a mistake: line them up or set them well apart
  const near = R(`LEVELS.flatMap(d => d.ladders.flatMap((a, i) => d.ladders.slice(i + 1).filter(b => { const dc = Math.abs(a[0] - b[0]); return dc > 0 && dc <= 2 && (a[2] === b[1] || b[2] === a[1]); }).map(b => d.name + ' ' + a + ' / ' + b)))`);
  ok(!near.length, 'ladders: ladders that carry on a column or two off: ' + near.join('; '));
  R('DEV.noEnemies = true; DEV.inv = true; newGame(); G.state = "play"');
  const l = R('L.ladders.find(l => l.bot === rowY(19) && l.top === rowY(4))'); ok(l, 'ladders: no full-height ladder to test');
  for (const off of [-10, -6, 6, 10]) {
    R(`G.p.x = ${l.x + off}; G.p.y = rowY(19); G.p.climb = false; G.p.acc = 0`);
    for (let f = 0; f < 30; f++) step({ held: { up: true }, pressed: f ? {} : { up: true } });
    ok(R('G.p.x') === l.x && R('G.p.y') < R('rowY(19)'), `ladders: pressing up ${off}px from the ladder didn't climb (at ${R('G.p.x')},${R('G.p.y')})`);
  }
  for (const short of [4, 9]) {
    R(`G.p.x = ${l.x}; G.p.y = rowY(14) + ${short}; G.p.climb = true; G.p.acc = 0`);
    for (let f = 0; f < 40; f++) step({ held: { right: true }, pressed: f ? {} : { right: true } });
    ok(R('G.p.y') === R('rowY(14)') && R('G.p.x') > l.x, `ladders: stepping off ${short}px below the catwalk failed (at ${R('G.p.x')},${R('G.p.y')})`);
  }
  R('DEV.noEnemies = false; DEV.inv = false');
}
function crab() { // the crab guards its catwalk: worker on the same catwalk -> wind-up, then a fast charge, then a rest; never climbs
  R('seed(5); DEV.noEnemies = true; DEV.inv = true; newGame(); G.state = "play"; G.spawnQ = []; G.p.x = 200; G.p.y = rowY(9)');
  R(`G.enemies = [{ type: 'crab', x: 60, y: rowY(9), dx: 1, dy: 0, acc: 0, speed: 0.45, chase: 0, state: 'walk', t: 0, anim: 0, rideOff: 0, mode: 'patrol', mt: 0 }]`);
  const modes = new Set(); let maxStep = 0, last = 60, ys = new Set();
  for (let f = 0; f < 240; f++) { step(); const e = R('G.enemies[0]'); modes.add(e.mode); maxStep = Math.max(maxStep, Math.abs(e.x - last)); last = e.x; ys.add(e.y); }
  ok(modes.has('wind') && modes.has('charge') && modes.has('rest'), 'crab: never went wind -> charge -> rest (' + [...modes] + ')');
  ok(maxStep >= 2, 'crab: the charge was no faster than walking'); ok(ys.size === 1, 'crab: it left its catwalk');
  // (Chris 2026-11-09) frozen mid-charge, it wakes up like it just arrived: patrolling, not still charging
  R("G.enemies[0].mode = 'charge'; G.enemies[0].x = G.p.x - 20; G.enemies[0].y = G.p.y; G.enemies[0].state = 'walk'; G.clouds = []; G.p.face = -1; G.p.horns = 5; blowHorn(G.p, 0)");
  for (let f = 0; f < 3; f++) step();
  ok(R('G.enemies[0].state') === 'stun' && R('G.enemies[0].mode') === 'patrol', 'crab: frozen mid-charge it should drop the charge (' + R('G.enemies[0].state') + ' ' + R('G.enemies[0].mode') + ')');
  R('G.enemies = []; DEV.noEnemies = false; DEV.inv = false');
}
function attract() { // the title's demos (2026-11-10): each one plays the real game by itself, scores, never touches the board or lives for real,
  // goes on to the high scores and back to the title; a press during a demo goes straight back
  R('try { localStorage.clear(); } catch (e) {}; store.set("board", [{ n: "AAA", s: 500, st: 1 }])');
  const n = R('DEMOS.length');
  for (let i = 0; i < n; i++) {
    R('G.state = "title"; G.introDone = true; G.t = TI.loop; attractStart()');
    const lab = 'attract ' + (i + 1) + ' (' + R('G.attract.d.loop') + '-' + (R('G.attract.d.level') + 1) + ')';
    let f = 0, moved = 0, x0 = R('G.p.x'), y0 = R('G.p.y'), maxScore = 0;
    for (; f < 60 * 45 && R('G.attract && G.attract.phase') === 'demo'; f++) {
      step();
      if (R('G.p') && (R('G.p.x') !== x0 || R('G.p.y') !== y0)) moved++;
      maxScore = Math.max(maxScore, R('G.score'));
    }
    ok(moved > 60, lab + ': the bot hardly moved (' + moved + ' frames)');
    ok(maxScore > 0, lab + ': the demo scored nothing');
    ok(R('G.state') === 'board', lab + ': after the demo it went to ' + R('G.state') + ', not the high scores');
    for (let k = 0; k < 60 * 12 && R('G.attract') ; k++) step();
    ok(R('G.state') === 'title' && !R('G.attract'), lab + ': the high scores didn\'t go back to the title');
    ok(R('board().length') === 1, lab + ': a demo changed the high scores');
    console.log(`  ${lab}: ${(f / 60).toFixed(1)}s, best score ${maxScore}`);
  }
  R('G.state = "title"; G.introDone = true; G.t = TI.loop; attractStart()');
  for (let f = 0; f < 120; f++) step();
  step({ held: {}, pressed: { a: true } });
  ok(R('G.state') === 'title' && !R('G.attract'), 'attract: pressing A during a demo didn\'t go back to the title');
  R('G.state = "title"; G.t = 0; G.introDone = false; G.idleFrom = null');
}
function leaderboard() { // game over with a top score -> enter initials -> it's on the board, sorted, with the stage reached
  R('try { localStorage.clear(); } catch (e) {}; store.set("board", [{ n: "AAA", s: 500, st: 1 }])');
  R('newGame(); G.state = "play"; G.score = 4321; G.lives = 0; G.state = "dying"; G.t = 200');
  for (let f = 0; f < 5; f++) step();
  for (let f = 0; f < 70; f++) step(); step({ held: {}, pressed: { a: true } });
  ok(R('G.state') === 'initials', 'leaderboard: a top score didn\'t ask for initials (' + R('G.state') + ')');
  step({ held: {}, pressed: { up: true } }); step({ held: {}, pressed: { a: true } }); step({ held: {}, pressed: { a: true } }); step({ held: {}, pressed: { a: true } });
  const b = R('board()'); ok(b.length === 2 && b[0].s === 4321 && b[0].n === 'BAA' && b[0].st === 1, 'leaderboard: entry wrong ' + JSON.stringify(b));
  ok(R('G.state') === 'board', 'leaderboard: didn\'t show the board after entering');
}
function chain() { // dropping the top container of a full column knocks the next one down, and so on: chain links score and pop up
  R('DEV.noEnemies = true; DEV.inv = true; newGame(); G.state = "play"; G.spawnQ = []; G.enemies = []');
  const before = R('G.score'); R('startFall(G.pieces.find(p => p.c === 8 && p.row === 4))');
  const seen = new Set(); for (let f = 0; f < 600; f++) { step(); for (const t of R('G.pops.map(p => p.text)')) if (/KNOCK/.test(t)) seen.add(t.split(' ')[0]); }
  ok(seen.has('DOUBLE') && seen.has('TRIPLE'), 'chain: no DOUBLE/TRIPLE KNOCK popups (' + [...seen] + ')'); ok(R('G.score') - before >= 300, 'chain: chain bonus not scored');
  R('DEV.noEnemies = false; DEV.inv = false');
}
function watchman() { // the Night Watchman turns round when the worker is behind him on his catwalk (after a short warning); Pratt never does
  for (const [type, wantTurn] of [['watch', true], ['pratt', false]]) {
    R(`seed(3); DEV.noEnemies = true; DEV.inv = true; newGame(); G.state = "play"; G.spawnQ = []; G.p.x = 100; G.p.y = rowY(4)`);
    R(`G.enemies = [{ type: '${type}', x: 160, y: rowY(4), dx: 1, dy: 0, acc: 0, speed: 0.6, chase: 0.9, state: 'walk', t: 0, anim: 0, rideOff: 0, mode: 'patrol', mt: 0 }]`);
    let turnedAt = -1;
    for (let f = 0; f < 90; f++) { step(); if (R('G.enemies[0].dx') === -1 && turnedAt < 0) turnedAt = f; }
    if (wantTurn) { ok(turnedAt >= 20, 'watchman: never turned round on the worker behind him (or turned with no warning): ' + turnedAt); }
    else ok(turnedAt < 0 || R('G.enemies[0].x') > 175, 'watchman: Pratt turned round on the worker behind him');
  }
  // next door (Chris 2026-11-08): Buck on the catwalk below, the ladder behind the Watchman the quick way to him -> he turns; with the
  // ladder ahead quicker, or two catwalks away, he doesn't; Pratt never does
  for (const [type, px, prow, want] of [['watch', 150, 19, true], ['watch', 240, 19, false], ['watch', 150, 4, false], ['pratt', 150, 19, false]]) {
    R(`seed(3); DEV.noEnemies = true; DEV.inv = true; newGame(); G.state = "play"; G.spawnQ = []; G.p.x = ${px}; G.p.y = rowY(${prow})`);
    R(`G.enemies = [{ type: '${type}', x: 208, y: rowY(14), dx: 1, dy: 0, acc: 0, speed: 0.3, chase: 0.95, state: 'walk', t: 0, anim: 0, rideOff: 0, mode: 'patrol', mt: 0 }]`);
    let turned = false;
    for (let f = 0; f < 70; f++) { step(); if (R('G.enemies[0].dx') === -1) turned = true; }
    ok(turned === want, `watchman next door: ${type} with Buck at ${px} row ${prow} ${want ? 'never turned' : 'turned'}`);
  }
  R('G.enemies = []; DEV.noEnemies = false; DEV.inv = false');
}
function howto() { // How to Play (the basics) and the ENCYCLOPEDIA: every card's live demo runs to its end and shows what its card says
  for (const bk of ['basics', 'guide']) {
  R('G.state = "title"; G.introDone = true; startHowto("' + bk + '")');
  const n = R('book().length');
  for (let i = 0; i < n; i++) {
    R('G.howSel = ' + i + '; setupHowto(); G.watchDemoTurned = false');
    const name = bk + ' ' + R('book()[' + i + '].name'), expect = R('book()[' + i + '].expect ? book()[' + i + '].expect.source : ""');
    const seen = new Set(); let steps = 0, looped = false;
    for (let f = 0; f < 60 * 20 && !looped; f++) {
      step(); if (R('G.state') !== 'howto') { fail('howto ' + name + ': left How to Play (' + R('G.state') + ')'); break; }
      for (const t of R('G.pops.flatMap(p => [p.text, p.sub || ""])')) if (t) seen.add(t);
      if (R('G.enemies[0] && G.enemies[0].type === "watch" && G.enemies[0].turnT > 0')) R('G.watchDemoTurned = true');
      const s = R('G.demo.step'); if (s < steps) looped = true; steps = Math.max(steps, s);
    }
    if (name === 'guide WATCHMAN') ok(R('!!G.watchDemoTurned'), 'howto WATCHMAN: the Watchman never turned for the ladder');
    ok(looped || steps >= R('book()[' + i + '].steps.length'), 'howto ' + name + ': the demo never got to its end');
    if (expect) ok([...seen].some(t => new RegExp(expect).test(t)), 'howto ' + name + ': the demo never showed ' + expect + ' (saw: ' + [...seen].join(', ') + ')');
    const lines = Math.ceil(R('book()[' + i + '].text.length') * 5.8 * 0.66 / 250) + 1; // (no canvas here to measure: Bungee is about 0.66 wide per size)
    if (bk === 'guide') ok(lines <= 14, 'howto ' + name + ': text very long for the card (' + lines + ' lines; it scrolls, but keep it readable)');
    else ok(R('book()[' + i + '].text.length') <= 135, 'howto ' + name + ': a How to Play card should be two or three short lines (' + R('book()[' + i + '].text.length') + ' characters)');
  }
  }
  // the last How to Play card's A opens the ENCYCLOPEDIA
  R('startHowto("basics"); G.howSel = BASICS.length - 1; setupHowto()'); step({ held: {}, pressed: { a: true } });
  ok(R('G.howBook') === 'guide' && R('G.state') === 'howto', 'howto: A on the last card should open the ENCYCLOPEDIA');
  R('G.state = "title"');
}
function shifts() { // stage order (Chris 2026-11-08): shift 1 = layouts 1-3; each later shift replays them all and ends on one new layout
  R('DEV.noEnemies = true; newGame()');
  const seen = [];
  for (let k = 0; k < 11; k++) {
    seen.push(R('stageLabel() + ":" + G.level + ":" + (NIGHT() ? "n" : "d") + ":" + stageRoster().filter(t => t === "watch").length + "/" + stageRoster().filter(t => t === "watch" || t === "pratt").length + ":" + stageReached()'));
    R('G.state = "clear"; G.clearOut = 1; G.t = CARD_SNAP'); step(); step();
  }
  const want = ['1-1:0:d:0/2:1', '1-2:1:d:0/2:2', '1-3:2:d:0/3:3', '2-1:0:n:1/2:4', '2-2:1:n:1/2:5', '2-3:2:n:2/3:6', '2-4:3:n:4/4:7', '3-1:0:d:1/1:8'];
  for (let i = 0; i < want.length; i++) ok(seen[i] === want[i], 'shifts: stage ' + (i + 1) + ' is ' + seen[i] + ', wanted ' + want[i]);
  ok(R('LEVELS.slice(0, 4).every((d, i) => firstWorld(i) === Math.max(0, i - 2))'), 'shifts: firstWorld');
  // walker speeds: Pratt ramps over shift 1 to his top, the Watchman over shift 2 to his
  const sp = (w, l, t) => R(`G.loop = ${w}; G.level = ${l}; walkerSpeed('${t}')`);
  ok(sp(0, 0, 'pratt') === 0.52 && Math.abs(sp(0, 2, 'pratt') - 0.66) < 1e-9 && Math.abs(sp(1, 3, 'pratt') - 0.66) < 1e-9, 'shifts: Pratt speeds');
  ok(sp(1, 0, 'watch') === 0.72 && Math.abs(sp(1, 3, 'watch') - 0.82) < 1e-9 && Math.abs(sp(2, 0, 'watch') - 0.82) < 1e-9 && Math.abs(sp(2, 4, 'watch') - 0.86) < 1e-9, 'shifts: Watchman speeds');
  // (Chris 2026-11-09: very logical) walkers and guards only ever get harder, stage by stage, 1-1 to 3-5 and on into overtime
  { let pw = 0, pd = 0; for (let w = 0; w < 3; w++) for (let l = 0; l < R(`worldLen(${w})`); l++) { const v = R(`G.loop = ${w}; G.level = ${l}; [Math.max(walkerSpeed('pratt') * (G.loop < 1), walkerSpeed('watch') * (G.loop >= 1)), difficulty()]`); ok(v[0] >= pw - 1e-9 && v[1] >= pd - 1e-9, `shifts: ${w + 1}-${l + 1} should be no easier than the stage before (${v} after ${pw},${pd})`); pw = v[0]; pd = v[1]; } }
  ok(sp(1, 0, 'watch') > sp(1, 0, 'pratt') + 0.05, 'shifts: the Watchman should be noticeably quicker than Pratt');
  R('DEV.noEnemies = false; G.state = "title"');
}
function ladderhit() { // (Chris 2026-11-08) an enemy on a ladder at a dropping container: just below the catwalk he's squashed, feet in it he rides
  for (const [dy, want] of [[3, 'SQUASH'], [12, 'SQUASH'], [-6, 'RIDER']]) {
    R(`seed(5); DEV.noEnemies = true; DEV.inv = true; newGame(); G.state = "play"; G.spawnQ = []; G.p.x = 300; G.p.y = rowY(19); G.pops = []`);
    R(`G.enemies = [{ type: 'pratt', x: 92, y: rowY(9) + ${dy}, dx: 0, dy: 1, acc: 0, speed: 0, chase: 0.8, state: 'walk', t: 0, anim: 0, rideOff: 0, mode: 'patrol', mt: 0 }]`);
    R('startFall(G.pieces.find(pc => pc.c === 8 && pc.row === 9))');
    const seen = new Set();
    for (let f = 0; f < 150; f++) { step(); for (const t of R('G.pops.map(p => p.text)')) seen.add(t); }
    ok([...seen].some(t => t.startsWith(want)), `ladderhit: enemy ${dy} px from the catwalk on a ladder should give ${want} (saw ${[...seen].join(', ')})`);
  }
  R('G.enemies = []; DEV.noEnemies = false; DEV.inv = false; G.state = "title"');
}
function hornreach() { // (Chris 2026-11-09) a guy coming up a ladder right in front of Buck, inside the arcs, should freeze; the catwalk below is out of reach
  for (const [dx, dy, want] of [[16, 14, 'stun'], [16, 0, 'stun'], [30, 8, 'stun'], [40, 0, 'stun'], [8, 16, 'stun'], [16, 40, 'walk'], [16, -40, 'walk'], [30, 40, 'walk'], [30, -40, 'walk'], [16, 26, 'walk'], [-6, 0, 'stun'], [-12, 0, 'stun'], [-20, 0, 'walk'], [-16, 40, 'walk'], [50, 0, 'stun'], [60, 0, 'walk']] /* (Chris 2026-11-11: reaches 52 px in front and 15 behind) */) {
    R(`DEV.noEnemies = true; newGame(); G.state = "play"; G.spawnQ = []; G.p.x = 200; G.p.y = rowY(14); G.p.face = 1; G.p.climb = false; G.p.horns = 5`);
    R(`G.enemies = [{ type: 'pratt', x: 200 + ${dx}, y: rowY(14) + ${dy}, dx: 0, dy: -1, acc: 0, speed: 0, chase: 0.8, state: 'walk', t: 0, anim: 0, rideOff: 0, mode: 'patrol', mt: 0 }]`);
    R('blowHorn(G.p, 0); updateClouds()');
    ok(R('G.enemies[0].state') === want, `hornreach: enemy at ${dx},${dy} from Buck should be ${want} (${R('G.enemies[0].state')})`);
  }
  // (Chris 2026-11-09) on a catwalk, up or down held aims it at the catwalk above or below
  for (const [v, dx, dy, want] of [[-1, 0, -40, 'stun'], [-1, 10, -40, 'stun'], [1, 0, 40, 'stun'], [-1, 30, -40, 'walk'], [-1, 0, 40, 'walk'], [1, 0, -40, 'walk'], [-1, 20, 0, 'walk']]) {
    R(`DEV.noEnemies = true; newGame(); G.state = "play"; G.spawnQ = []; G.p.x = 200; G.p.y = rowY(14); G.p.face = 1; G.p.climb = false; G.p.horns = 5`);
    R(`G.enemies = [{ type: 'pratt', x: 200 + ${dx}, y: rowY(14) + ${dy}, dx: 0, dy: -1, acc: 0, speed: 0, chase: 0.8, state: 'walk', t: 0, anim: 0, rideOff: 0, mode: 'patrol', mt: 0 }]`);
    R('blowHorn(G.p, ' + v + '); updateClouds()');
    ok(R('G.enemies[0].state') === want, `hornreach: on a catwalk aiming ${v < 0 ? 'up' : 'down'}, enemy at ${dx},${dy} should be ${want} (${R('G.enemies[0].state')})`);
  }
  // a diagonal (left or right held too) still blasts the way he faces
  R(`DEV.noEnemies = true; newGame(); G.state = "play"; G.spawnQ = []; G.p.x = 200; G.p.y = rowY(14); G.p.face = 1; G.p.climb = false; G.p.horns = 5; G.clouds = []`);
  R('updatePlayer({ held: { down: true, right: true }, pressed: { a: true } })');
  ok(R('G.clouds.length && G.clouds[0].face') === 1, 'hornreach: down-right on a catwalk should still blast sideways');
  // on a ladder, blasting up or down: along the ladder, not the catwalk two floors off or a guy off to the side
  for (const [v, dx, dy, want] of [[1, 0, 24, 'stun'], [1, 0, 40, 'stun'], [1, 0, 60, 'walk'], [1, 30, 20, 'walk'], [1, 0, -20, 'walk'], [-1, 0, -30, 'stun'], [-1, 10, -40, 'stun'], [-1, 0, -60, 'walk'], [-1, 0, 20, 'walk']]) {
    R(`DEV.noEnemies = true; newGame(); G.state = "play"; G.spawnQ = []; { const l = L.ladders.find(l => l.bot - l.top >= 40); G.p.x = l.x; G.p.y = l.top + 20; } G.p.climb = true; G.p.horns = 5`);
    R(`G.enemies = [{ type: 'pratt', x: G.p.x + ${dx}, y: G.p.y + ${dy}, dx: 0, dy: -1, acc: 0, speed: 0, chase: 0.8, state: 'walk', t: 0, anim: 0, rideOff: 0, mode: 'patrol', mt: 0 }]`);
    R('blowHorn(G.p, ' + v + '); updateClouds()');
    ok(R('G.clouds[0] && G.clouds[0].dy') === v, 'hornreach: on a ladder the blast should go ' + (v > 0 ? 'down' : 'up'));
    ok(R('G.enemies[0].state') === want, `hornreach: ladder blast ${v > 0 ? 'down' : 'up'}, enemy at ${dx},${dy} should be ${want} (${R('G.enemies[0].state')})`);
  }
  R('G.enemies = []; G.clouds = []; DEV.noEnemies = false; G.state = "title"');
}
function worth() { // (Chris 2026-11-09) tougher enemies pay more, and a quarter more each overtime
  const w = (loop, t, base) => R(`G.loop = ${loop}; worthPts(${base}, enemyWorth({ type: '${t}' }))`);
  const got = [w(0, 'pratt', 2000), w(0, 'watch', 2000), w(0, 'crab', 2000), w(0, 'fork', 2000), w(0, 'gull', 2000), w(3, 'pratt', 2000), w(6, 'gull', 2000), w(0, 'gull', 300)].join(' ');
  ok(got === '2000 2500 2500 3000 3000 2500 4500 450', 'worth: squash values by type and overtime (' + got + ')');
  R('G.loop = 0');
}
function powercrate() { // (Chris 2026-11-09) half loaded: the crane lowers the power crate; it works like a container, shatters where it ends up, POWER RUSH
  const setup = (lvl, seedN) => R(`seed(${seedN}); DEV.noEnemies = true; newGame(); startLevel(${lvl}); G.state = 'play'; G.enemies = []; G.spawnQ = []; G.p.x = 4; G.p.y = rowY(19); { const load = G.pieces.slice(); for (let i = 0; i < Math.ceil(load.length / 2); i++) { load[i].state = "plate"; load[i].y = 999; } }`);
  setup(0, 3); R('updateGold()'); ok(!R('!!goldPiece()'), 'powercrate: never on 1-1');
  setup(1, 3); R('updateGold()'); ok(R('!!goldPiece() && goldPiece().state === "lower"'), 'powercrate: the crane should lower it once the ship is half loaded on 1-2');
  for (let i = 0; i < 100; i++) R('updateGold()');
  ok(R('goldPiece().state') === 'rest' && R('goldPiece().y === rowY(goldPiece().row)'), 'powercrate: it should come to rest on its catwalk');
  // a rider on it, then walk it: it drops, the rider sends it a floor further, and it shatters there: POWER RUSH
  R(`{ const g = goldPiece(); G.enemies = [{ type: 'pratt', x: g.x + 40, y: g.y, dx: 1, dy: 0, acc: 0, speed: 0, chase: 0.8, state: 'stun', t: 999, anim: 0, rideOff: 0, mode: 'patrol', mt: 0 }]; G.goldRow0 = g.row; for (let i = 0; i < PANELS; i++) pressPieces({ x: g.x + i * (PIECE_W * T / PANELS) + 2, y: g.y }); }`);
  ok(R('goldPiece().state') === 'fall' && R('goldPiece().riders.length') === 1, 'powercrate: walked across, it should drop with the rider aboard');
  ok(R('G.p.gold') === R('GOLD.power'), 'powercrate: POWER RUSH should start the moment it drops (not when it lands)');
  const s0 = R('G.score');
  for (let i = 0; i < 200 && R('!!goldPiece()'); i++) R('updatePieces(); updateGold()');
  ok(!R('!!goldPiece()') && R('G.p.gold') > 0, 'powercrate: it should shatter where it ends up and start POWER RUSH (gold ' + R('G.p.gold') + ')');
  ok(R('G.score') > s0 && R('G.enemies.length') === 0, 'powercrate: the rider should be scored');
  // POWER RUSH: an enemy touching Buck is flattened, Buck lives
  R(`G.enemies = [{ type: 'watch', x: G.p.x + 4, y: G.p.y, dx: -1, dy: 0, acc: 0, speed: 0, chase: 0.9, state: 'walk', t: 0, anim: 0, rideOff: 0, mode: 'patrol', mt: 0 }]; checkHits();`);
  ok(R('G.state') === 'play' && R('G.enemies.length') === 0, 'powercrate: in POWER RUSH an enemy Buck touches is flattened, and Buck lives');
  // (Chris 2026-11-09) a rampage builds: each bash in the same rush is worth 1,000 more than the last (before worth and combo)
  R('G.p.bashN = 0; G.combo = 0; G.comboT = 0');
  const bashes = [];
  for (let k = 0; k < 3; k++) { const s1 = R('G.score'); R(`G.combo = 0; G.comboT = 0; G.enemies = [{ type: 'pratt', x: G.p.x + 4, y: G.p.y, dx: -1, dy: 0, acc: 0, speed: 0, chase: 0, state: 'walk', t: 0, anim: 0, rideOff: 0, mode: 'patrol', mt: 0 }]; checkHits();`); bashes.push(R('G.score') - s1); }
  ok(bashes.join() === '1000,2000,3000', 'powercrate: bashes in one rush should build 1000, 2000, 3000 (got ' + bashes + ')');
  ok(R('walkerSpeed && G.p.gold > 0'), 'powercrate: still in POWER RUSH');
  R('G.combo = 3; G.comboT = 5; for (let i = 0; i < 200; i++) { updateGold(); if (G.comboT > 0 && --G.comboT === 0) G.combo = 0; }');
  ok(R('G.combo') === 3, 'powercrate: the combo should last as long as POWER RUSH does');
  // the stage still clears without it, and it isn't part of the load
  setup(1, 5); R('updateGold()'); R('for (const pc of G.pieces) if (!pc.gold) pc.state = "plate"; updatePlay({ held: {}, pressed: {} })');
  ok(R('G.state') === 'clear', 'powercrate: the stage clears with the power crate still up (it isn\'t part of the load)');
  // left alone it's lifted away again
  setup(2, 7); R('updateGold()'); for (let i = 0; i < 100 + 720 + 70; i++) R('updateGold()');
  ok(!R('!!goldPiece()'), 'powercrate: left alone, the crane takes it back');
  R('G.enemies = []; DEV.noEnemies = false; G.p.gold = 0; G.state = "title"');
}
function lastsafe() { // (Chris 2026-11-09) once the last container is on its way down, Buck can't be caught
  R(`DEV.noEnemies = true; newGame(); startLevel(0); G.state = 'play'; G.spawnQ = []; G.p.inv = 0; for (const pc of G.pieces) pc.state = 'plate'; G.pieces[0].state = 'fall'; G.pieces[0].target = { kind: 'plate' }; G.pieces[0].y = rowY(4); G.enemies = [{ type: 'pratt', x: G.p.x, y: G.p.y, dx: 1, dy: 0, acc: 0, speed: 0, chase: 0.8, state: 'walk', t: 0, anim: 0, rideOff: 0, mode: 'patrol', mt: 0 }]; checkHits();`);
  ok(R('G.state') === 'play', 'lastsafe: an enemy on Buck while the last container falls should not kill him');
  // (2026-11-10) only its last drop into the ship: dropping one floor on the way down is no free pass
  R(`G.pieces[0].target = { kind: 'floor', row: 9 }; checkHits();`);
  ok(R('G.state') === 'dying', 'lastsafe: the last container dropping one floor (not into the ship) should not make Buck safe');
  R(`G.state = 'play'; G.pieces[0].target = { kind: 'plate' };`);
  R(`G.pieces[0].state = 'rest'; checkHits();`);
  ok(R('G.state') === 'dying', 'lastsafe: with a container still resting, the same touch does');
  R('G.enemies = []; DEV.noEnemies = false; G.state = "title"');
}
function clearcard() { // (Chris 2026-11-08) the SHIP LOADED card: the time bonus (or penalty) lands once, the card waits for A, then the next stage
  for (const [secs, sign] of [[60, 1], [200, -1]]) {
    R('DEV.noEnemies = true; newGame(); G.state = "play"; G.st.f = ' + secs * 60 + '; for (const pc of G.pieces) pc.state = "plate"');
    step();
    ok(R('G.state') === 'clear', 'clearcard: the stage did not clear');
    const s0 = R('G.score'), d = R('G.st.delta');
    ok(Math.sign(d) === sign, `clearcard: ${secs}s should give a ${sign > 0 ? 'bonus' : 'penalty'} (${d})`);
    for (let f = 0; f < 600; f++) step();
    ok(R('G.state') === 'clear', 'clearcard: the card moved on without a press');
    const hb = R('G.st.hornBonus'); ok(hb === R('G.p.horns') * 2000, 'clearcard: horn bonus ' + hb);
    const cb = R('G.st.cleanBonus'); ok(cb === 5000, 'clearcard: no-misses bonus ' + cb + ' (no life lost, shift 1: 5,000)');
    ok(R('G.score') === Math.max(0, s0 + d) + hb + cb, `clearcard: score ${R('G.score')}, wanted ${Math.max(0, s0 + d) + hb + cb}`);
    step({ held: {}, pressed: { a: true } }); for (let f = 0; f < 40; f++) step();
    ok(R('G.state') === 'intro' && R('G.level') === 1, 'clearcard: A did not move on to the next stage');
  }
  // one life lost: ONE MISS 2,000; two: nothing (times the shift number)
  for (const [d, want] of [[1, 2000], [2, 0]]) {
    R('DEV.noEnemies = true; newGame(); G.state = "play"; G.st.deaths = ' + d + '; for (const pc of G.pieces) pc.state = "plate"');
    step();
    ok(R('G.st.cleanBonus') === want, 'clearcard: ' + d + ' lives lost should pay ' + want + ', paid ' + R('G.st.cleanBonus'));
  }
  R('DEV.noEnemies = false; G.state = "title"');
}
function lives() { // extra lives at 30k, then each gap 20k longer (80k, 150k, 240k...); the bar's start moves up with each
  R('DEV.noEnemies = true; newGame(); G.state = "play"');
  const got = [];
  for (const n of [5000, 9000, 7000, 12000, 20000, 3000, 60000, 40000]) { R('addScore(' + n + ', 10, 10, "", false)'); got.push(R('[G.score, G.lives, G.lifeFrom, G.nextLife].join("/")')); }
  const want = ['5000/3/0/30000', '14000/3/0/30000', '21000/3/0/30000', '33000/4/30000/80000', '53000/4/30000/80000', '56000/4/30000/80000', '116000/5/80000/150000', '156000/6/150000/240000'];
  for (let i = 0; i < want.length; i++) ok(got[i] === want[i], 'lives: after ' + (i + 1) + ' scores ' + got[i] + ', wanted ' + want[i]);
  ok(R('[240000, 350000, 630000, 990000].map(nextLifeAfter).join()') === '350000,480000,800000,1200000', 'lives: each gap should be 20,000 longer than the last');
  R('DEV.noEnemies = false; G.state = "title"');
}
function crabspot() { // (Chris 2026-11-08) the Captain never lands on a catwalk piece shorter than CRAB_MIN_RUN
  for (let li = 0; li < R('LEVELS.length'); li++) {
    R('DEV.noEnemies = true; newGame(); startLevel(' + li + '); G.state = "play"');
    for (let k = 0; k < 40; k++) {
      const at = R('pickSpawn("crab")'), r = (at.y - R('FY')) / R('T'), c = Math.floor(at.x / R('T'));
      const run = R('LEVELS[' + li + '].floors').find(f => f[0] === r && c >= f[1] && c <= f[2]);
      ok(run && run[2] - run[1] + 1 >= R('CRAB_MIN_RUN'), 'crabspot: layout ' + (li + 1) + ' put the Captain on a short piece (row ' + r + ' col ' + c + ')');
      R('G.p.x = ' + (20 + k * 9) + '; G.p.y = rowY(' + [4, 9, 14, 19][k % 4] + ')');
    }
  }
  R('DEV.noEnemies = false; G.state = "title"');
}
function forklift() { // (Chris 2026-11-09) shift 3's guards turn into Forklifts; a Forklift revs, then charges until it runs out (FORK.reach) or the catwalk ends
  R('seed(9); DEV.noEnemies = true; newGame(); G.loop = 2');
  let forks = 0, crabs = 0;
  for (let k = 0; k < 40; k++) { R('startLevel(0)'); for (const t of R('stageRoster()')) { if (t === 'fork') forks++; if (t === 'crab') crabs++; } }
  ok(forks > 1 && crabs > 15, `forklift: 3-1 should be mostly Captains with a few Forklifts (crabs ${crabs}, forks ${forks})`);
  R('startLevel(worldLen() - 1)'); ok(!R('stageRoster()').includes('crab'), 'forklift: the last stage of shift 3 should be all Forklifts');
  R('startLevel(0); G.state = "play"; G.spawnQ = []; G.p.x = 100; G.p.y = rowY(14); DEV.inv = true');
  R(`G.enemies = [{ type: 'fork', x: 200, y: rowY(14), dx: -1, dy: 0, acc: 0, speed: 0.5, chase: 0, state: 'walk', t: 0, anim: 0, rideOff: 0, mode: 'patrol', mt: 0 }]`);
  let revved = false, ends = -1;
  for (let f = 0; f < 400; f++) { step(); if (R('G.enemies[0] && G.enemies[0].mode') === 'wind') revved = true; if (revved && R('G.enemies[0] && G.enemies[0].mode') === 'rest' && ends < 0) ends = R('G.enemies[0].x'); }
  ok(revved, 'forklift: never revved up'); ok(ends >= 0 && ends < 70, 'forklift: should charge about FORK.reach (160 px) from 200 (stopped at ' + ends + ')'); // (2026-11-11: a charge runs out; it used to go to the end)
  R('DEV.noEnemies = false; DEV.inv = false; G.state = "title"');
}
function gull() { // (Chris 2026-11-09) the Gull flies in, dives at Buck and lands on his catwalk; the horn drops him to a catwalk below
  R('seed(4); DEV.noEnemies = false; DEV.inv = true; newGame(); G.loop = 2; startLevel(0); G.state = "play"; G.spawnQ = []; G.enemies = []; G.p.x = 200; G.p.y = rowY(14); spawnGull({ x: -12 }); G.enemies[0].mt = 0');
  let dived = false, landed = false;
  for (let f = 0; f < 600 && !landed; f++) { step(); const m = R('G.enemies[0] && G.enemies[0].mode'); if (m === 'dive') dived = true; if (m === 'land') landed = true; }
  ok(dived && landed, 'gull: never dived and landed (' + dived + ', ' + landed + ')');
  ok(landed && R('G.enemies[0].y') === R('rowY(14)'), 'gull: should land on Buck\'s catwalk (y ' + R('G.enemies[0].y') + ')');
  R('G.enemies[0].mode = "fly"; G.enemies[0].y = 60; G.enemies[0].x = 150; G.enemies[0].state = "stun"; G.enemies[0].t = 160');
  for (let f = 0; f < 60; f++) step();
  ok(R('G.enemies[0].y') === R('rowY(9)'), 'gull: a horned gull should drop onto the catwalk below (y ' + R('G.enemies[0].y') + ')');
  R('G.loop = 2; startLevel(0)'); ok(R('stageRoster().filter(t => t === "gull").length') === 1, 'gull: one gull on 3-1');
  R('DEV.inv = false; G.state = "title"');
}
function overtime() { // (Chris 2026-11-09) after shift 3 the shifts keep coming, hotter each time, steadily
  R('DEV.noEnemies = true; newGame()');
  const at = w => R(`G.loop = ${w}; startLevel(0); [heat(), parSecs(), stunTime(), respawnDelay(), freeHorns(), walkerSpeed('watch'), stageRoster().length, LOOK(), stageTip()].join('|')`);
  const rows = [2, 3, 6, 9, 12, 30].map(at); // 3-1, then the first stage of OT1, OT2, OT3, OT4, OT10
  console.log('  overtime: ' + rows.join('  '));
  const h = rows.map(r => r.split('|'));
  ok(h[0][0] === '0' && h[1][0] === '1' && h[2][0] === '2' && h[3][0] === '3' && h[5][0] === '10', 'overtime: heat counts overtimes');
  // (Chris 2026-11-09, later) overtime replays the game's structure: Pratts again in its shift 1, Watchmen in its shift 2, Forklifts and
  // gulls in its shift 3; each stage harder than the same stage before overtime, and harder again each overtime
  ok(R(`G.loop = 3; startLevel(0); stageRoster().includes('pratt') && !stageRoster().includes('watch')`), 'overtime: OT1 1-1 should have Pratts again (no Watchmen)');
  ok(R(`G.loop = 5; startLevel(4); seed(3); stageRoster().includes('gull')`), 'overtime: OT1 3-5 should have gulls');
  const val = (w, l, t) => R(`G.loop = ${w}; G.level = ${l}; [walkerSpeed('${t}'), difficulty(), gullSkill()]`);
  for (const [s, t] of [[0, 'pratt'], [1, 'watch'], [2, 'watch']])
    for (let l = 0; l < 3 + s; l++) {
      const b = val(s, l, t), o1 = val(3 + s, l, t), o2 = val(6 + s, l, t);
      ok(o1[0] > b[0] && o1[1] > b[1] && o2[0] > o1[0] && o2[1] > o1[1] && o2[2] >= o1[2] && o1[2] >= b[2], `overtime: ${s + 1}-${l + 1} should be harder in OT1 than before and harder again in OT2 (${b} / ${o1} / ${o2})`);
      if (l) { const p0 = val(s, l - 1, t), p1 = val(3 + s, l - 1, t); ok(o1[0] - p1[0] > b[0] - p0[0] - 1e-9 && o1[1] - p1[1] > b[1] - p0[1] - 1e-9, `overtime: OT1 should ramp faster than the game through shift ${s + 1}`); }
    }
  for (let i = 2; i < h.length; i++) ok(+h[i][5] >= +h[i - 1][5] && +h[i][1] <= +h[i - 1][1] && +h[i][6] >= +h[i - 1][6], 'overtime: should only get harder (' + rows[i] + ')');
  ok(+h[5][5] > 1, 'overtime: far out the walkers should outrun Buck (' + rows[5] + ')');
  // (Chris 2026-11-09) your rules never change in overtime: the same par and free horns as ever; (2026-11-11) the stun only shrinks with
  // Buck's own pace (buckSpeed), 160 frames until he speeds up
  ok(rows.every(r => r.split('|')[1] === '90' && +r.split('|')[2] <= 160 && +r.split('|')[2] >= 100 && r.split('|')[4] === '5'), 'overtime: par and free horns should never change, the stun only shorten a little (' + rows.join('  ') + ')');
  ok(rows[0].split('|')[2] === '160', 'overtime: the stun is 160 before overtime');
  ok(R('G.loop = 3; startLevel(1); stageLabel() + "|" + otNum()') === '1-2|1', 'overtime: OT1 1-2 should read 1-2 with overtime 1 shown on its own');
  // (Chris 2026-11-09) each overtime replays shift 1 (day, 3 stages), shift 2 (night, 4), shift 3 (storm, 5)
  const shape = [3, 4, 5, 6, 7, 8].map(w => R(`G.loop = ${w}; startLevel(0); [stageId(), worldLen(), LOOK()].join('/')`)).join(' ');
  ok(shape === 'OT1 1-1/3/day OT1 2-1/4/night OT1 3-1/5/storm OT2 1-1/3/day OT2 2-1/4/night OT2 3-1/5/storm', 'overtime: shifts in each overtime (' + shape + ')');
  R('DEV.noEnemies = false; G.loop = 0; G.state = "title"');
}
function deathcombo() { // (2026-11-11) getting caught ends the combo, nothing builds one while he's down, and it starts fresh after
  R('DEV.noEnemies = false; DEV.inv = false; newGame(); G.state = "play"; G.p.inv = 0; G.spawnQ = []; G.enemies = []');
  R('addScore(50, 10, 10); addScore(50, 10, 10); addScore(50, 10, 10); addScore(50, 10, 10)');
  ok(R('G.combo') === 4 && R('G.comboT') > 0, 'deathcombo: four moves should make a combo of 4 (' + R('G.combo') + ')');
  R('const e = demoEnemy("pratt", G.p.x, 0, 1, 0); e.y = G.p.y; G.enemies = [e]'); step();
  ok(R('G.state') === 'dying', 'deathcombo: the pratt on him should have caught him (' + R('G.state') + ')');
  ok(R('G.combo') === 0 && R('G.comboT') === 0, 'deathcombo: the combo should end when he is caught (' + R('G.combo') + ')');
  const s0 = R('G.score'); R('addScore(50, 10, 10); addScore(50, 10, 10); addScore(50, 10, 10)');
  ok(R('G.combo') === 0 && R('G.score') === s0 + 150, 'deathcombo: moves while he is down score plain points and build no combo (' + R('G.combo') + ', +' + (R('G.score') - s0) + ')');
  R('G.enemies = []'); for (let f = 0; f < 400 && R('G.state') !== 'play'; f++) step();
  ok(R('G.state') === 'play', 'deathcombo: he should be back in play (' + R('G.state') + ')');
  R('addScore(50, 10, 10)');
  ok(R('G.combo') === 1, 'deathcombo: after he is back the combo starts again from 1 (' + R('G.combo') + ')');
  R('G.state = "title"');
}
function quitsure() { // (2026-11-11) quitting or restarting from the pause menu asks twice; moving off the line takes it back
  R('DEV.noEnemies = true; newGame(); G.state = "play"; pauseGame()');
  const qi = R('pauseItems().findIndex(it => it[0] === "QUIT TO TITLE")');
  ok(qi >= 0, 'quitsure: no QUIT TO TITLE line');
  R('G.menu = ' + qi); step({ held: {}, pressed: { a: true } });
  ok(R('G.state') === 'pause' && R('pauseItems()[' + qi + '][0]') === 'SURE? PRESS A AGAIN', 'quitsure: one A should only ask (' + R('G.state') + ')');
  step({ held: {}, pressed: { up: true } }); step({ held: {}, pressed: { down: true } });
  ok(R('pauseItems()[' + qi + '][0]') === 'QUIT TO TITLE', 'quitsure: moving off the line should take the question back');
  step({ held: {}, pressed: { a: true } }); step({ held: {}, pressed: { a: true } });
  ok(R('G.state') !== 'pause' && R('G.state') !== 'play', 'quitsure: two As should quit to the title (' + R('G.state') + ')');
  R('DEV.noEnemies = true; newGame(); G.state = "play"; pauseGame(); G.menu = 1'); step({ held: {}, pressed: { a: true } });
  ok(R('G.state') === 'pause' && R('G.level') === 0, 'quitsure: one A on RESTART GAME should only ask');
  R('DEV.noEnemies = false; G.state = "title"');
}
function pathfind() { // (2026-11-11) on 1-2's broken catwalks a Pratt finds his way round to Buck, wherever Buck stands
  const spots = [[60, 9], [100, 9], [330, 14], [200, 14], [60, 19], [300, 4]], starts = [[300, 9, -1], [40, 4, 1], [250, 19, -1], [100, 14, 1]];
  let tot = 0, n = 0, never = 0;
  for (const [bx, br] of spots) for (const [ex, er, ed] of starts) {
    R('seed(1); newGame(); G.level = 1; buildStage(1); G.state = "play"; G.goT = 0; DEV.inv = true; G.spawnQ = []; Object.assign(G.p, { x: ' + bx + ', y: rowY(' + br + '), inv: 0 }); globalThis.__e = demoEnemy("pratt", ' + ex + ', ' + er + ', ' + ed + '); __e.speed = 0.6; G.enemies = [__e]');
    let f = 0;
    for (; f < 60 * 25; f++) { step(); if (R('Math.abs(G.enemies[0].x - G.p.x) < 9 && Math.abs(G.enemies[0].y - G.p.y) < 10')) break; }
    if (f >= 60 * 25) never++; else { tot += f; n++; }
  }
  ok(never === 0, 'pathfind: a Pratt never reached Buck ' + never + ' times in 24 (25 s each) on 1-2');
  ok(tot / Math.max(1, n) / 60 < 8, 'pathfind: Pratts took ' + (tot / n / 60).toFixed(1) + ' s on average to reach Buck on 1-2 (the old way took 8.3)');
  R('DEV.inv = false; G.state = "title"');
}
const ALL = { pathfind, quitsure, deathcombo, levels, crabspot, overtime, forklift, gull, shifts, ladderhit, hornreach, worth, powercrate, lastsafe, clearcard, lives, bot, ladders, crab, watchman, howto, chain, leaderboard, attract, soak, death, text };
for (const [name, fn] of Object.entries(ALL)) {
  if (want.length && !want.includes(name)) continue;
  const f0 = fails; const t0 = Date.now();
  try { fn(); } catch (e) { fail(name + ' threw: ' + e.stack.split('\n').slice(0, 4).join(' | ')); }
  console.log((fails === f0 ? 'ok   ' : 'FAIL ') + name + ` (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}
process.exit(fails ? 1 : 0);
