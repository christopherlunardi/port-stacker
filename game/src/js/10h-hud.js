// ---------- what sits over the game: the score bar, the side panels on wide screens, the info lines (pause menu > INFO) ----------
// the score bar keeps SCORE, HIGH and STAGE; lives and horns sit in rope badges in the bottom corners (Chris's pick, Workshop hud round 1,
// C, 2026-11-08), below the bottom catwalk where they don't get in the way, and pop when they change
function drawBand() {
  rrect(3, 1, PW - 6, 20, 5, C.cream, C.indigo, 1.3);
  const cell = (x, label, value, col, al) => {
    textF(FONT_MAIN, label, x, 6.2, 4.8, C.blue, al);
    textF(FONT_MAIN, value, x, 14.6, 11, col, al);
  };
  // (Chris 2026-11-09, classic arcade style) the score in eight digits with commas, the leading zeros faint so the real number stands out
  textF(FONT_MAIN, 'SCORE', 12, 6.2, 4.8, C.blue, 'left');
  drawScoreRoll(12, 14.6);
  // the middle: the par clock (Chris 2026-11-08, in place of the high score, which the boards show): counts down from par; past it,
  // it reads OVER PAR and counts up, blinking
  const secs = G.st ? Math.floor(G.st.f / 60) : 0,
    lft = parSecs() - secs;
  if (lft >= 0) cell(PW / 2, 'PAR TIME', fmtTime(lft), lft <= 15 ? C.pink : C.indigo, 'center');
  else cell(PW / 2, 'OVER PAR', '+' + fmtTime(-lft), (G.frame >> 4) & 1 ? C.pink : C.indigo, 'center');
  cell(PW - 12, 'STAGE', stageLabel(), C.pink, 'right');
  if (otNum()) otBand();
  if (G.combo >= 2 && G.comboT > 0 && (G.state === 'play' || (G.state === 'howto' && G.howView !== 'list'))) drawComboHud(); // only while playing (Chris 2026-11-09: it froze over the SHIP LOADED card)
  if (G.p && G.state !== 'howto') drawCornerBadges(Math.max(0, G.lives), G.p.horns, hudPop());
}
function scoreParts(v) {
  // 412350 -> ['00,', '412,350']: the zeros (and their commas) in front, then the number itself
  const n = Math.max(0, Math.floor(v));
  if (n > 99999999) return ['', n.toLocaleString('en-US')]; // past eight digits: just the number, no zeros
  const s = String(n)
      .padStart(8, '0')
      .replace(/\B(?=(\d{3})+$)/g, ','),
    lit = n.toLocaleString('en-US');
  return [s.slice(0, s.length - lit.length), lit];
}
// (Chris 2026-11-09: roll up in a satisfying way) the score shown chases the real one: quick for a big haul, easing in at the end, and
// every digit that changes rolls like an odometer wheel (the old one slides up and out, the new one up from below). Digits sit in fixed
// slots so the number doesn't jiggle while it rolls, the zeros in front light up as the number grows into them, and a big haul gives
// the number a little pop.
const ROLL = { show: 0, slots: [], pop: 0, n: 6 };
function scoreRollTick() {
  const d = G.score - ROLL.show;
  if (d < 0 && G.score === 0)
    ROLL.show = 0; // a new game
  else if (d) ROLL.show += Math.sign(d) * Math.min(Math.abs(d), Math.max(Math.abs(d) * 0.1, 37));
  if (d >= 1000 && !ROLL.big) (ROLL.pop = 14), (ROLL.big = true);
  if (d < 200) ROLL.big = false;
  if (ROLL.pop > 0) ROLL.pop--;
  for (const s of ROLL.slots) if (s && s.t > 0) s.t--;
}
function drawScoreRoll(x, y) {
  const v = Math.round(ROLL.show),
    [dim, lit] = scoreParts(v),
    str = dim + lit,
    size = 11 * (1 + 0.1 * Math.sin((ROLL.pop / 14) * Math.PI)),
    dw = textW(FONT_MAIN, '0', size),
    cw = textW(FONT_MAIN, ',', size),
    rise = 10;
  pg.save();
  pg.beginPath();
  pg.rect(x - 2, 8.5, 130, 11.5);
  pg.clip();
  let cx = x;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i],
      s = ROLL.slots[i] || (ROLL.slots[i] = { c: ch, old: ch, t: 0 }),
      col = i < dim.length ? C.pinkL : C.pink,
      w = ch === ',' ? cw : dw;
    if (s.c !== ch) Object.assign(s, { old: s.c, c: ch, t: s.t > 0 ? 0 : ROLL.n }); // a digit spinning fast (changed again mid-roll) just shows its number: only the slower wheels roll
    const k = s.t / ROLL.n;
    if (k > 0) {
      textF(FONT_MAIN, s.old, cx + w / 2, y - (1 - k) * rise, size, col, 'center');
      textF(FONT_MAIN, ch, cx + w / 2, y + k * rise, size, col, 'center');
    } else textF(FONT_MAIN, ch, cx + w / 2, y, size, col, 'center');
    cx += w;
  }
  pg.restore();
}
const HUDP = { lives: null, horn: null, tl: 0, th: 0 };
function hudPop() {
  // a count that changed pops for a moment
  if (HUDP.lives !== G.lives) {
    if (HUDP.lives != null) HUDP.tl = 24;
    HUDP.lives = G.lives;
  }
  if (HUDP.horn !== G.p.horns) {
    if (HUDP.horn != null) HUDP.th = 24;
    HUDP.horn = G.p.horns;
  }
  const k = t => 1 + Math.sin((t / 24) * Math.PI) * 0.35;
  return { l: k(HUDP.tl), h: k(HUDP.th) };
}
function hornIcon(x, y, s = 1) {
  // a little air horn: a pink bulb and a flared yellow bell, pointing right
  pg.save();
  pg.translate(x, y);
  pg.scale(s, s);
  pg.lineJoin = 'round';
  pg.beginPath();
  pg.moveTo(-2, -1.6);
  pg.lineTo(3, -4.2);
  pg.lineTo(3, 4.2);
  pg.lineTo(-2, 1.6);
  pg.closePath();
  pg.fillStyle = ink(C.yel);
  pg.fill();
  pg.lineWidth = 1;
  pg.strokeStyle = ink(C.indigo);
  pg.stroke();
  pg.beginPath();
  pg.arc(-4, 0, 2.6, 0, 7);
  pg.fillStyle = ink(C.pink);
  pg.fill();
  pg.stroke();
  pg.restore();
}
function drawCornerBadges(lives, horn, pop) {
  const badge = (x, flip, icon, n, s, bar) => {
    pg.save();
    pg.translate(x, PH - 23);
    pg.scale(s, s);
    ropePanel(-22, -14, 44, 26); // a little taller than before, to fit the life bar (Chris 2026-11-08)
    const ty = bar ? -3.6 : -1; // with the life bar the count and Buck sit a little higher, the bar under them
    icon(flip ? 10 : -10, ty);
    textF(FONT_MAIN, 'x' + n, flip ? -6 : 6, ty, 9, C.pink, 'center', C.indigo, { maxW: 20 });
    if (bar) lifeBar();
    pg.restore();
  };
  badge(30, false, (ix, ty) => art('buck.stand', ix - 1, ty + 6.4, { scale: 0.4 }), lives, pop.l, true);
  badge(PW - 30, true, (ix, ty) => hornIcon(ix, ty - 1, 1.2), horn, pop.h, false);
}
function lifeBar() {
  // how close the next extra life is (Chris 2026-11-08): fills from pink through yellow to green; when a life is earned it flashes full
  // with a sparkle, then empties and starts again
  const from = G.lifeFrom || 0,
    k = G.lifeFlash > 0 ? 1 : Math.max(0, Math.min(1, (G.score - from) / ((G.nextLife || 1) - from))),
    x0 = -16,
    w = 32,
    y = 4.6;
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t)),
    GREEN = [0, 120, 230],
    col = k < 0.5 ? mix(C.pink, C.yel, k * 2) : mix(C.yel, GREEN, (k - 0.5) * 2);
  rrect(x0, y, w, 3, 1.5, C.cream, C.indigo, 0.6);
  if (k > 0) {
    const flash = G.lifeFlash > 0 && (G.lifeFlash >> 2) & 1;
    rrect(x0 + 0.6, y + 0.6, Math.max(1.8, (w - 1.2) * k), 1.8, 0.9, flash ? C.cream : col, null);
  }
  if (G.lifeFlash > 0) {
    // a little burst of stars off the bar's end
    const t = 1 - G.lifeFlash / 40;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + t * 2,
        r = 4 + t * 12;
      pg.save();
      pg.globalAlpha = 1 - t;
      glyphStar(x0 + w + Math.cos(a) * r * 0.5, y + 1.5 + Math.sin(a) * r * 0.5, 1.6 * (1 - t * 0.5), i & 1 ? C.yel : C.pink);
      pg.restore();
    }
  }
}
// replaced in 10e-menus.js
// the title screen: an animated attract scene that loops every 15s (Chris 2026-11-07). The logo drops in; Buck walks onto the dock; Inspector
// Pratt stomps in, gets horned dizzy and squashed by a container from the crane; Pinch scuttles in, winds up, charges, and gets horned too.
function drawPanels() {
  // the room around the field: a pink poster
  const { LW, LH, ox, oy } = LAY;
  pg.setTransform(LAY.k, 0, 0, LAY.k, 0, 0);
  rect(0, 0, LW, LH, C.panel);
  if (ox > 30 && (G.state === 'title' || G.state === 'board' || G.state === 'initials')) {
    const L0 = ox / 2,
      fs = Math.min(20, (ox - 10) / 5.6);
    text('PORT', L0, oy + 34, fs, C.blue, 'center', C.indigo);
    text('STACKER', L0, oy + 34 + fs * 1.15, fs, C.pink, 'center', C.indigo);
    rrect(L0 - 28, oy + 72, 56, 13, 3, C.yel, C.indigo, 1.2);
    text('DELUXE', L0, oy + 78.5, 8, C.indigo, 'center');
    art('buck.stand', L0, oy + 200, { scale: Math.min(1.8, ox / 40) });
  }
}
// mist: long thin streaks of fog drifting slowly across the harbor, between the painting and the stage (Chris 2026-11-08: not round blobs).
// One fog strip is made once (many very stretched soft ellipses, wrapping round so it tiles) and drawn as a few bands at different heights and speeds.
function infoLines() {
  // build and device facts, for when something goes wrong (pause menu > INFO)
  const nat = NATIVE(),
    L = ['BUILD ' + BUILD + (RAG && RAG.name ? '   MUSIC ' + RAG.name.toUpperCase() : '')];
  try {
    if (nat) {
      L.push(nat.device() + '  ' + Math.round(nat.refresh()) + 'HZ  APP ' + nat.appVersion());
      L.push('WEBVIEW ' + nat.webview() + '  ' + (nat.status() || ''));
      if (nat.logStatus) L.push('PLAY LOG ' + nat.logStatus()); // is the play log getting through (Chris 2026-11-08)
    } else L.push('BROWSER' + (document.body.classList.contains('padmode') ? '  CONTROLLER' : ''));
  } catch (e) {
    L.push('APP ?');
  }
  L.push('GPU ' + (window.__gpu || 'NONE (FLAT)'));
  L.push('WINDOW ' + innerWidth + 'X' + innerHeight + '  DPR ' + (devicePixelRatio || 1).toFixed(2));
  L.push('SCREEN ' + screen.width + 'X' + screen.height + '  SCALE ' + LAY.s.toFixed(2));
  L.push('PRINT ' + PRINT_MODES[printMode][0] + (DEV.on ? '   DEV ON' : ''));
  return L;
}
// replaced in 10e-menus.js

function drawComboHud() {
  // (Chris 2026-11-09, Workshop combo display r2 D: the starburst at the top got in the way of play) a plate at the bottom, on the water
  // between your lives and horns where nothing you play with goes: COMBO, the count and the multiplier, jumping on every move, the
  // bar draining under it
  const m = comboMult(),
    win = G.comboWin || 150,
    age = win - G.comboT,
    pop = age < 10 ? 1 + 0.3 * Math.sin((age / 10) * Math.PI) : 1,
    cx = PW / 2,
    cy = PH - 22, // (Chris 2026-11-09: a touch bigger, and in line with the lives and horn badges; 2026-11-10: lower, with the bar above it,
    // so the two together fill the badges' height: the bar under it sat on the ship's pink stripe)
    k = 1.18;
  pg.save();
  pg.translate(cx, cy);
  pg.scale(pop * k, pop * k);
  rrect(-44, -8, 88, 15, 4, C.yel, C.indigo, 1.2);
  textF(FONT_MAIN, 'COMBO', -22, 0, 7, C.indigo, 'center');
  textF(FONT_MAIN, String(G.combo), 4, -0.5, G.combo >= 100 ? 8.5 : 11, C.pink, 'center', C.indigo); // (smaller at three digits, clear of the tag)
  if (m > 1) {
    rrect(16, -5.5, 24, 10, 3, C.pink, C.indigo, 1);
    textF(FONT_MAIN, 'X' + m, 28, -0.4, 7, C.cream, 'center');
  }
  pg.restore();
  // the bar rides up with the plate's jump, so the plate never grows into it (Fable's bug check)
  const by = cy - 8 * k * pop - 4.6;
  rrect(cx - 34, by, 68, 3, 1.4, C.cream, C.indigo, 0.7);
  rect(cx - 33.5, by + 0.5, 67 * (G.comboT / win), 2, C.pink);
}
function comboBurst(cx, cy, s, tagLeft) {
  // (Chris 2026-11-08, Workshop combo display r1 C) the count on a yellow starburst that spins slowly and jumps on every move, COMBO under
  // it, the multiplier in a pink tag beside it, and a bar that drains: the time left to keep it going
  const m = comboMult(),
    win = G.comboWin || 150,
    age = win - G.comboT,
    pop = age < 10 ? 1 + 0.4 * Math.sin((age / 10) * Math.PI) : 1;
  pg.save();
  pg.translate(cx, cy);
  pg.scale(s, s);
  pg.save();
  pg.scale(pop, pop);
  pg.beginPath();
  for (let i = 0; i < 24; i++) {
    const a = G.frame * 0.02 + (i / 24) * Math.PI * 2,
      r = i & 1 ? 14 : 22;
    pg.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  pg.closePath();
  pg.fillStyle = ink(C.yel);
  pg.fill();
  pg.lineWidth = 1.2;
  pg.strokeStyle = ink(C.indigo);
  pg.stroke();
  textF(FONT_MAIN, String(G.combo), 0, -3, 14, C.pink, 'center', C.indigo);
  textF(FONT_MAIN, 'COMBO', 0, 8, 6, C.indigo, 'center');
  pg.restore();
  if (m > 1) {
    const tx = tagLeft ? -48 : 18;
    rrect(tx, 8, 30, 10, 3, C.pink, C.indigo, 1);
    textF(FONT_MAIN, 'X' + m, tx + 15, 13, 7, C.cream, 'center');
  }
  rrect(-18, 21, 36, 2.6, 1.3, C.cream, C.indigo, 0.7);
  rect(-17.5, 21.5, 35 * (G.comboT / win), 1.6, C.pink);
  pg.restore();
}
// OVERTIME's own brand (Chris 2026-11-09: overtime is separate from the stage counter, so the stage reads 2-3 as before and overtime shows
// on its own as OVERTIME 1 / OT1). otBand: in the score bar, beside the stage. otCard: on the stage, ship-loaded and game-over cards
// (card space: x 0 is the middle, top is the card's top edge; which: 'intro' | 'clear' | 'over'). Chris's pick, Workshop overtime-r1: A's
// orange OT1 tag in the score bar, B's orange OVERTIME plate along the cards' bottom edge.
function otBand() {
  const x = PW - 62;
  rrect(x - 13, 5.5, 26, 11, 3, C.orange, C.indigo, 1.1);
  textF(FONT_MAIN, 'OT' + otNum(), x, 11.4, 7.5, C.cream, 'center', C.indigo);
}
function otCard(top, w, h, t, which) {
  // (Chris 2026-11-09, Workshop overtime-r1 B, without the ribbon's tails) a plain orange plate across the card's bottom edge
  rrect(-46, top + h - 5, 92, 12, 2, C.orange, C.indigo, 1.4);
  textF(FONT_MAIN, 'OVERTIME ' + otNum(), 0, top + h + 1.5, 7, C.cream, 'center', C.indigo, { track: 0.5 });
}
// OVERTIME's screen look (Chris 2026-11-09: overtime 1 like an old green-screen handheld, the menus keep the good colours and the play area becomes
// that; then red for overtime 2, pink 3, blue 4, a colour for every one). One style for all of them (Workshop otlook-r1, D "Soft": a
// smooth ramp from the print, dots and all, with the backdrop washed pale so the stage reads), so a fix made for overtime 1 applies to
// every overtime; only the palette changes. A palette is 4 colours, darkest first. After the last one they come round again.
// The printer (13-main) recolours only the play area: monoSnap keeps a copy of the plate once the play area is drawn, and pixels that
// still match it are play area. steps: 4 flat shades instead of a ramp; grid: an LCD pixel grid; flat: from the flat colours, no dots.
const OT_STYLE = { steps: false, flat: false, grid: false, fade: 0.4 }; // (Chris 2026-11-09: more in-between colours, so the backdrop shows nicely: the four
// colours are spread from dark to a pale top, and the backdrop is washed less)
const OT_PALETTES = [
  ['GREEN', [15, 56, 15], [58, 108, 42], [139, 172, 15], [218, 232, 166]], // an old green-screen handheld
  ['RED', [20, 0, 4], [110, 8, 16], [214, 52, 52], [255, 196, 186]], // an old red-on-black viewer
  ['PINK', [44, 10, 44], [128, 40, 112], [214, 112, 172], [252, 222, 236]],
  ['BLUE', [14, 22, 70], [46, 82, 156], [118, 162, 220], [220, 236, 252]], // a backlit blue LCD
  ['AMBER', [26, 12, 0], [118, 56, 0], [214, 128, 16], [255, 220, 150]], // an old amber monitor
  ['SEPIA', [44, 28, 18], [108, 76, 46], [178, 140, 94], [242, 226, 196]],
  ['GREY', [24, 24, 24], [88, 92, 80], [156, 162, 142], [226, 230, 214]] // an old grey pocket handheld
];
// (Chris 2026-11-10, picked from a Fable Workshop round) overtimes 1 to 4 are two-ink reprints: the game's own print and halftone, but the
// press loaded with only two inks on cream paper, a dark one for the blue plate and a bright one for the warm plates (the yellow plate
// takes the bright ink at half strength), like a gig poster. After those, "in case people somehow make it that far", the handheld
// screens; then round again.
const OT_TWO_INK = [
  ['NAVY + ORANGE', [31, 58, 140], [255, 106, 42]],
  ['TEAL + PINK', [11, 111, 122], [255, 79, 163]],
  ['BLACK + SKY BLUE', [40, 40, 46], [38, 150, 255]], // (Chris 2026-11-10: black + red looked too much like overtime 1)
  ['PURPLE + GOLD', [75, 47, 143], [245, 167, 0]]
];
let OT_LOOKS = [
  ...OT_TWO_INK.map(([name, ib, ip, paper]) => ({
    name,
    pal: [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ],
    fade: 0.1,
    inks: { ib, ip, iy: ip.map(v => Math.round((v + 255) / 2)), paper: paper || [247, 236, 222] }
  })),
  ...OT_PALETTES.map(([name, ...pal]) => Object.assign({ name, pal }, OT_STYLE))
];
function otLook() {
  const n = otNum();
  if (
    !n ||
    !OT_LOOKS.length ||
    G.state === 'title' ||
    G.state === 'board' ||
    G.state === 'initials' ||
    G.state === 'splash' ||
    G.state === 'studio'
  )
    return null;
  return OT_LOOKS[(n - 1) % OT_LOOKS.length];
}
let monoShot = false;
function monoSnap() {
  // everything drawn so far is play area: mark it by taking its alpha down to 254 (the printer's shader looks for that); what's drawn
  // over it after, opaque, is back at 255 and keeps its colours
  monoShot = !!otLook() && !HEADLESS;
  if (!monoShot) return;
  pg.save();
  pg.setTransform(1, 0, 0, 1, 0, 0);
  pg.globalCompositeOperation = 'destination-out';
  pg.fillStyle = 'rgba(0,0,0,0.004)';
  pg.fillRect(0, 0, plate.width, plate.height);
  pg.restore();
}
