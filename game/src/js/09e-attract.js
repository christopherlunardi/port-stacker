// ---------- attract mode (Chris 2026-11-10: "when you're chilling on the home screen"): left alone on the title for three times
// through its animation (the intro and two loops, then every three loops), the game shows a demo, the real game played by a bot, a
// different one each time, then the high scores, then the title again. "PRESS A TO GO BACK" shows the whole time; any button goes
// straight back to the title. A demo never counts: no play log, no high score, and it ends at the first death or a cleared stage.
// (Intermissions between stages are for later: Chris.) ----------
// first: the intro and two loops after it, counted from the title's start; after a demo or a press: three whole loops (Fable's bug check:
// counted from the logo landing, it came a loop late, at 52 s, then every four loops)
const ATTRACT = { first: TI.loop + 2 * TCYCLE, idle: 3 * TCYCLE, demo: 60 * 26, board: 60 * 9 };
// the demos, in turn: the basics on 1-1; a POWER RUSH on 1-2; the night shift's Pier 9 with the Watchman; the storm's finale
// (seeds picked 2026-11-10, after the new layouts: each of these lasts its whole 26 s)
const DEMOS = [
  { loop: 0, level: 0, seed: 3 },
  { loop: 0, level: 1, seed: 7, rush: 150 },
  { loop: 1, level: 3, seed: 2 },
  { loop: 2, level: 4, seed: 20 }
];
let attractNext = 0;
// on the title, after its intro: count the time left alone; start a demo when it's been long enough, as a loop of the scene begins
function attractTitle(inp) {
  // G.idleFrom: the title's time when it was last touched (null: not yet, so from its start)
  if (Object.values(inp.pressed).some(Boolean) || Object.values(inp.held).some(Boolean)) G.idleFrom = G.t;
  if (HEADLESS || G.t < TI.loop || (G.t - TI.loop) % TCYCLE !== 0) return false;
  if (G.idleFrom == null ? G.t < ATTRACT.first : G.t - G.idleFrom < ATTRACT.idle) return false;
  attractStart();
  return true;
}
function attractStart() {
  const d = DEMOS[attractNext++ % DEMOS.length];
  G.attract = { d, t: 0, phase: 'demo' };
  seed(d.seed);
  G.score = 0;
  G.lives = 2;
  G.loop = d.loop;
  G.nextLife = LIFE_FIRST;
  G.lifeFrom = 0;
  G.rushWait = false;
  G.banner = null;
  G.p = null;
  buildStage(d.level);
  G.clearOut = 0;
  G.st = { score0: 0, f: 0, squash: 0, riders: 0, combo: 1, horns: 0, deaths: 0, drop: 0 };
  G.dropPts = {};
  G.dropN = 0;
  G.state = 'play';
  G.t = 0;
  G.goT = 50;
  if (!musicGain) musicStart(1.7); // the title's tune runs on through the demo and the high scores (Chris: it restarted at every change)
}
function attractEnd() {
  G.attract = null;
  G.banner = null;
  G.rushWait = false;
  if (G.p) G.p.gold = 0;
  G.loop = 0;
  G.state = 'title';
  G.t = TI.loop; // back to the start of a loop of the scene, the logo already up
  G.introDone = true;
  G.idleFrom = TI.loop;
}
// at the top of update() while a demo or its high scores show: a real press goes back to the title; otherwise the bot's buttons
function attractInput(inp) {
  const A = G.attract,
    none = { held: {}, pressed: {} };
  if (Object.values(inp.pressed).some(Boolean)) {
    SFX.pause();
    attractEnd();
    return none;
  }
  A.t++;
  if (A.phase === 'demo') {
    const done = A.t >= ATTRACT.demo || (G.state === 'dying' && G.t >= 100) || (G.state === 'clear' && G.t >= 170) || G.state === 'over';
    if (done) {
      // then the high scores, the tune still going
      A.phase = 'board';
      A.t = 0;
      G.banner = null;
      if (G.p) G.p.gold = 0;
      G.loop = 0;
      G.state = 'board';
      G.t = 0;
      G.lastEntry = null;
      G.boardFromTitle = false;
      return none;
    }
    if (A.d.rush && A.t === A.d.rush && G.state === 'play') goldStart();
    return G.state === 'play' ? demoBot() || none : none;
  }
  if (A.t >= ATTRACT.board) attractEnd();
  return none;
}
// the demo's player: walks the real movement code to the nearest container it hasn't walked yet (a path over the catwalks and
// ladders), and blasts the air horn at an enemy close in front of it on its catwalk
function demoBot() {
  const p = G.p;
  if (!p || !L) return null;
  const held = {},
    pressed = {};
  if (p.horns > 0 && !G.clouds.length && !(p.gold > 0))
    for (const e of G.enemies)
      if (e.state === 'walk' && Math.abs(e.y - p.y) < 6 && Math.sign(e.x - p.x) === p.face && Math.abs(e.x - p.x) < 34) {
        pressed.a = true;
        break;
      }
  // an enemy close but not in reach of the horn (coming down a ladder onto it, say): face it and horn when it's level, else back off
  // (on 1-1's new layout the bot walked into a Pratt climbing down, 10 s in, every time)
  if (!pressed.a && !(p.gold > 0))
    for (const e of G.enemies) {
      if (e.state !== 'walk') continue;
      const r = (p.y - FY) / T,
        onFloor = r === Math.floor(r) && L.floor[r] && L.floor[r][Math.floor(p.x / T)] === 1;
      if (!onFloor) {
        // on a ladder: one coming at it on the same ladder sends it back the way it came
        if (Math.abs(e.x - p.x) < 10 && Math.abs(e.y - p.y) < 34 && Math.sign(e.dy || 0) === Math.sign(p.y - e.y)) {
          held[e.y < p.y ? 'down' : 'up'] = true;
          return { held, pressed };
        }
        continue;
      }
      if (Math.abs(e.x - p.x) > 30 || Math.abs(e.y - p.y) > 22) continue;
      const side = Math.sign(e.x - p.x) || (p.x < 192 ? -1 : 1); // (right above or below it: off toward the middle, always the same way)
      if (Math.abs(e.y - p.y) < 6 && p.horns > 0 && !G.clouds.length) {
        held[side < 0 ? 'left' : 'right'] = true;
        pressed.a = true;
      } else held[side < 0 ? 'right' : 'left'] = true;
      return { held, pressed };
    }
  const targets = [];
  for (const pc of G.pieces)
    if (pc.state === 'rest') {
      const sw = 64 / pc.segs.length;
      pc.segs.forEach((s, i) => {
        if (!s) targets.push([pc.x + i * sw + 4, pc.y]);
      });
    }
  if (!targets.length) return { held, pressed };
  const key = (x, y) => x + ',' + y,
    floorAt = (x, y) => (y - FY) % T === 0 && L.floor[(y - FY) / T] && L.floor[(y - FY) / T][Math.floor(x / T)] === 1,
    next = (x, y) => {
      const out = [];
      if (floorAt(x, y)) for (const dx of [-8, 8]) if (floorAt(x + dx, y)) out.push([x + dx, y]);
      for (const l of L.ladders)
        if (l.x === x && y >= l.top && y <= l.bot) {
          if (y - 8 >= l.top) out.push([x, y - 8]);
          if (y + 8 <= l.bot) out.push([x, y + 8]);
        }
      return out;
    };
  let starts = [[Math.floor(p.x / 8) * 8 + 4, p.y]];
  if ((p.y - FY) % 8 !== 0) {
    // part way up a ladder: the nearer end first
    const up = FY + Math.floor((p.y - FY) / 8) * 8,
      dn = up + 8;
    starts =
      p.y - up <= dn - p.y
        ? [
            [p.x, up],
            [p.x, dn]
          ]
        : [
            [p.x, dn],
            [p.x, up]
          ];
  }
  const want = new Set(targets.map(t => key(t[0], t[1]))),
    prev = new Map(starts.map(s => [key(s[0], s[1]), null])),
    q = starts.slice();
  let goal = null;
  while (q.length) {
    const [x, y] = q.shift();
    if (want.has(key(x, y))) {
      goal = [x, y];
      break;
    }
    for (const n of next(x, y)) {
      const k = key(n[0], n[1]);
      if (!prev.has(k)) {
        prev.set(k, [x, y]);
        q.push(n);
      }
    }
  }
  if (!goal) return { held, pressed };
  const path = [goal];
  for (let cur = goal; ; ) {
    const pv = prev.get(key(cur[0], cur[1]));
    if (!pv) break;
    path.unshift(pv);
    cur = pv;
  }
  let to = path.length > 1 ? path[1] : path[0];
  if (p.y !== path[0][1]) to = path[0]; // part way up a ladder: reach the floor first
  if (to[1] !== p.y && to[0] === p.x) held[to[1] < p.y ? 'up' : 'down'] = true;
  else if (to[0] !== p.x) held[to[0] < p.x ? 'left' : 'right'] = true;
  else if (to[1] !== p.y) held[to[1] < p.y ? 'up' : 'down'] = true;
  else held[p.x % 8 < 4 ? 'right' : 'left'] = true; // on the target: across it
  return { held, pressed };
}
// over the demo and its high scores
function drawAttract() {
  const A = G.attract;
  if (!A) return;
  const blink = (G.frame >> 5) & 1;
  if (A.phase === 'demo') {
    rect(0, 23, PW, 11, C.indigo);
    text('DEMO PLAY', 6, 28.5, 6.5, C.yel, 'left');
    if (blink) text('PRESS A TO GO BACK', PW - 6, 28.5, 6.5, C.cream, 'right');
  } else if (blink) {
    rect(PW / 2 - 64, PH - 15, 128, 12, C.indigo);
    text('PRESS A TO GO BACK', PW / 2, PH - 9, 6.5, C.cream, 'center');
  }
}
// first thing in update(): while a demo shows, its buttons instead of the real ones; anywhere but the title, the idle count restarts
function attractFrame(inp) {
  if (G.attract) return attractInput(inp);
  if (G.state !== 'title') G.idleFrom = null;
  return inp;
}
