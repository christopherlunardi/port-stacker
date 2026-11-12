// ---------- drawing: drawn art on riso ink plates ----------
// The game logic lives in a 320x240 field. Drawing happens on a "plate" canvas in field units, scaled smoothly to the screen (no pixel
// grid any more: the art is drawn cartoon art). The plate holds ink, not colour: R = pink, G = blue, B = yellow amounts. The art in ART
// (02b-art.js, made by art/tools/inkpack.py from ChatGPT's drawings) is already in ink; code-drawn parts use ink colours from C.
// 13-main prints the plate: halftone per ink, misregistration, paper grain. Room beyond the 320x240 field (16:9, tall phones) is poster.
let LAY = { s: 1, k: 1, LW: PW, LH: PH, ox: 0, oy: 0 };
let plate = null,
  pg = null,
  bgCanvas = null,
  stageCanvas = null,
  bgKey = '';
const IMG = {};
const C = {
  // [pink, blue, yellow] 0..255
  paper: [0, 0, 0],
  indigo: [255, 255, 0],
  navy: [255, 255, 0],
  blue: [0, 255, 0],
  sky: [0, 108, 0],
  skyD: [0, 150, 0],
  skyline: [40, 150, 0],
  pink: [255, 0, 0],
  pinkL: [110, 0, 0],
  pinkD: [255, 90, 0],
  yel: [0, 0, 255],
  yelD: [90, 0, 255],
  orange: [140, 0, 255],
  cream: [0, 0, 0],
  panel: [70, 0, 0]
};
const ink = c => 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
const FONT_STACK = '"Arial Black", "Helvetica Neue", Helvetica, Arial, sans-serif';
function loadArt() {
  for (const [n, a] of Object.entries(ART)) {
    const im = new Image();
    im.src = a.src;
    IMG[n] = im;
  }
}
function rect(x, y, w, h, c) {
  pg.fillStyle = ink(c);
  pg.fillRect(x, y, w, h);
}
function rrectPath(x, y, w, h, r) {
  pg.beginPath();
  pg.roundRect ? pg.roundRect(x, y, w, h, Math.max(0, r)) : pg.rect(x, y, w, h);
}
function rrect(x, y, w, h, r, fill, line, lw = 1) {
  pg.beginPath();
  pg.roundRect ? pg.roundRect(x, y, w, h, r) : pg.rect(x, y, w, h);
  if (fill) {
    pg.fillStyle = ink(fill);
    pg.fill();
  }
  if (line) {
    pg.lineWidth = lw;
    pg.strokeStyle = ink(line);
    pg.stroke();
  }
}
function text(s, x, y, size, c, align = 'left', outline = null, o) {
  textF(FONT_MAIN, s, x, y, size, c, align, outline, o);
} // every word in the game font (2026-11-08)
// an outline that leaves the holes in letters open (Chris 2026-11-08: a thick one filled the holes of 8, 0, 6, 9 and left odd dots): kept thin
// enough for the counters, with a solid drop shadow under bigger text so it still looks chunky
function textOutline(s, x, y, size, outline, ow) {
  const w = Math.min(size * ow, 0.8 + size * 0.055);
  if (size >= 10) {
    const d = Math.max(1, size * 0.07);
    pg.lineJoin = 'round';
    pg.lineWidth = w;
    pg.strokeStyle = ink(outline);
    pg.strokeText(s, x + d, y + d);
    pg.fillStyle = ink(outline);
    pg.fillText(s, x + d, y + d);
  }
  pg.lineJoin = 'round';
  pg.lineWidth = w;
  pg.strokeStyle = ink(outline);
  pg.strokeText(s, x, y);
}
// draw a piece of art with its feet at (x, y), centred on the body's middle (ax): sx/sy squash and stretch around the feet, flip mirrors around the body, alpha fades
function art(name, x, y, o = {}) {
  const a = ART[name],
    im = IMG[name];
  if (!a || !im || !im.complete) return;
  const sc = o.scale || 1,
    w = a.w * sc * (o.sx || 1),
    h = a.h * sc * (o.sy || 1);
  pg.save();
  pg.translate(x, y);
  if (o.rot) pg.rotate(o.rot);
  if (o.flip) pg.scale(-1, 1);
  if (o.alpha != null) pg.globalAlpha = o.alpha;
  const ax = (a.ax || 0) * sc * (o.sx || 1);
  const ha = (artHolo ? 1 : 0) * (o.alpha != null ? o.alpha : 1),
    HO = artHolo === 2 ? HOLO_CRATE : HOLO_BUCK; // 2: the power crate, 1: Buck in POWER RUSH (10g-actors)
  if (ha && HO.trail && G.p.trail)
    G.p.trail.forEach((t, i) =>
      holoGhost(name, im, -w / 2 - ax + (t[0] - G.p.x) * (o.flip ? -1 : 1), -h + t[1] - G.p.y, w, h, ha * (0.5 - i * 0.1), i)
    );
  if (ha && HO.rim) holoRim(name, im, -w / 2 - ax, -h, w, h, ha, HO); // a rainbow edge
  pg.drawImage(im, -w / 2 - ax, -h, w, h);
  if (ha && HO.foil) holoFoil(name, im, -w / 2 - ax, -h, w, h, ha, HO); // and the holographic foil over it
  pg.restore();
}
let artHolo = 0;
// a crane delivery (Chris 2026-11-08: 'we can use that for other things too'): a crate lowered on a rope from the top of the field to
// (x, y) over `frames`, drawn while it's still coming down; returns true once it has landed
function drawDelivery(x, y, age, frames = 48, col = C.orange) {
  if (age >= frames) return true;
  const f = age / frames,
    cy = 24 + (y - 24) * (1 - (1 - f) * (1 - f));
  pg.beginPath();
  pg.moveTo(x, 22);
  pg.lineTo(x, cy - 10);
  pg.lineWidth = 0.8;
  pg.strokeStyle = ink(C.indigo);
  pg.stroke();
  rrect(x - 6, cy - 10, 12, 10, 1.5, col, C.indigo, 1);
  rect(x - 5, cy - 6, 10, 1, C.indigo);
  return false;
}
function drawItem(it) {
  // a horn refill: delivered by the crane in a crate that bursts open in stars, HORN!, then the horn bobs with a glow until it's taken
  const a = it.age || 0;
  if (!drawDelivery(it.x, it.y, a)) return;
  if (a < 60) {
    const t = a - 48;
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * 6.283;
      glyphStar(it.x + Math.cos(ang) * t * 1.2, it.y - 6 + Math.sin(ang) * t * 0.9, 2.2 - t * 0.12, i & 1 ? C.yel : C.cream);
    }
  }
  if (a < 110) {
    pg.globalAlpha = Math.min(1, (110 - a) / 20);
    textF(FONT_MAIN, 'HORN!', it.x, it.y - 24 - (a - 48) * 0.1, 7, C.yel, 'center', C.indigo);
    pg.globalAlpha = 1;
  }
  if (!(it.t > 90 || (it.t >> 3) & 1)) return;
  const bob = Math.sin(G.frame * 0.12) * 1.2,
    pop = a < 60 ? 0.5 + ((a - 48) / 12) * 0.5 : 1;
  glowAt(it.x, it.y - 8 + bob, 11, C.yel, 0.45);
  hornIcon(it.x + 0.5, it.y - 8 + bob, 1.5 * pop);
  if (NIGHT()) nightGlow(it.x, it.y - 8 + bob, 11, C.yel, 0.45);
}
function render() {
  const { LW, LH, ox, oy, k } = LAY;
  const pw = Math.max(1, Math.round(LW * k)),
    ph = Math.max(1, Math.round(LH * k));
  if (!plate) {
    plate = document.createElement('canvas');
    pg = plate.getContext('2d');
    bgCanvas = document.createElement('canvas');
    stageCanvas = document.createElement('canvas');
  }
  if (plate.width !== pw || plate.height !== ph) {
    plate.width = pw;
    plate.height = ph;
    bgCanvas.width = stageCanvas.width = pw;
    bgCanvas.height = stageCanvas.height = ph;
    bgKey = '';
  }
  const menuish = G.state === 'title' || G.state === 'board' || G.state === 'initials' || G.state === 'splash' || G.state === 'studio';
  const key = (menuish ? 'title' : 'stage' + G.level + LOOK()) + '|' + pw + 'x' + ph; // day and night are different drawings of the same layout (Chris 2026-11-08: 1-1 came up in the night painting)
  if (key !== bgKey && !menuish) {
    // the static stage, drawn once
    const layered = !!ART['bg.fore']; // the backdrop in layers so the clouds and hook can move between them
    drawPanels();
    pg.setTransform(k, 0, 0, k, ox * k, oy * k);
    if (L) {
      if (layered) drawHarborSky(BG_ALPHA());
      else drawHarbor();
    }
    const bc = bgCanvas.getContext('2d');
    bc.clearRect(0, 0, pw, ph);
    bc.drawImage(plate, 0, 0);
    if (!foreCanvas) foreCanvas = document.createElement('canvas');
    foreCanvas.width = pw;
    foreCanvas.height = ph;
    const fc = foreCanvas.getContext('2d');
    fc.clearRect(0, 0, pw, ph);
    if (L && layered) {
      pg.setTransform(1, 0, 0, 1, 0, 0);
      pg.clearRect(0, 0, pw, ph);
      pg.setTransform(k, 0, 0, k, ox * k, oy * k);
      drawHarborFore(BG_ALPHA());
      fc.drawImage(plate, 0, 0);
      foreLive = true;
    } else foreLive = false;
    pg.setTransform(1, 0, 0, 1, 0, 0);
    pg.clearRect(0, 0, pw, ph);
    pg.setTransform(k, 0, 0, k, ox * k, oy * k);
    if (L) {
      pg.save();
      pg.beginPath();
      pg.rect(0, 0, PW, PH);
      pg.clip();
      drawStageBG();
      pg.restore();
    }
    const sc = stageCanvas.getContext('2d');
    sc.clearRect(0, 0, pw, ph);
    sc.drawImage(plate, 0, 0);
    bgKey = key;
  }
  pg.setTransform(1, 0, 0, 1, 0, 0);
  if (menuish) {
    drawPanels();
  } else {
    pg.drawImage(bgCanvas, 0, 0);
    pg.setTransform(k, 0, 0, k, ox * k, oy * k);
    if (foreLive) {
      drawCloudsBehind(BG_ALPHA());
      pg.setTransform(1, 0, 0, 1, 0, 0);
      pg.drawImage(foreCanvas, 0, 0);
      pg.setTransform(k, 0, 0, k, ox * k, oy * k);
      const c = craneCycle(G.frame);
      drawHook(c.len, c.sway, BG_ALPHA(), c.load);
    }
    if (NIGHT()) {
      nightDim(NIGHT_DIM_BG);
      drawCloudsBehind(1);
    }
    if (STORM()) stormDim(); // greyed out, the way the night is darkened and the day is faded
    drawMist();
    if (NIGHT()) drawNightLights();
    if (STORM()) drawStormBack(); // the storm's lights, sign and rain, behind the stage
    pg.setTransform(k, 0, 0, k, ox * k, oy * k);
    if (otLook() && otLook().fade) {
      // in an overtime look the backdrop is washed pale, the way a handheld game keeps its backgrounds light, so the stage reads over it
      pg.save();
      pg.globalAlpha = otLook().fade;
      rect(-ox, -oy, LAY.LW, LAY.LH, C.cream);
      pg.restore();
    }
    drawDoors(false); // the doors stand behind the catwalks and ladders (Chris 2026-11-08)
    pg.setTransform(1, 0, 0, 1, 0, 0);
    pg.drawImage(stageCanvas, 0, 0);
  }
  pg.setTransform(k, 0, 0, k, ox * k, oy * k);
  pg.save();
  pg.beginPath();
  if (menuish) pg.rect(-ox, -oy, LAY.LW, LAY.LH);
  else pg.rect(0, 0, PW, PH);
  pg.clip(); // the title and boards fill the whole screen (16:9 too)
  if (G.state === 'splash' || G.state === 'studio') drawSplash();
  else if (G.state === 'title') drawTitle();
  else if (G.state === 'board') drawBoard();
  else if (G.state === 'initials') drawInitials();
  else {
    const sx = shipOffset();
    drawBelts();
    drawCrabWarnings();
    drawGoldBack();
    for (const pc of G.pieces) if (pc.state === 'rest' || (pc.gold && (pc.state === 'lower' || pc.state === 'lift'))) drawContainer(pc);
    for (const it of G.items) drawItem(it);
    for (const e of G.enemies) drawEnemy(e);
    drawDoors(true);
    drawPlayer();
    drawLaunched();
    for (const pc of G.pieces) if (pc.state === 'fall') drawContainer(pc);
    drawFlats(); // in front of the falling container that flattened them (Chris 2026-11-11: it covered them)
    const storm = STORM(),
      bob = storm ? Math.sin(G.frame * 0.075) * 1.6 : Math.sin(G.frame * 0.035) * 0.9;
    pg.save();
    pg.translate(0, bob);
    if (storm) {
      // in the storm the ship also rocks, bow and stern, about its middle (Chris 2026-11-09)
      const mx = sx + 32 + PW / 2,
        my = PH - 14;
      pg.translate(mx, my);
      pg.rotate(Math.sin(G.frame * 0.052) * 0.018);
      pg.translate(-mx, -my);
    } // the ship bobs gently, with its cargo (Chris 2026-11-07)
    drawShip(sx + 32);
    for (const pc of G.pieces) if (pc.state === 'plate') drawContainer(pc, sx);
    pg.restore();
    rect(0, PH - 3, PW, 3, C.blue);
    pg.strokeStyle = ink(C.cream);
    pg.lineWidth = 0.8;
    pg.beginPath();
    const chop = STORM() ? 2.2 : 1;
    for (let x = ((G.frame * 0.2 * chop) % 12) - 12; x < PW; x += 12) {
      const h = 1.5 * chop + (STORM() ? Math.sin(G.frame * 0.12 + x * 0.3) * 0.8 : 0);
      pg.moveTo(x, PH - 1.5);
      pg.quadraticCurveTo(x + 3, PH - 1.5 - h, x + 6, PH - 1.5);
    }
    pg.stroke(); // the near water: the cartoony strip (Chris liked it better)
    if (STORM()) drawStormFlash(); // lightning lights up everything for a moment
    if (NIGHT()) flushNightGlows(); // the lights in the stage (door lamps, ship windows), over everything in it
    for (const c of G.clouds) drawBlast(c);
    drawDeath();
    drawRiderPips(); // who'd ride each container down if it dropped now
    drawGoldFront();
    monoSnap(); // overtime's screen look: everything so far is play area; what's drawn after (score pops, cards, the bar) keeps its colours
    drawRushCount(); // POWER RUSH's 3, 2, 1 (over the overtime look, in its own colours)
    for (const p of G.pops) {
      // score popups: pop in with an overshoot, float up, blink out; big scores get a burst behind them
      const age = 80 - p.t,
        k = age < 8 ? 0.4 + (0.9 * Math.sin((age / 8) * Math.PI * 0.75)) / Math.sin(Math.PI * 0.75) : 1,
        sz = (p.size || 7.5) * Math.min(1.25, k);
      if (p.t < 14 && (p.t >> 1) & 1) continue;
      if ((p.pts || 0) >= 1000) {
        pg.save();
        pg.translate(p.x, p.y);
        pg.rotate(age * 0.05);
        pg.fillStyle = ink(C.pink);
        pg.beginPath();
        for (let i = 0; i < 16; i++) {
          const r = (i & 1 ? 0.45 : 1) * sz * 1.6;
          pg.lineTo(Math.cos((i / 16) * 6.283) * r, Math.sin((i / 16) * 6.283) * r * 0.6);
        }
        pg.closePath();
        pg.globalAlpha = 0.85;
        pg.fill();
        pg.restore();
      }
      const hw = Math.max(textW(FONT_MAIN, p.text, sz), p.sub ? textW(FONT_MAIN, p.sub, Math.max(6, sz * 0.6)) : 0) / 2 + 3,
        px = Math.max(hw, Math.min(PW - hw, p.x)); // kept inside the field (2026-11-08: wide words ran off the edge)
      text(p.text, px, p.y, sz, C[p.col] || C.pink, 'center', C.indigo);
      if (p.sub) text(p.sub, px, p.y + sz * 0.95, Math.max(6, sz * 0.6), C.sky, 'center', C.indigo);
    }
    if (G.state === 'intro' && G.t < (G.introLen || INTRO_LEN) - 50)
      card('STAGE ' + stageLabel(), L.def.name + (stageTip() ? ' - ' + stageTip() : ''), {
        t: G.t,
        end: (G.introLen || INTRO_LEN) - 50,
        ot: 'intro'
      });
    if (G.state === 'clear') clearCard();
    if (G.state === 'over') overCard();
    drawBand(); // after the cards, so their ropes go up behind the score bar
    if (G.state === 'intro' && G.t >= (G.introLen || INTRO_LEN) - 50) {
      const k = Math.min(1, (G.t - (G.introLen || INTRO_LEN) + 50) / 8);
      textF(FONT_MAIN, 'READY?', PW / 2, 112 * TK, (14 + k * 4) * TK, C.yel, 'center', C.indigo);
    }
    if (G.state === 'play' && G.goT > 0) {
      const a = G.goT / 50;
      pg.save();
      pg.globalAlpha = Math.min(1, a * 2);
      textF(FONT_MAIN, 'GO!', PW / 2, 112 * TK, (18 + (1 - a) * 14) * TK, C.pink, 'center', C.indigo);
      pg.restore();
    }
    if (G.state === 'pause') drawMenu();
    if (G.state === 'howto') drawHowto();
  }
  if (G.banner) {
    rect(0, PH - 12, PW, 12, C.indigo);
    text(G.banner.text, PW / 2, PH - 6, 6.5, C.yel, 'center');
  }
  if (G.attract) drawAttract(); // DEMO PLAY / PRESS A TO GO BACK (09e-attract.js)
  pg.restore();
  if (!menuish && ox > 30 && G.p && G.state !== 'howto') {
    pg.setTransform(k, 0, 0, k, 0, 0);
    const R = ox + PW + ox / 2,
      bw = Math.min(ox - 10, 70);
    rrect(R - bw / 2, oy + 24, bw, 150, 6, C.cream, C.indigo, 1.5); // stats card on the right
    for (const [lab, v, y] of [
      ['SCORE', fmtNum(G.score), 40],
      ['HORN', String(G.p.horns), 88],
      ['LIVES', String(Math.max(0, G.lives)), 136]
    ]) {
      text(lab, R, oy + y, 7, C.blue, 'center', null, { maxW: bw - 8 });
      text(v, R, oy + y + 17, v.length > 4 ? 12 : 20, C.pink, 'center', C.indigo, { maxW: bw - 8 });
    }
  }
  if (DEV.on && DEV.showSize) {
    pg.setTransform(k, 0, 0, k, 0, 0);
    text(Math.round(LAY.W) + '×' + Math.round(LAY.H) + ' plate ' + pw + '×' + ph, 4, 6, 6, C.pink);
  }
  pg.setTransform(1, 0, 0, 1, 0, 0);
}

// the squashed: flat as a pancake for a moment, blinking out (40 frames). The Captain, the Forklift and the gull have their own squash
// pictures, Pratt and the Watchman too since 2026-11-11 (ChatGPT; they used to just vanish under the container)
function flatArt(type) {
  return type === 'fork' ? 'forklift.squash' : type === 'gull' ? 'gull.squash' : type === 'pratt' ? 'pratt.squash' : type === 'watch' ? 'watch.squash' : 'crab.squash';
}
function drawFlat(type, x, y, t, flip, scale) {
  if (!(t > 12 || (t >> 1) & 1)) return;
  const k = Math.max(0, t - 34); // the first few frames: squeezed out wide, then settling
  art(flatArt(type), x, y, {
    flip,
    scale,
    sx: 1 + k * 0.03,
    sy: 1 - k * 0.05
  });
}
function drawFlats() {
  for (const fl of G.flats || []) drawFlat(fl.type, fl.x, fl.y, fl.t, fl.flip);
}
