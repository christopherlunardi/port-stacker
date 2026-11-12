// ---------- the characters: the crab, Pratt, Buck (and his death fall), the horn blast; drawn symbols (triangles, stars) ----------
function drawCrabSpawn(e) {
  // the crab's entrance (e.t counts down from 46): falling from the top of the screen, then landing with a squash and two puffs of dust
  const k = 1 - e.t / 46;
  if (k < 0.45) {
    const f = k / 0.45;
    art('crab.charge', e.x, e.y - 160 * (1 - f * f), { flip: e.dx < 0 });
    return;
  }
  const s = k < 0.6 ? 1 - Math.sin(((k - 0.45) / 0.15) * Math.PI) * 0.35 : 1;
  art('crab.scuttle1', e.x, e.y, { flip: e.dx < 0, sy: s, sx: 2 - s });
  for (const d of [-1, 1]) {
    const t = (k - 0.45) * 46;
    pg.globalAlpha = Math.max(0, 1 - t / 18);
    pg.beginPath();
    pg.arc(e.x + d * (6 + t * 0.6), e.y - 2 - t * 0.15, 2 + t * 0.12, 0, 7);
    pg.fillStyle = ink(C.cream);
    pg.fill();
    pg.globalAlpha = 1;
  }
}
// the Gull's frames (ChatGPT sheet r2, 2026-11-09) shifted so his beak stays in one place as the wings move (and his body as he walks):
// field px, measured from the art; flipped with him when he faces left
const GULL_ALIGN = {
  glide: [0, 0],
  upA: [-1.99, 1.03],
  upB: [-3.29, 1.1],
  downA: [-2.13, 1.21],
  downB: [-1.85, 5.38],
  walk1: [-0.91, 0],
  walk2: [0.37, 0],
  walk3: [-0.45, 0]
};
const GULL_BEAT = ['glide', 'upA', 'upB', 'upA', 'glide', 'downA', 'downB', 'downA']; // one gentle wingbeat
function gullArt(n, e, oy, o) {
  const [ax, ay] = GULL_ALIGN[n] || [0, 0],
    d = e.dx < 0 ? -1 : 1;
  art('gull.' + n, e.x + ax * d, e.y + ay + (oy || 0), Object.assign({ flip: d < 0 }, o || {}));
}
function drawGull(e) {
  // flying: mostly gliding, with a slow gentle wingbeat every so often (steadily while climbing); diving beak first; braking with his
  // wings spread as he lands; crouched for a moment before take-off; strutting on the catwalk with a real walk; dizzy; flat
  const a = e.anim || 0,
    d = e.dx < 0 ? -1 : 1;
  if (e.state === 'stun') art('gull.dizzy', e.x, e.y, { flip: d < 0, sx: 1 + Math.sin(G.frame * 0.3) * 0.04 });
  else if (e.mode === 'dive') {
    const near = e.ty != null && e.ty - e.y < 14; // about to touch down: brake
    art(near ? 'gull.land' : 'gull.dive', e.x, e.y + (near ? 0 : 4), { flip: d < 0 });
  } else if (e.mode === 'land') {
    if (e.mt < 14) art('gull.takeoff', e.x, e.y, { flip: d < 0 });
    else if (e.landT != null && e.landT < 10) art('gull.land', e.x, e.y, { flip: d < 0 });
    else if (e.moving) {
      const step = ['walk1', 'walk2', 'walk3', 'walk2'][((e.dist || 0) / 4) & 3];
      gullArt(step, e, step === 'walk2' ? -0.6 : 0);
    } else art('gull.stand', e.x, e.y, { flip: d < 0 });
  } else {
    const rising = e.mode === 'rise',
      per = rising ? 5 : 6,
      cyc = rising ? a % (per * 8) : a % 170,
      beating = cyc < per * 8,
      fr = beating ? GULL_BEAT[Math.floor(cyc / per)] : 'glide',
      bob = Math.sin(a * 0.045) * 1.2;
    gullArt(fr, e, -bob, { rot: (rising ? -0.15 : Math.sin(a * 0.025) * 0.04) * d });
  }
}
function drawFork(e) {
  // the Forklift (ChatGPT art, 2026-11-09): drives with a bounce, revs (shaking, smoke, flashing beacon), charges, stalls dizzy
  const d = e.dist || 0,
    f = { flip: e.dx < 0 };
  if (e.state === 'spawn') {
    const k = 1 - e.t / 46;
    if (k < 0.45) {
      const q = k / 0.45;
      art('forklift.drive1', e.x, e.y - 160 * (1 - q * q), f);
      return;
    }
    const s = k < 0.6 ? 1 - Math.sin(((k - 0.45) / 0.15) * Math.PI) * 0.3 : 1;
    art('forklift.drive1', e.x, e.y, Object.assign({ sy: s, sx: 2 - s }, f));
    return;
  }
  if (e.state === 'stun') art('forklift.dizzy', e.x, e.y, Object.assign({ sx: 1 + Math.sin(G.frame * 0.3) * 0.03 }, f));
  else if (e.mode === 'wind') art('forklift.rev', e.x + Math.sin(G.frame * 2.1) * 0.9, e.y - Math.abs(Math.sin(G.frame * 0.9)) * 0.6, f);
  else if (e.mode === 'charge') art('forklift.charge', e.x, e.y, Object.assign({ sx: 1.05, sy: 0.96 }, f));
  else if (e.mode === 'rest') art('forklift.drive1', e.x, e.y, f);
  else art('forklift.drive' + (1 + (((d / 5) | 0) & 1)), e.x, e.y, f);
  if (e.mode === 'wind') text('!', e.x, e.y - 30, 9, C.yel, 'center', C.indigo);
}
function drawCrab(e) {
  // the Captain, the catwalk guard (ChatGPT art, 2026-11-08; was Pinch): scuttles, winds up shaking, charges, gets dizzy
  if (ART['crab.scuttle1']) {
    const d = e.dist || 0,
      sp = e.state === 'spawn';
    if (sp) {
      drawCrabSpawn(e);
      return;
    }
    if (e.state === 'stun') art('crab.dizzy', e.x, e.y, { flip: e.dx < 0, sx: 1 + Math.sin(G.frame * 0.3) * 0.04 });
    else if (e.mode === 'wind') art('crab.wind', e.x + Math.sin(G.frame * 1.7) * 0.8, e.y, { flip: e.dx < 0 });
    else if (e.mode === 'charge') art('crab.charge', e.x, e.y, { flip: e.dx < 0, sx: 1.06, sy: 0.95 });
    else if (e.mode === 'rest') art('crab.scuttle1', e.x, e.y, { flip: e.dx < 0, sy: 1 + Math.sin(G.frame * 0.15) * 0.03 });
    else art('crab.scuttle' + (1 + (((d / 6) | 0) & 1)), e.x, e.y - (((d / 6) | 0) & 1) * 0.8, { flip: e.dx < 0 }); // two real scuttle frames, one per 6px walked
    if (e.mode === 'wind') text('!', e.x, e.y - 24, 9, C.yel, 'center', C.indigo);
    return;
  }
  // (the code-drawn crab below is only used if the art is missing)
  const d = e.dist || 0,
    wind = e.mode === 'wind',
    shake = wind ? Math.sin(G.frame * 1.7) * 0.8 : 0,
    x = e.x + shake,
    y = e.y,
    f = e.dx < 0 ? -1 : 1;
  const stun = e.state === 'stun',
    spawn = e.state === 'spawn';
  if (spawn && !((e.t >> 2) & 1)) return;
  pg.save();
  pg.translate(x, y);
  pg.scale(f, 1);
  if (spawn) pg.globalAlpha = 0.5;
  pg.lineWidth = 0.9;
  pg.strokeStyle = ink(C.indigo);
  pg.lineCap = 'round';
  for (let i = 0; i < 3; i++)
    for (const s of [-1, 1]) {
      const ph = d * 0.6 + i * 2 + (s > 0 ? 3 : 0),
        lx = s * (4 + i * 2.6); // legs
      pg.beginPath();
      pg.moveTo(lx * 0.6, -4);
      pg.lineTo(lx + s * 1.5, -5 + Math.sin(ph) * 0.8);
      pg.lineTo(lx + s * 2.5, 0);
      pg.stroke();
    }
  const body = stun ? C.pinkL : C.pink;
  pg.beginPath();
  pg.ellipse(0, -6.5, 9, 5.2, 0, 0, 7);
  pg.fillStyle = ink(body);
  pg.fill();
  pg.lineWidth = 1.1;
  pg.stroke();
  pg.beginPath();
  pg.ellipse(-2, -8.5, 4, 1.4, 0, 0, 7);
  pg.fillStyle = ink(C.pinkL);
  pg.fill();
  const clawUp = wind ? 3 : e.mode === 'charge' ? -1 : Math.sin(d * 0.25) * 0.8;
  for (const s of [-1, 1]) {
    const cx = s * 10 + (e.mode === 'charge' && s > 0 ? 3 : 0),
      cy = -10 - clawUp; // claws
    pg.beginPath();
    pg.moveTo(s * 6, -7);
    pg.lineTo(cx, cy + 2);
    pg.lineWidth = 1.4;
    pg.stroke();
    pg.beginPath();
    pg.ellipse(cx, cy, 3.4, 2.6, s * 0.4, 0, 7);
    pg.fillStyle = ink(body);
    pg.fill();
    pg.lineWidth = 1;
    pg.stroke();
    pg.beginPath();
    pg.moveTo(cx + s * 1, cy - 0.5);
    pg.lineTo(cx + s * 3.4, cy - 0.3);
    pg.stroke();
  }
  for (const s of [-1.6, 1.6]) {
    pg.beginPath();
    pg.moveTo(s, -10.5);
    pg.lineTo(s * 1.3, -14);
    pg.lineWidth = 0.9;
    pg.stroke(); // eyes on stalks
    pg.beginPath();
    pg.arc(s * 1.3, -15, 1.8, 0, 7);
    pg.fillStyle = ink(C.cream);
    pg.fill();
    pg.stroke();
    pg.beginPath();
    pg.arc(s * 1.3 + (stun ? 0 : 0.6), -15, stun ? 0.5 : 0.8, 0, 7);
    pg.fillStyle = ink(C.indigo);
    pg.fill();
  }
  pg.lineWidth = 0.8;
  pg.beginPath();
  if (stun) {
    pg.arc(1, -5.5, 1.5, 0, 7);
  } else {
    pg.moveTo(-1.5, -5);
    pg.lineTo(0.5, -4.3);
    pg.lineTo(2.5, -5);
  }
  pg.stroke();
  pg.restore();
  if (wind) text('!', e.x, e.y - 22, 9, C.yel, 'center', C.indigo);
  if (stun)
    for (let k = 0; k < 3; k++) {
      const a = G.frame * 0.15 + k * 2.1;
      glyphStar(e.x + Math.cos(a) * 7, e.y - 20 + Math.sin(a) * 2, 2.25, C.yel);
    }
}
// each walker's art (the Night Watchman's from ChatGPT, 2026-11-08)
const LOOKS = {
  pratt: { walk: 'prattwalk.w', idle: 'pratt.stomp1', climb: 'pratt.climb', dizzy: 'pratt.dizzy', spot: 'pratt.stomp1' },
  watch: { walk: 'watch.w', idle: 'watch.w2', climb: 'watch.climb', dizzy: 'watch.dizzy', spot: 'watch.spot', torch: true }
};
function climbArt(name, x, y, d, moving) {
  // climbing a ladder: a bob from rung to rung, swapping hands every 9px climbed. With a second climbing picture (name + '2', e.g.
  // buck.climb2) it swaps between the two; without one it mirrors the one (which moves anything worn on one hip to the other side)
  const alt = (((d / 9) | 0) & 1) === 1,
    by = moving ? Math.abs(Math.sin(d * 0.2)) * 1.2 : 0;
  if (ART[name + '2']) art(alt ? name + '2' : name, x, y - by);
  else art(name, x, y - by, { flip: alt });
}
function drawFlashlight(e, dir, a) {
  // the Watchman's torch: a cone of light ahead of him at chest height (a light, so it glows at night). It reaches as far as he can spot
  // you (WATCH.beam), and burns brighter while you're in it and he's running (Chris 2026-11-11)
  const x = e.x + dir * 9,
    y = e.y - 16,
    len = WATCH.beam - 9,
    on = e.spotT > 0;
  pg.save();
  pg.globalAlpha = on ? Math.min(0.62, a * 1.9) : a;
  pg.beginPath();
  pg.moveTo(x, y - 1);
  pg.lineTo(x + dir * len, y - 10);
  pg.lineTo(x + dir * len, y + 12);
  pg.lineTo(x, y + 1);
  pg.closePath();
  pg.fillStyle = ink(C.yel);
  pg.fill();
  pg.restore();
  if (NIGHT()) nightGlow(x + dir * 4, y, 10, C.yel, 0.45);
}
function drawEnemy(e) {
  if (e.type === 'gull' && ART['gull.glide']) {
    drawGull(e);
    return;
  }
  if (e.type === 'fork' && ART['forklift.drive1']) {
    drawFork(e);
    return;
  }
  if (e.type === 'crab') {
    drawCrab(e);
    return;
  }
  const look = LOOKS[e.type] || LOOKS.pratt,
    climbing = e.dy !== 0; // on a ladder (keep the climbing pose while passing catwalks)
  if (e.state === 'spawn') {
    if (e.door >= 0) art(look.idle, e.x, e.y, { flip: e.dx < 0 });
    else if ((e.t >> 2) & 1) art(look.idle, e.x, e.y, { flip: e.dx < 0, alpha: 0.5 });
    return;
  }
  if (e.state === 'stun') {
    art(look.dizzy, e.x, e.y, { sx: 1 + Math.sin(G.frame * 0.3) * 0.04 });
    return;
  }
  const wob = e.state === 'ride' ? Math.sin(G.frame * 0.8) * 0.08 : 0,
    d = e.dist || 0; // steps follow the distance walked, so feet don't slide
  if (climbing) {
    climbArt(look.climb, e.x, e.y, d, true);
    return;
  }
  if (e.turnT > 0 && e.turnT > WATCH.turn / 2) {
    // the Watchman has spotted you behind him: looking back over his shoulder, torch swinging round
    art(look.spot, e.x, e.y, { flip: e.dx < 0 });
    return;
  }
  const dir = e.turnT > 0 ? -e.dx : e.dx;
  if (look.torch) drawFlashlight(e, dir, 0.32);
  art(look.walk + (1 + (((d / 6) | 0) % 4)), e.x, e.y, { flip: dir < 0, rot: wob }); // the 4-frame walk cycle, one frame per 6px walked
  if (DEV.hitboxes) {
    pg.strokeStyle = ink(C.pink);
    pg.lineWidth = 0.5;
    pg.strokeRect(e.x - 9, e.y - 10, 18, 10);
  }
}
// Symbols are drawn, never typed: phones swap characters like a triangle or a star for their own emoji-style ones (Chris 2026-11-07).
function glyphTri(x, y, r, dir, col) {
  const pts = {
    right: [
      [-0.8, -1],
      [1, 0],
      [-0.8, 1]
    ],
    left: [
      [0.8, -1],
      [-1, 0],
      [0.8, 1]
    ],
    up: [
      [-1, 0.8],
      [0, -1],
      [1, 0.8]
    ],
    down: [
      [-1, -0.8],
      [0, 1],
      [1, -0.8]
    ]
  }[dir];
  pg.beginPath();
  pts.forEach(([a, b], i) => pg[i ? 'lineTo' : 'moveTo'](x + a * r, y + b * r));
  pg.closePath();
  pg.fillStyle = ink(col);
  pg.fill();
  pg.lineWidth = Math.max(0.8, r * 0.3);
  pg.lineJoin = 'round';
  pg.strokeStyle = ink(C.indigo);
  pg.stroke();
}
function glyphStar(x, y, r, col) {
  pg.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5,
      rr = i & 1 ? r * 0.45 : r;
    pg[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  pg.closePath();
  pg.fillStyle = ink(col);
  pg.fill();
  pg.lineWidth = Math.max(0.7, r * 0.28);
  pg.lineJoin = 'round';
  pg.strokeStyle = ink(C.indigo);
  pg.stroke();
}
const CRAB_RED = [255, 0, 217]; // pink + yellow ink, the Captain's shell
let DEATH_STYLE = 'fall'; // Chris's pick (Workshop death round 1, 2026-11-07): the hop-and-fall. // how Buck goes when he's caught: wobble | fall | spinfall | flat | ko (Workshop round death)
function deathStars(x, y, n) {
  for (let k = 0; k < n; k++) {
    const a = G.frame * 0.15 + (k * 6.283) / n;
    glyphStar(x + Math.cos(a) * 9, y + Math.sin(a) * 2.5, 3.15, C.yel);
  }
}
// dying: in the game, or in How to Play's DON'T GET CAUGHT demo (G.howDie); and how long since
function dyingNow() {
  return G.state === 'dying' || (G.state === 'howto' && G.howDie > 0);
}
function dyingT() {
  return G.state === 'dying' ? G.t : G.t - (G.howDieT || 0);
}
function drawDeath() {
  // drawn over the whole stage so a fall can pass in front of the catwalks and the ship
  if (!dyingNow() || DEATH_STYLE === 'wobble') return;
  const p = G.p,
    t = dyingT(),
    dir = p.face < 0 ? -1 : 1;
  if (DEATH_STYLE === 'fall' || DEATH_STYLE === 'spinfall') {
    // a beat of shock, a hop up, then straight down off the bottom of the screen; the hat flies off
    const hurt = ART['buckhurt.hurt'] ? 'buckhurt.hurt' : 'buck.stand',
      bh = (ART[hurt] || { h: 25 }).h,
      k = Math.max(0, t - 14);
    const y = t < 14 ? p.y : p.y - 3.2 * k + 0.11 * k * k,
      jx = t < 14 ? (t & 2 ? 0.7 : -0.7) : 0;
    if (ART['buckhat.hat']) {
      const hy0 = p.y - bh - 1.5 - Math.min(t, 6) * 0.5,
        hx = p.x + jx + dir * 0.7 * k,
        hy = hy0 - 4.4 * k + 0.07 * k * k; // the hat pops up and tumbles away
      if (hy < PH + 20) art('buckhat.hat', hx, hy, { rot: k * 0.16 * dir });
    }
    if (y > PH + 40) return;
    art(hurt, p.x + jx, y, DEATH_STYLE === 'spinfall' ? { rot: k * 0.22 * dir } : t < 14 ? { sx: 1.04, sy: 0.97 } : {});
    return;
  }
  if (DEATH_STYLE === 'flat') {
    // squashed flat as a pancake, stars over him, then he peels up and blinks out
    const k = Math.min(1, t / 8),
      peel = t > 70 ? Math.min(1, (t - 70) / 20) : 0;
    if (t > 90 && (t >> 2) & 1) return;
    art('buck.stand', p.x, p.y, { sx: 1 + k * 0.45 - peel * 0.3, sy: 1 - k * 0.78 + peel * 0.5 });
    if (t > 10) deathStars(p.x, p.y - 10 - peel * 10, 3);
    return;
  }
  if (DEATH_STYLE === 'ko') {
    // sees stars and wobbles, then topples over backwards and lies there
    if (t < 34) {
      art('buck.stand', p.x, p.y, { rot: Math.sin(t * 0.45) * 0.12 });
      deathStars(p.x, p.y - 34, 3);
      return;
    }
    const k = Math.min(1, (t - 34) / 12),
      fall = k * k;
    pg.save();
    pg.translate(p.x - dir * 6, p.y);
    pg.rotate((-dir * fall * Math.PI) / 2);
    art('buck.stand', dir * 6, 0, {});
    pg.restore();
    if (t > 46) deathStars(p.x - dir * 14, p.y - 12, 3);
  }
}
function drawPlayer() {
  const p = G.p;
  if (dyingNow()) {
    if (DEATH_STYLE === 'wobble') {
      const t = Math.min(dyingT(), 40);
      art('buck.climb', p.x, p.y, {
        rot: t * 0.04 * ((dyingT() >> 3) & 1 ? 1 : -1),
        sy: 1 - t * 0.006,
        alpha: (dyingT() >> 2) & 1 ? 0.6 : 1
      });
    }
    return;
  } // the other styles draw on top of everything (drawDeath)
  if (p.inv > 0 && (p.inv >> 2) & 1 && G.state === 'play') return;
  drawGoldAura(p);
  artHolo = p.gold > 0 && (p.gold > 90 || (p.gold >> 2) & 1) ? 1 : 0; // GOLD RUSH: the rainbow edge (blinking as it runs out)
  const walking = G.frame - (p.movedAt || -99) < 4,
    ph = p.anim * 0.32,
    bob = Math.abs(Math.sin(ph)); // one bounce per step
  if (p.hornT > 0) {
    // blowing up or down: his own pictures once ChatGPT's arrive (buck.hornup / buck.horndown), until then the side pose (tipping it looked off balance)
    const vd = p.hornDy || 0,
      own = vd && ART[vd < 0 ? 'buck.hornup' : 'buck.horndown'];
    art(own ? (vd < 0 ? 'buck.hornup' : 'buck.horndown') : 'buck.horn', p.x, p.y, {
      flip: p.face < 0,
      sx: 1 + (p.hornT > 15 ? 0.06 : 0),
      sy: 1 - (p.hornT > 15 ? 0.05 : 0)
    });
  } else if (p.climb) climbArt('buck.climb', p.x, p.y, p.dist || 0, walking);
  else if (p.dash > 0) art('buck.run', p.x, p.y, { flip: p.face < 0, sx: 1.18, sy: 0.9, rot: 0.08 * p.face });
  else if (walking)
    art('buckwalk.w' + (1 + ((((p.dist || 0) / 6) | 0) % 4)), p.x, p.y, { flip: p.face < 0 }); // the 4-frame walk cycle, one frame per 6px walked
  else art(ART['buckside.idle'] ? 'buckside.idle' : 'buck.stand', p.x, p.y, { flip: p.face < 0, sy: 1 + Math.sin(G.frame * 0.06) * 0.012 }); // idle: side-on, facing where the horn will go (Chris 2026-11-07), with a slow breath
  artHolo = 0;
  if (p.dash > 0) {
    pg.globalAlpha = 0.5; // speed streaks behind him: sideways on a catwalk, above or below on a ladder (Chris 2026-11-07)
    if (p.climb)
      for (let k = 1; k < 4; k++)
        rrect(p.x - 6 + k * 3 - 2, p.y - 14 - (p.vdir || -1) * (12 + k * 6) - 1.2, 2.5, 4, 1.2, C.cream, C.indigo, 0.5);
    else for (let k = 1; k < 4; k++) rrect(p.x - p.face * (8 + k * 6) - 2, p.y - 6 - k * 2.5, 4, 2.5, 1.2, C.cream, C.indigo, 0.5);
    pg.globalAlpha = 1;
  }
  if (DEV.hitboxes) {
    pg.strokeStyle = ink(C.blue);
    pg.lineWidth = 0.5;
    pg.strokeRect(p.x - 9, p.y - 10, 18, 10);
  }
}
function drawBlast(c) {
  // the air horn: three arcs spreading the way it was aimed (Chris 2026-11-08, Workshop horn blast r2 B: bolder, with a white glint, so
  // they stand out on the day and the night dock)
  const age = 24 - c.t,
    dir = c.face ? (c.face > 0 ? 0 : Math.PI) : c.dy > 0 ? Math.PI / 2 : -Math.PI / 2;
  const ax = c.face ? c.x - c.face * 8 : c.x,
    ay = c.face ? c.y : c.y - c.dy * 10,
    spread = 0.85,
    w = 2.4;
  // (Chris 2026-11-11) it reaches a little further, and a short way behind him: two small, thin arcs puff out behind (the side blast)
  if (c.face) {
    pg.save();
    pg.translate(c.bx - c.face * 15, ay); // (from his back, so they show clear of him)
    pg.rotate(dir + Math.PI);
    pg.lineCap = 'round';
    pg.globalAlpha = Math.max(0, 1 - age / 20);
    for (let r = 0; r < 2; r++) {
      const rad = 2 + r * 3.5 + age * 0.3;
      pg.beginPath();
      pg.arc(0, 0, rad, -0.6, 0.6);
      pg.lineWidth = 2.2;
      pg.strokeStyle = ink(C.indigo);
      pg.stroke();
      pg.lineWidth = 1.2;
      pg.strokeStyle = ink(r ? C.pink : C.yel);
      pg.stroke();
    }
    pg.restore();
  }
  pg.save();
  pg.translate(ax, ay);
  pg.rotate(dir);
  pg.lineCap = 'round';
  for (let r = 0; r < 3; r++) {
    const rad = 4 + r * 5.5 + age * (c.face ? 0.75 : 0.55);
    pg.beginPath();
    pg.arc(0, 0, rad, -spread, spread);
    pg.lineWidth = w + 1.6;
    pg.strokeStyle = ink(C.indigo);
    pg.stroke();
    pg.lineWidth = w;
    pg.strokeStyle = ink(r === 1 ? C.yel : C.pink);
    pg.stroke();
    pg.lineWidth = w * 0.35;
    pg.strokeStyle = ink(C.cream);
    pg.beginPath();
    pg.arc(0, 0, rad, -spread * 0.6, spread * 0.1);
    pg.stroke();
  }
  pg.restore();
}
// ---------- the power crate and POWER RUSH (06b-gold.js; Chris 2026-11-09: its own crazy holographic colour, which passes to Buck when he
// knocks it down; magical, and the two match) ----------
// The holographic foil: the picture's shape tinted in bands of strong colour (pink, violet, sky, mint, yellow, orange, with pearl white
// between) that slide across it, laid over the picture so its lines still show; a rainbow edge round it (the shape drawn just outside
// in eight directions, each its own colour, the colours turning); light rays turning slowly behind; a pearly glow; sparkles.
// how strong each part of the shine is (Workshop holo-r1 picks): rays behind, the pearly glow, sparkles, how far out the rainbow edge sits,
// and how strong the foil is on the crate and on Buck
// the crate's own (Workshop holo-r1 B "Clean": no rays) and Buck's (Workshop holo-r2), each its own settings: rays behind, the pearly
// glow, sparkles, how far out the rainbow edge sits (0: none), how strong the foil is, wash (the crate is washed pale under its foil so the
// colours come out clean), trail (rainbow copies of Buck left behind him as he runs)
const HOLO_CRATE = { rays: 0, glow: 1, sparkles: 1, rim: 1.8, foil: 0.72, wash: 0.6 };
const HOLO_BUCK = { rays: 0, glow: 1, sparkles: 1, rim: 1.8, foil: 0.38, wash: 0, trail: 0 };
const HOLO_SAT = [
  [255, 0, 0],
  [190, 150, 0],
  [0, 170, 0],
  [0, 0, 0],
  [0, 120, 150],
  [0, 0, 255],
  [150, 0, 255]
];
const HOLO_SOFT = [
  [110, 0, 0],
  [90, 70, 0],
  [0, 95, 0],
  [0, 70, 70],
  [0, 0, 130],
  [80, 0, 110]
];
function holo(t) {
  const n = HOLO_SOFT.length,
    f = ((t % n) + n) % n,
    i = Math.floor(f),
    k = f - i,
    a = HOLO_SOFT[i],
    b = HOLO_SOFT[(i + 1) % n];
  return [0, 1, 2].map(j => Math.round(a[j] + (b[j] - a[j]) * k));
}
const TINT = {};
function tinted(name, im, col) {
  // the picture's shape filled with one ink, made once per colour
  const k = name + '|' + col;
  let c = TINT[k];
  if (!c) {
    c = TINT[k] = document.createElement('canvas');
    c.width = im.naturalWidth || im.width;
    c.height = im.naturalHeight || im.height;
    const x = c.getContext('2d');
    x.drawImage(im, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = ink(col);
    x.fillRect(0, 0, c.width, c.height);
  }
  return c;
}
function holoRim(name, im, x, y, w, h, a, O) {
  const f = Math.floor(G.frame / 3);
  pg.save();
  pg.globalAlpha = a;
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4;
    pg.drawImage(tinted(name, im, HOLO_SAT[(i + f) % HOLO_SAT.length]), x + Math.cos(ang) * O.rim, y + Math.sin(ang) * O.rim, w, h);
  }
  pg.restore();
}
function holoGhost(name, im, x, y, w, h, a, i) {
  // a rainbow copy of him left behind (HOLO_BUCK.trail)
  pg.save();
  pg.globalAlpha = Math.max(0, a);
  pg.drawImage(tinted(name, im, HOLO_SAT[(i * 2 + (G.frame >> 2)) % HOLO_SAT.length]), x, y, w, h);
  pg.restore();
}
function holoFoil(name, im, x, y, w, h, a, O) {
  // diagonal bands of colour sliding across the shape, then a pearl-white sheen sweeping over. full (the crate): washed pale first so
  // the colours come out clean and it's all foil; on Buck lighter, so he still reads
  const n = HOLO_SAT.length,
    band = 7,
    shift = (G.frame * 0.35) % (band * n);
  pg.save();
  if (O.wash) {
    pg.globalAlpha = O.wash * a;
    pg.drawImage(tinted(name, im, C.paper), x, y, w, h);
  }
  for (let i = -1; i < Math.ceil((w + h) / band) + 1; i++) {
    const bx = x - h + i * band + (shift % band),
      ci = (i + Math.floor(shift / band) + n * 50) % n;
    pg.save();
    pg.beginPath();
    pg.moveTo(bx, y + h);
    pg.lineTo(bx + h, y);
    pg.lineTo(bx + h + band, y);
    pg.lineTo(bx + band, y + h);
    pg.closePath();
    pg.clip();
    pg.globalAlpha = O.foil * a;
    pg.drawImage(tinted(name, im, HOLO_SAT[ci]), x, y, w, h);
    pg.restore();
  }
  const sw = ((G.frame * 0.9) % (w + h + 40)) - 20;
  pg.beginPath();
  pg.moveTo(x - h + sw, y + h);
  pg.lineTo(x + sw, y);
  pg.lineTo(x + sw + 5, y);
  pg.lineTo(x - h + sw + 5, y + h);
  pg.closePath();
  pg.clip();
  pg.globalAlpha = 0.8 * a;
  pg.drawImage(tinted(name, im, C.paper), x, y, w, h);
  pg.restore();
}
function holoRays(x, y, len, t, a = 1) {
  pg.save();
  pg.globalAlpha = 0.7 * a;
  for (let i = 0; i < 10; i++) {
    const ang = t + (i * Math.PI) / 5;
    pg.fillStyle = ink(HOLO_SAT[(i * 2 + Math.floor(G.frame / 6)) % HOLO_SAT.length]);
    pg.beginPath();
    pg.moveTo(x, y);
    pg.lineTo(x + Math.cos(ang - 0.08) * len, y + Math.sin(ang - 0.08) * len);
    pg.lineTo(x + Math.cos(ang + 0.08) * len, y + Math.sin(ang + 0.08) * len);
    pg.fill();
  }
  pg.restore();
}
function holoGlow(x, y, r, t, a = 1) {
  for (let i = 0; i < 3; i++) {
    const ang = t * 0.9 + i * 2.09;
    glowAt(x + Math.cos(ang) * r * 0.22, y + Math.sin(ang) * r * 0.16, r, holo(t * 1.7 + i * 2), 0.55 * a);
  }
  glowAt(x, y, r * 0.62, C.paper, 0.6 * a);
}
function sparkle(x, y, s, col, a) {
  if (a <= 0) return;
  pg.save();
  pg.globalAlpha = a;
  pg.fillStyle = ink(col);
  pg.beginPath();
  pg.moveTo(x, y - s);
  pg.quadraticCurveTo(x, y, x + s, y);
  pg.quadraticCurveTo(x, y, x, y + s);
  pg.quadraticCurveTo(x, y, x - s, y);
  pg.quadraticCurveTo(x, y, x, y - s);
  pg.fill();
  pg.restore();
}
function holoAura(x, y, r, a, O = HOLO_CRATE) {
  // what's behind the crate and behind Buck in POWER RUSH: rays, glow, sparkles round about
  const f = G.frame;
  if (O.rays) holoRays(x, y, r * 1.5 * O.rays, f * 0.018, a);
  if (O.glow) holoGlow(x, y, r + Math.sin(f * 0.15) * 1.5, f * 0.035, a * O.glow);
  if (O.sparkles)
    for (let i = 0; i < 5; i++) {
      const ang = f * 0.05 + (i * Math.PI * 2) / 5,
        rr = r * (0.75 + 0.25 * Math.sin(f * 0.11 + i));
      sparkle(
        x + Math.cos(ang) * rr,
        y + Math.sin(ang) * rr * 0.75,
        1.3 + ((f + i * 7) % 16 < 8 ? 1.1 : 0),
        HOLO_SAT[(i * 2 + (f >> 3)) % HOLO_SAT.length],
        a
      );
    }
}
function goldVisible(pc) {
  // it blinks for its last two seconds before the crane takes it back
  return !(pc.state === 'rest' && pc.t > GOLD.wait - 120 && !pc.segs.some(Boolean) && (pc.t >> 3) & 1);
}
function drawGoldBack() {
  // behind the containers: the power crate's aura, and the crane's cable while it's lowered or lifted
  const pc = goldPiece();
  if (!pc || !goldVisible(pc)) return;
  const W = PIECE_W * T,
    H = PIECEDEF[pc.type].h,
    cx = pc.x + W / 2;
  holoAura(cx, pc.y - H / 2, 30, 1);
  if (pc.state === 'lower' || pc.state === 'lift') {
    rect(cx - 0.6, -LAY.oy, 1.2, pc.y - H + LAY.oy - 4, C.indigo);
    rect(cx - 5, pc.y - H - 5, 10, 1.6, C.indigo);
    rect(cx - 0.9, pc.y - H - 5, 1.8, 5, C.indigo);
  }
}
function drawGoldFront() {
  // over everything on the stage: the shards and the flash when it shatters
  const fl = G.goldFlash;
  if (fl && fl.t > 0) {
    holoAura(fl.x, fl.y, 20 + (30 - fl.t) * 1.6, fl.t / 30);
    glowAt(fl.x, fl.y, 10 + (30 - fl.t), C.paper, fl.t / 30);
  }
  if (!G.goldBits || !G.goldBits.length) return;
  for (const b of G.goldBits) {
    pg.save();
    pg.translate(b.x, b.y);
    pg.rotate(b.r);
    pg.globalAlpha = Math.min(1, b.t / 15);
    rect(-2, -1.2, 4, 2.4, HOLO_SAT[(Math.floor(b.r * 2) + (G.frame >> 2)) % HOLO_SAT.length]);
    pg.restore();
  }
}
function drawGoldAura(p) {
  // POWER RUSH: Buck takes on the crate's look (the foil and the edge go on his picture via artHolo in art()), with the same aura behind,
  // and a little meter of what's left over his hat; it blinks as it runs out
  if (!(p.gold > 0)) return;
  const end = p.gold < 90,
    a = end && !((p.gold >> 2) & 1) ? 0.35 : 1;
  holoAura(p.x, p.y - 13, 22, a, HOLO_BUCK);
  const k = p.gold / (p.goldMax || GOLD.power);
  if (p.gold <= RUSH_COUNT) return; // (the last three seconds: the countdown badge takes the meter's place)
  rrect(p.x - 9, p.y - 38, 18, 3, 1.2, C.paper, C.indigo, 0.8);
  rect(p.x - 8.4, p.y - 37.4, 16.8 * k, 1.8, HOLO_SAT[(G.frame >> 2) % HOLO_SAT.length]);
}
// rider and squash pips (Chris's picks, Workshop rider r1 B then r2 A, 2026-11-11: "some indication on a container if there is a guy in front
// of it that can get sent down as a rider", then "on the platform below so they don't take up gameplay area" with "the same thing for
// squashable guys below" in "our blue"): small tags lying on the yellow catwalk under a resting container, pink at its right end with a
// cream dot for each enemy who'd ride it down if it dropped now (wouldRide), blue at its left end for each one anywhere below it
// (enemiesUnder), the newest dot pulsing. Past four ("a little plus for if there gets to be too many", then "4 dots and a plus") it's four dots and a plus, at the growing end.
function pipTag(n, right, x, y, col) {
  const dots = Math.min(n, 4),
    tw = 5 + (n > 4 ? 5 : n) * 4.5,
    tx = right ? x + PIECE_W * T - tw - 2 : x + 2;
  rrect(tx, y - 0.3, tw, 5.6, 2.6, col, C.indigo, 0.8);
  pg.fillStyle = ink(C.cream);
  // each tag grows away from its end of the container (pink leftward, blue rightward), so the newest dot and the plus sit at the growing
  // end (Chris 2026-11-11: "the plus should be on the left for pink and the right for blue")
  const slot = k => (right ? tx + tw - 4.8 - k * 4.5 : tx + 4.8 + k * 4.5);
  for (let i = 0; i < dots; i++) {
    pg.beginPath();
    pg.arc(slot(i), y + 2.5, 1.4 + (i === dots - 1 && n <= 4 ? 0.3 * (0.5 + 0.5 * Math.sin(G.frame * 0.25)) : 0), 0, Math.PI * 2);
    pg.fill();
  }
  if (n > 4) {
    const px = slot(4);
    pg.fillRect(px - 1.8, y + 2, 3.6, 1);
    pg.fillRect(px - 0.5, y + 0.7, 1, 3.6);
  }
}
function drawRiderPips() {
  for (const pc of G.pieces) {
    if (pc.state !== 'rest') continue;
    let r = 0;
    for (const e of G.enemies) if (wouldRide(e, pc)) r++;
    const s = enemiesUnder(pc);
    if (r) pipTag(r, true, pc.x, pc.y, C.pink);
    if (s) pipTag(s, false, pc.x, pc.y, C.blue);
  }
}
// POWER RUSH running out (Chris's pick, Workshop rushend r1 C, 2026-11-11): the last three seconds counted down 3, 2, 1 in a round badge
// over Buck's hat, with a yellow ring round it draining through each second; it lands big and settles each time (the beeps: SFX.rushCount)
const RUSH_COUNT = 180;
function drawRushCount() {
  const p = G.p;
  if (!p || !(p.gold > 0 && p.gold <= RUSH_COUNT) || !['play', 'pause', 'howto'].includes(G.state)) return;
  const n = Math.ceil(p.gold / 60),
    age = 60 - (((p.gold - 1) % 60) + 1),
    pop = age < 8 ? 1.35 - 0.35 * (age / 8) : 1,
    cx = p.x,
    // over his hat; up on the top catwalk that's under the score bar, so there it goes just below the catwalk (Chris 2026-11-11)
    cy = p.y - 46 - 15 < 24 ? p.y + 17 : p.y - 46,
    r = 11 * pop;
  pg.beginPath();
  pg.arc(cx, cy, r, 0, Math.PI * 2);
  pg.fillStyle = ink(n === 1 ? C.pink : C.indigo);
  pg.fill();
  pg.beginPath();
  pg.arc(cx, cy, r + 2.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - age / 60));
  pg.strokeStyle = ink(C.yel);
  pg.lineWidth = 2.5;
  pg.stroke();
  textF(FONT_MAIN, String(n), cx, cy + 0.8, 14 * pop, C.cream, 'center');
}
// a bashed enemy flying off the screen with a rainbow trail, and the twinkle where he left (06b-gold.js launchEnemy)
function drawLaunched() {
  const n = HOLO_SAT.length;
  for (const l of G.launched || []) {
    const t = [[l.x, l.y - 10], ...l.trail];
    pg.save();
    pg.lineCap = 'round';
    for (let i = 0; i < t.length - 1; i++) {
      pg.globalAlpha = 1 - (0.85 * i) / t.length;
      pg.strokeStyle = ink(HOLO_SAT[(i + (G.frame >> 1)) % n]);
      pg.lineWidth = 11 * (1 - i / t.length) + 1.5;
      pg.beginPath();
      pg.moveTo(t[i][0], t[i][1]);
      pg.lineTo(t[i + 1][0], t[i + 1][1]);
      pg.stroke();
    }
    pg.restore();
    if (l.gone) continue;
    Object.assign(l.e, { x: l.x, y: l.y });
    pg.save();
    pg.translate(l.x, l.y - 10);
    pg.rotate(l.rot);
    pg.translate(-l.x, -(l.y - 10));
    drawEnemy(l.e);
    pg.restore();
  }
  // (Chris 2026-11-09: the big stars were too much) a quick white flash of light where he left: a soft glow that blooms and fades, and
  // a thin four-point glint that shrinks away, about a quarter of a second
  for (const k of G.koStars || []) {
    const f = 1 - k.t / KO_T,
      a = (1 - f) * (1 - f);
    pg.save();
    const g = pg.createRadialGradient(k.x, k.y, 0, k.x, k.y, 5 + 9 * f);
    g.addColorStop(0, 'rgba(255,255,255,' + a + ')');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    pg.fillStyle = g;
    pg.fillRect(k.x - 16, k.y - 16, 32, 32);
    pg.strokeStyle = ink(C.cream);
    pg.globalAlpha = Math.min(1, a * 1.4);
    pg.lineWidth = 1;
    const L = 10 * (1 - f) + 1,
      l2 = L * 0.45;
    pg.beginPath();
    pg.moveTo(k.x - L, k.y);
    pg.lineTo(k.x + L, k.y);
    pg.moveTo(k.x, k.y - L);
    pg.lineTo(k.x, k.y + L);
    pg.moveTo(k.x - l2, k.y - l2);
    pg.lineTo(k.x + l2, k.y + l2);
    pg.moveTo(k.x - l2, k.y + l2);
    pg.lineTo(k.x + l2, k.y - l2);
    pg.stroke();
    pg.restore();
  }
}
