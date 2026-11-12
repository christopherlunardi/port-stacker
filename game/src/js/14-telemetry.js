// ---------- play log: errors and what happens in games, with the device they happen on (Chris 2026-11-07) ----------
// Events (Chris 2026-11-09: log everything we can): session (device, build, screen), go (a stage starts: lives, horns, its enemies),
// stage (cleared: score, seconds, deaths, horns used and enemies stunned, POWER RUSH, pauses, what you played with, and your path:
// where Buck was every second), death (pos: where he was, how long since he came back, lives and horns left, the last 8 seconds of his
// path), life (an extra life), crate (the power crate: in, rush, away), quit (QUIT TO TITLE), dev (a dev panel button), gameover, error.
// A path is 2 characters a second: his column and row in tiles, each one character of PATH_ABC.
// Where they go: on the claude.ai link, the artifact's own database (collection 'telemetry', only the owner can read it; Claude reads it
// with ArtifactData). In the Retroid app (outside claude.ai) the app posts them in batches as comments on the repo's issue #1 "Play log"
// (read with: gh api repos/christopherlunardi/port-stacker/issues/1/comments); the device also keeps the last 200 in localStorage.
const TELE = {
  q: [],
  db: null,
  busy: false,
  sid: Math.random().toString(36).slice(2, 10),
  runStart: 0,
  stageStart: 0,
  deaths: 0,
  spawnF: 0,
  lives: 0
};
const PATH_ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function teleDevice() {
  let d = '';
  try {
    d = window.StackNative && StackNative.device ? StackNative.device() : '';
  } catch (e) {}
  const ua = HEADLESS ? 'test' : navigator.userAgent,
    m = /\(([^)]+)\)/.exec(ua);
  return (d || (m ? m[1].split(';').slice(0, 3).join(';') : 'unknown')).slice(0, 80);
}
function tele(kind, data) {
  if (HEADLESS || G.state === 'howto' || G.attract) return; // (How to Play's demos and the title's demos aren't games)
  const ev = Object.assign(
    {
      kind,
      at: Date.now(),
      sid: TELE.sid,
      build: BUILD,
      device: teleDevice(),
      app: !!window.StackNative,
      screen: Math.round(LAY.W || 0) + 'x' + Math.round(LAY.H || 0)
    },
    G.devRun || DEV.inv || DEV.noEnemies ? { dev: true } : {}, // used the dev panel (cheats, extra lives, horns, stage jumps): not real play
    data || {}
  );
  try {
    const log = store.get('telemetry', []);
    log.push(ev);
    store.set('telemetry', log.slice(-200));
  } catch (e) {} // the device's own log, always
  try {
    if (window.StackNative && StackNative.log) StackNative.log(JSON.stringify(ev));
  } catch (e) {} // the Retroid app posts these to the repo's Play log issue
  TELE.q.push(ev);
  teleFlush();
}
async function teleFlush() {
  // one write at a time, to the artifact's database when there is one
  if (TELE.busy || !TELE.db || !TELE.q.length) return;
  TELE.busy = true;
  const ev = TELE.q.shift();
  try {
    await TELE.db.collection('telemetry').add(ev);
  } catch (e) {
    if (TELE.q.length < 50) TELE.q.unshift(ev);
    TELE.busy = false;
    setTimeout(teleFlush, 15000);
    return;
  }
  TELE.busy = false;
  if (TELE.q.length) setTimeout(teleFlush, 400);
}
async function teleInit() {
  if (HEADLESS) return;
  tele('session', { ua: navigator.userAgent.slice(0, 160), dpr: window.devicePixelRatio || 1, gpu: window.__gpu || '' });
  window.addEventListener('error', e => {
    if (/ResizeObserver loop/.test(e.message || '')) return;
    tele('error', { msg: String(e.message || e).slice(0, 300), line: e.lineno || 0, state: G.state, stage: G.level + 1 });
  });
  window.addEventListener('unhandledrejection', e =>
    tele('error', { msg: ('promise: ' + ((e.reason && e.reason.message) || e.reason)).slice(0, 300), state: G.state })
  );
  try {
    if (window.claude && window.claude.use) {
      const db = await window.claude.use('db');
      if (db) {
        TELE.db = db;
        teleFlush();
      }
    }
  } catch (e) {}
}
// hooks the game calls (09-game): a run starting, a stage cleared, a life lost, game over
function teleRunStart() {
  TELE.runStart = TELE.stageStart = Date.now();
  TELE.deaths = TELE.lives = 0;
}
function telePos() {
  const p = G.p,
    ch = v => PATH_ABC[Math.max(0, Math.min(63, Math.round(v)))];
  return p ? ch(p.x / T) + ch(p.y / T) : '';
}
function teleTick() {
  // every frame of play: the stage's first frame logs its start (by now any dev jump has marked the run); then once a second, where he is
  const st = G.st;
  if (!st || HEADLESS) return;
  if (!st.logged) {
    st.logged = true;
    st.path = '';
    TELE.stageStart = Date.now();
    tele('go', { label: stageId(), score: G.score, lives: G.lives, horns: G.p ? G.p.horns : 0, enemies: stageRoster().join(',') });
  }
  TELE.aliveF = (TELE.aliveF || 0) + 1;
  if (st.f % 60 === 1 && st.path.length < 1200) st.path += telePos();
}
function teleStage() {
  // what the stage looked like so far (cleared, or where you quit)
  const st = G.st || {};
  return {
    label: stageId(),
    play: Math.round((st.f || 0) / 60),
    horns: st.horns || 0,
    stuns: st.stuns || 0,
    rush: st.rush || 0,
    bash: st.bash || 0,
    pauses: st.pauses || 0,
    input: INPUT_SRC,
    path: st.path || ''
  };
}
function teleStageClear() {
  const st = G.st || {};
  tele(
    'stage',
    Object.assign(teleStage(), {
      stage: stageReached(),
      score: G.score,
      secs: Math.round((Date.now() - TELE.stageStart) / 1000),
      deaths: TELE.deaths,
      lives: G.lives,
      // the same numbers the bots report (Chris 2026-11-08), so real play and the bot runs can be compared
      points: st.total || 0,
      combo: st.combo || 0,
      riders: st.riders || 0,
      squash: st.squash || 0,
      drop: st.drop || 0,
      hornsLeft: st.hornsLeft || 0,
      time: st.delta || 0
    })
  );
  TELE.stageStart = Date.now();
  TELE.deaths = 0;
}
function teleDeath() {
  TELE.deaths++;
  const p = G.p || {},
    st = G.st || {},
    e = G.enemies.find(e => e.type === G.killedBy && Math.abs(e.x - p.x) < 12 && Math.abs(e.y - p.y) < 12);
  tele('death', {
    stage: stageReached(),
    label: stageId(),
    score: G.score,
    by: G.killedBy || '',
    pos: telePos(), // where he was (column, row)
    ladder: !!p.climb,
    secs: Math.round((st.f || 0) / 60), // into the stage
    alive: Math.round((TELE.aliveF || 0) / 60), // seconds of play since he (re)appeared
    lives: G.lives, // before this one comes off
    horns: p.horns || 0,
    loaded: G.pieces.filter(pc => pc.state === 'plate').length + '/' + G.pieces.filter(pc => !pc.gold).length,
    enemies: G.enemies.length,
    mode: (e && e.mode) || '', // what it was doing: patrol, wind, charge, dive...
    last: (st.path || '').slice(-16)
  });
}
function teleLife() {
  TELE.lives++;
  tele('life', { label: G.p ? stageId() : '', score: G.score, lives: G.lives });
}
function teleQuit() {
  tele(
    'quit',
    Object.assign(teleStage(), {
      stage: stageReached(),
      score: G.score,
      lives: G.lives,
      secs: Math.round((Date.now() - TELE.runStart) / 1000)
    })
  );
}
function teleGameOver() {
  tele('gameover', {
    stage: stageReached(),
    label: stageId(),
    score: G.score,
    secs: Math.round((Date.now() - TELE.runStart) / 1000),
    earned: TELE.lives
  });
}
