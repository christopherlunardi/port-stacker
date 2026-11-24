// ---------- extra lives are delivered (Chris 2026-11-24: lives came too easily; a good run went on and on) ----------
// Filling the life bar no longer gives the life by itself: the crane lowers a crate somewhere on the stage, well away from Buck; it
// bursts open into a little Buck (the lives counter's icon) with 1UP over him, and he has LIFE_DROP.secs to go and get it. Grab it: the
// life. Too slow: the crane takes it back and the life is gone. So each extra life is a detour through the enemies that a player can go
// for or let go. One at a time: a life earned while one is out (or on the SHIP LOADED card, or while Buck is down) waits in G.lifeOwed
// and comes down a moment into play. One still out when the ship is loaded comes back next stage, its clock fresh. Overtime gives it
// less time. (The delivery is the crane's, like the old horn refill: drawDelivery in 10-render.js.)
const LIFE_DROP = { secs: 8, otSecs: 7, wait: 75, reach: [8, 6], leave: 36, arrive: 48 };
function lifeDropTime() {
  return 60 * (heat() ? LIFE_DROP.otSecs : LIFE_DROP.secs);
}
// addScore found the life bar full (09-game.js)
function lifeEarned() {
  G.lifeOwed = (G.lifeOwed || 0) + 1;
  G.lifeFlash = 40; // the life bar flashes full
  SFX.oneup();
}
// where it comes down: a walkable spot on a floor, chosen at random from the far half of them (by how long a walk it is: across, plus
// the floors between counted heavier, as that's ladders), never on a ladder's top or foot
function lifeDropSpot() {
  const p = G.p,
    spots = [];
  for (const [r, a, b] of L.def.floors) {
    if (r >= PLATE_ROW) continue;
    for (let c = a + 3; c <= b - 3; c++) {
      // (not right at a catwalk's end, against the frame)
      const x = c * T + 4,
        y = rowY(r);
      if (L.ladders.some(l => Math.abs(l.x - x) < 6 && (l.top === y || l.bot === y))) continue;
      if (G.pieces.some(pc => pc.state === 'rest' && pc.row === r && c >= pc.c - 1 && c <= pc.c + PIECE_W)) continue; // (not on a container: it'd be hidden, and walking there knocks it down)
      spots.push({ x, y, d: Math.abs(x - p.x) + 2.5 * Math.abs(y - p.y) });
    }
  }
  if (!spots.length) return null;
  spots.sort((s, t) => t.d - s.d);
  const far = spots.slice(0, Math.max(1, Math.ceil(spots.length / 2)));
  return far[Math.floor(rand() * far.length)];
}
function updateLifeDrop() {
  const p = G.p;
  const d = G.lifeDrop;
  if (!d) {
    if (G.lifeOwed > 0 && G.st && G.st.f >= LIFE_DROP.wait) {
      const s = lifeDropSpot();
      if (s) G.lifeDrop = { x: s.x, y: s.y, t: lifeDropTime(), age: 0, gone: 0 };
    }
    return;
  }
  d.age++;
  if (d.age === LIFE_DROP.arrive) SFX.pickupArrive();
  if (d.gone) {
    if (++d.gone > LIFE_DROP.leave) G.lifeDrop = null;
    return;
  }
  if (d.age < LIFE_DROP.arrive) return; // still coming down
  if (Math.abs(d.x - p.x) < LIFE_DROP.reach[0] && Math.abs(d.y - p.y) < LIFE_DROP.reach[1]) {
    G.lifeDrop = null;
    G.lifeOwed--;
    G.lives++;
    G.lifeFlash = 40;
    SFX.oneup();
    teleLife();
    addPop(d.x, d.y - 26, '1UP!', 'pink');
    return;
  }
  if (--d.t <= 0) {
    d.gone = 1;
    G.lifeOwed--;
    SFX.pickup(); // (it goes back up)
    addPop(d.x, d.y - 20, 'MISSED IT', 'cream');
    tele('lifemiss', { label: stageId(), score: G.score, lives: G.lives });
  }
}
// a new stage (09-game.js buildStage): one still out simply comes down again (its life is still owed)
function lifeDropReset() {
  G.lifeDrop = null;
}
// the crate comes down on the crane's line, bursts open in stars, and there's the little Buck with 1UP, bobbing in a pink glow; a
// shrinking arc shows the time left, and it blinks in its last two seconds; missed, the crane lifts it back up and away
function drawLifeDrop() {
  const d = G.lifeDrop;
  if (!d) return;
  const a = d.age;
  if (d.gone) {
    // back up on the line
    const y = d.y - 9 - d.gone * d.gone * 0.12;
    pg.beginPath();
    pg.moveTo(d.x, 22);
    pg.lineTo(d.x, y - 8);
    pg.lineWidth = 0.8;
    pg.strokeStyle = ink(C.indigo);
    pg.stroke();
    pg.save();
    pg.globalAlpha = Math.max(0, 1 - d.gone / LIFE_DROP.leave);
    art('buck.stand', d.x, y + 10, { scale: 0.55 });
    pg.restore();
    return;
  }
  if (!drawDelivery(d.x, d.y, a, LIFE_DROP.arrive, C.pink)) return;
  if (a < LIFE_DROP.arrive + 12) {
    const t = a - LIFE_DROP.arrive;
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * 6.283;
      glyphStar(d.x + Math.cos(ang) * t * 1.2, d.y - 6 + Math.sin(ang) * t * 0.9, 2.2 - t * 0.12, i & 1 ? C.yel : C.cream);
    }
  }
  if (d.t < 120 && (d.t >> 3) & 1) return;
  const bob = Math.sin(G.frame * 0.12) * 1.2,
    pop = a < LIFE_DROP.arrive + 12 ? 0.5 + ((a - LIFE_DROP.arrive) / 12) * 0.5 : 1,
    cy = d.y - 9 + bob;
  glowAt(d.x, cy, 16, C.pink, 0.55);
  if (NIGHT()) nightGlow(d.x, cy, 16, C.pink, 0.55);
  art('buck.stand', d.x, cy + 10 * pop, { scale: 0.55 * pop });
  textF(FONT_MAIN, '1UP', d.x, cy - 15 * pop, 8 * pop, C.pink, 'center', C.indigo);
  // time left
  pg.lineWidth = 1.2;
  pg.strokeStyle = ink(C.yel);
  pg.beginPath();
  pg.arc(d.x, cy, 14, -1.571, -1.571 + 6.283 * (d.t / lifeDropTime()));
  pg.stroke();
}
