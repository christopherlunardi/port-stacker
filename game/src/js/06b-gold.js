// ---------- the power crate: the power-up (Chris 2026-11-09) ----------
// Once a stage, when the ship is half loaded, the crane lowers a container with a magical holographic shine onto a random free slot
// on a catwalk. It's a full container and works like any other: walk across its panels and it drops, enemies on it ride it down
// (and send it further), it knocks down a container it lands on, it squashes anyone under it. But wherever it ends up it shatters,
// and the power-up starts: POWER RUSH, a few seconds where Buck shines the same way, runs quicker, can't be hurt and flattens any
// enemy he touches (each one points and a combo move). It isn't part of the ship's load. Left alone too long, the crane lifts it away
// again. Not on 1-1 (learn the basics first); the same from 1-2 on, overtime included. (Internally it's still called the gold crate.)
const GOLD = {
  lower: 90, // frames the crane takes to lower it
  wait: 720, // frames it waits, untouched, before the crane takes it back (it blinks for the last 120)
  lift: 60,
  power: 600, // POWER RUSH: 10 seconds (Chris 2026-11-09: 6 wasn't quite long enough)
  speed: 1.45, // and Buck runs this much quicker (Chris 2026-11-10: a tiny bit more, was 1.35)
  bashPts: 1000 // the first enemy flattened in a rush; each one after it in the same rush is worth 1,000 more (Chris 2026-11-09: a rampage
  // should build up): 1,000, 2,000, 3,000... times its worth (like squashes), and times the combo
};
const goldPiece = () => G.pieces.find(pc => pc.gold);
function goldDue() {
  if (G.goldDone || !L || G.state !== 'play' || stagesBefore(G.loop) + G.level < 1) return false;
  const load = G.pieces.filter(pc => !pc.gold),
    plated = load.filter(pc => pc.state === 'plate').length;
  return load.length > 0 && plated >= Math.ceil(load.length / 2);
}
function goldSpots() {
  // the free container slots: a bay's columns on a catwalk that holds a container there, with nothing resting in it now, away from Buck
  const out = [];
  for (const c of L.def.plates)
    for (const r of [...new Set(L.def.floors.map(f => f[0]))]) {
      if (!hasFloor(r, c + 2) || !hasFloor(r, c + PIECE_W - 3)) continue;
      const y = rowY(r);
      if (G.pieces.some(pc => pc.c === c && pc.row === r && pc.state !== 'plate')) continue;
      // (2026-11-10) nor where a falling container is about to land
      if (G.pieces.some(pc => pc.c === c && pc.state === 'fall' && pc.target && pc.target.kind === 'floor' && pc.target.row === r))
        continue;
      if (Math.abs(G.p.y - y) < 4 && G.p.x > c * T - 24 && G.p.x < (c + PIECE_W) * T + 24) continue;
      out.push({ c, r });
    }
  return out;
}
function updateGold() {
  const p = G.p;
  if (p.gold === 180 || p.gold === 120 || p.gold === 60) SFX.rushCount(p.gold / 60); // the countdown's beeps (drawRushCount)
  if (p.gold > 0 && --p.gold === 0) SFX.goldEnd();
  // where he's been, for the rainbow trail (HOLO_BUCK.trail): every 4 frames, the last 4, oldest last
  if (p.gold > 0) {
    if (G.frame % 4 === 0) (p.trail = p.trail || []).unshift([p.x, p.y]), (p.trail.length = Math.min(p.trail.length, 4));
  } else p.trail = null;
  // (Chris 2026-11-09) the combo lasts as long as the rainbow does: its window stays full, and after it runs out you get a full window
  if (p.gold > 0 && G.combo > 0 && G.comboT > 0) G.comboT = G.comboWin = comboWindow(comboMult());
  if (!goldPiece() && goldDue()) {
    G.goldDone = true;
    const spots = goldSpots();
    if (spots.length) {
      const s = spots[Math.floor(rand() * spots.length)];
      G.pieces.push({
        type: 'yel', // only the shape: the foil covers its colour
        c: s.c,
        x: s.c * T,
        row: s.r,
        y: -30,
        segs: new Array(PANELS).fill(0),
        state: 'lower',
        t: 0,
        vy: 0,
        riders: [],
        extra: 0,
        bounce: 0,
        target: null,
        gold: true
      });
      SFX.goldArrive();
      tele('crate', { what: 'in', label: stageId(), loaded: G.pieces.filter(pc => pc.state === 'plate').length });
    }
  }
  const g = goldPiece();
  if (!g) return;
  g.t = (g.t || 0) + 1;
  const home = rowY(g.row);
  if (g.state === 'lower') {
    g.y = -30 + (home + 30) * (1 - Math.pow(1 - Math.min(1, g.t / GOLD.lower), 2.2));
    if (g.t >= GOLD.lower) {
      g.y = home;
      g.state = 'rest';
      g.t = 0;
      g.bounce = 8;
      SFX.land();
    }
  } else if (g.state === 'rest' && g.t >= GOLD.wait && !g.segs.some(Boolean)) {
    g.state = 'lift';
    g.t = 0;
  } else if (g.state === 'lift') {
    g.y = home - (home + 34) * Math.pow(Math.min(1, g.t / GOLD.lift), 1.6);
    if (g.t >= GOLD.lift) {
      G.pieces = G.pieces.filter(pc => pc !== g);
      tele('crate', { what: 'away', label: stageId() }); // left too long: the crane took it back
    }
  }
  if (g.state === 'gone') G.pieces = G.pieces.filter(pc => pc !== g);
}
function goldBreak(pc) {
  // it landed where it was going: it shatters, and the power-up starts
  pc.state = 'gone';
  const cx = pc.x + (PIECE_W * T) / 2,
    cy = pc.y - PIECEDEF[pc.type].h / 2;
  G.goldBits = Array.from({ length: 26 }, (_, i) => {
    const a = (i / 26) * Math.PI * 2 + rand() * 0.3;
    return {
      x: cx + Math.cos(a) * 14,
      y: cy + Math.sin(a) * 4,
      vx: Math.cos(a) * (1 + rand() * 2),
      vy: -1.8 - rand() * 2.4 + Math.sin(a),
      r: rand() * 6,
      t: 50 + Math.floor(rand() * 25),
      type: pc.type
    };
  });
  G.goldFlash = { x: cx, y: cy, t: 30 };
  G.shake = 10;
  if (!pc.powered) goldStart(); // (it started when it dropped)
}
function goldStart() {
  // (2026-11-10) knocked down while Buck is dying: the rush waits for him to come back
  if (G.state === 'dying') {
    G.rushWait = true;
    return;
  }
  G.p.gold = G.p.goldMax = Math.round(GOLD.power / buckSpeed()); // shorter as Buck gets quicker in overtime (buckSpeed)
  G.p.bashN = 0;
  if (G.st) G.st.rush = (G.st.rush || 0) + 1;
  tele('crate', { what: 'rush', label: stageId(), score: G.score });
  G.banner = { text: 'POWER RUSH!', t: 90 };
  SFX.goldRush();
}
function goldBash(e) {
  // Buck in POWER RUSH runs into an enemy: flattened, points and a combo move
  launchEnemy(e);
  killEnemy(e);
  if (G.st) G.st.squash++, (G.st.bash = (G.st.bash || 0) + 1);
  const n = (G.p.bashN = (G.p.bashN || 0) + 1);
  addScore(worthPts(GOLD.bashPts * n, enemyWorth(e)), e.x, e.y - 14, n > 1 ? 'BASH X' + n : 'BASH');
  SFX.launch();
  G.shake = Math.max(G.shake || 0, 4);
}
function goldBashes() {
  const p = G.p;
  if (!(p.gold > 0)) return false;
  for (const e of G.enemies.slice())
    if ((e.state === 'walk' || e.state === 'stun') && Math.abs(e.x - p.x) < 11 && Math.abs(e.y - p.y) < 12) goldBash(e);
  return true;
}
// the music hurries along while it lasts (every frame, so a death, a cleared stage or the title always puts it back)
const RAG_BPM = RAG.bpm;
function goldMusic() {
  RAG.bpm = G.p && G.p.gold > 0 && (G.state === 'play' || G.state === 'howto') ? Math.round(RAG_BPM * 1.3) : RAG_BPM;
  if (musicGain && musRush() !== !!mus.rush) musicTick(); // switch the sound this frame, not at the next tick
}
// (Chris 2026-11-09: like Smash Bros at a high percentage) a bashed enemy goes flying: knocked up and away from Buck, spinning, with a
// rainbow trail, and when he leaves the screen there's a twinkle at the edge where he went
const KO_T = 15; // frames the flash lasts where he leaves the screen
function launchEnemy(e) {
  const dir = Math.sign(e.x - G.p.x) || G.p.face || 1;
  (G.launched = G.launched || []).push({
    e: Object.assign({}, e, { state: 'stun', dy: 0, dx: -dir }),
    x: e.x,
    y: e.y,
    vx: dir * (4.2 + rand() * 1.2),
    vy: -4.6 - rand() * 1.2,
    rot: 0,
    vr: dir * (0.32 + rand() * 0.12),
    trail: []
  });
}
function updateLaunched() {
  for (const l of G.launched || []) {
    l.trail.unshift([l.x, l.y - 10]);
    if (l.trail.length > 16) l.trail.pop();
    l.x += l.vx;
    l.y += l.vy;
    l.vy += 0.06;
    l.rot += l.vr;
    if (!l.gone && (l.x < -12 || l.x > PW + 12 || l.y < FY - 14 || l.y > PH + 30)) {
      l.gone = 20;
      (G.koStars = G.koStars || []).push({
        x: Math.max(6, Math.min(PW - 6, l.x)),
        y: Math.max(FY + 6, Math.min(PH - 6, l.y - 10)),
        t: KO_T
      });
      SFX.ko();
    }
    if (l.gone) l.gone--, l.trail.pop(); // off the screen: its trail follows it out
  }
  G.launched = (G.launched || []).filter(l => l.gone !== 0 && (l.gone == null || l.trail.length > 0));
  for (const k of G.koStars || []) k.t--;
  G.koStars = (G.koStars || []).filter(k => k.t > 0);
}
// the shatter's shards and flash move here, in the game's update (2026-11-10: moved out of the drawing, which ran twice as fast on the
// Pocket 6's 120 Hz screen)
function goldFxTick() {
  if (!(G.state === 'play' || G.state === 'howto')) return;
  const fl = G.goldFlash;
  if (fl && fl.t > 0) fl.t--;
  for (const b of G.goldBits || []) {
    b.x += b.vx;
    b.y += b.vy;
    b.vy += 0.15;
    b.r += 0.2;
    b.t--;
  }
  if (G.goldBits) G.goldBits = G.goldBits.filter(b => b.t > 0);
}
