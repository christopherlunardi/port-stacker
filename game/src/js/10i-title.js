// ---------- the title screen: the attract scene (Buck, Pratt, the crab, the crane), the logo and its idle swing, the splash ----------
function titleCrane(t, rest) {
  // the backdrop crane's part in the intro: lower the container over Pratt, let go, wind back up
  const ez = k => (k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k)),
    L1 = 92,
    f = G.frame;
  rest = rest || 0; // rest: where it waits (higher on the loop, behind the logo)
  let len = rest + Math.sin(f * 0.03) * 3,
    sway = Math.sin(f * 0.025) * 1.2,
    load = { c: 'orange', w: 64 * TK, h: 20 * TK, drop: 0, k: TK };
  if (t >= TI.lowerAt && t < TI.releaseAt) {
    len = rest + (L1 - rest) * ez((t - TI.lowerAt) / (TI.lowerEnd - TI.lowerAt));
    sway = Math.sin(t * 0.09) * 2.5 * (1 - ez((t - TI.lowerAt) / 70));
  }
  if (t >= TI.releaseAt) {
    len = t < TI.raiseAt ? L1 - Math.min(6, (t - TI.releaseAt) * 1.5) : rest + (L1 - rest) * (1 - ez((t - TI.raiseAt) / 70));
    sway = t < TI.raiseAt + 30 ? Math.sin((t - TI.releaseAt) * 0.4) * 2 * Math.exp(-(t - TI.releaseAt) / 25) : sway;
    load = null;
  } // let go: drawTitle draws it falling
  return { len, sway, hookAlpha: 1, load };
}
function grabLen(d) {
  const b = harborBox();
  return ((d - 29) * TK + HB.px * 14 * b.k - b.y) / (HB.px * b.k) - HB.tipY;
} // hook length that reaches a container on the dock
function resetCrane(r) {
  // the loop's reset: lower the empty hook to the container, hook it, lift it back up
  const ez = k => (k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k)),
    Lg = grabLen(TI.dock),
    f = G.frame;
  let len = Math.sin(f * 0.03) * 3,
    load = null,
    sway = Math.sin(f * 0.025) * 1.2;
  if (r >= 40 && r < 110) {
    len = Lg * ez((r - 40) / 70);
    sway *= 1 - ez((r - 40) / 70);
  } else if (r >= 110 && r < 125) {
    len = Lg;
    sway = 0;
    load = { c: 'orange', w: 64 * TK, h: 20 * TK, drop: 0, k: TK, front: true };
  } else if (r >= 125) {
    len = Lg + (TI.hang - Lg) * ez((r - 125) / 75);
    load = { c: 'orange', w: 64 * TK, h: 20 * TK, drop: 0, k: TK, front: true };
    sway = Math.sin((r - 125) * 0.12) * 1.5;
  }
  return { len, sway, hookAlpha: 1, load };
}
function drawTitleReset(r, hx, d, S, XR) {
  // Buck stands; the container waits on the dock till the hook takes it; Pinch wakes and scuttles off right
  const ca = ART['containers.orange'];
  if (r < 110 && ca) art('containers.orange', hx, d, { sx: 64 / ca.w, sy: 20 / ca.h });
  else if (HOOK_FRONT && ca)
    art('containers.orange', HOOK_FRONT.x / TK, HOOK_FRONT.y / TK, { sx: HOOK_FRONT.w / TK / ca.w, sy: HOOK_FRONT.h / TK / ca.h }); // on the hook, in front
  art('buck.stand', TI.buckX, d, { scale: S, sy: 1 + Math.sin(G.frame * 0.06) * 0.012 });
  const stopX = hx + 32 + 16;
  if (r < 30) art('crab.dizzy', stopX, d, { scale: S, flip: true, sx: 1 + Math.sin(G.frame * 0.3) * 0.04 });
  else if (r < 140) {
    const cx = stopX + ((XR + 15 - stopX) * (r - 30)) / 110;
    art('crab.scuttle' + (1 + (((cx / 6) | 0) & 1)), cx, d, { scale: S });
  }
}
function drawTitle() {
  const T = G.t,
    ph = titlePhase(T),
    t = ph.t,
    d = TI.dock,
    S = 1.55,
    ease = k => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
  const sh = G.shake > 0 ? (G.shake / 14) * 3 : 0;
  if (sh) pg.translate((Math.random() - 0.5) * sh * 2, (Math.random() - 0.5) * sh * 2);
  HOOK_FRONT = null;
  drawHarborLive(0.85, ph.reset >= 0 ? resetCrane(ph.reset) : titleCrane(t, ph.again ? TI.hang : 0));
  drawFarWater();
  {
    const PW = 320,
      PH = 240,
      X0 = -LAY.ox / TK,
      W0 = LAY.LW / TK,
      B0 = (LAY.LH - LAY.oy) / TK,
      XL = X0 - 30,
      XR = X0 + W0 + 25;
    pg.save();
    pg.scale(TK, TK); // X0/W0/B0: the visible screen in these coordinates; XL/XR: just off its sides // the scene, logo and menu: old-field coordinates, drawn at TK. The backdrop, with the same moving water as in play (Chris 2026-11-07: the painting's waves sat still) prints stronger on the title (Chris: less washed out for the intro)
    rect(X0, d, W0, 2, C.indigo);
    rect(X0, d + 2, W0, 8, C.yel);
    for (let x = X0 + 4; x < X0 + W0; x += 10) {
      pg.beginPath();
      pg.arc(x, d + 6, 0.8, 0, 7);
      pg.fillStyle = ink(C.indigo);
      pg.fill();
    } // the dock
    rect(X0, d + 10, W0, B0 - d - 10, C.blue);
    pg.strokeStyle = ink(C.cream);
    pg.lineWidth = 0.9;
    pg.beginPath();
    for (let x = X0 + ((G.frame * 0.25) % 14) - 14; x < X0 + W0; x += 14) {
      pg.moveTo(x, d + 17);
      pg.quadraticCurveTo(x + 3, d + 15.5, x + 6, d + 17);
    }
    pg.stroke();
    const hx = hookTip(0)[0] / TK;
    if (ph.reset >= 0) drawTitleReset(ph.reset, hx, d, S, XR);
    else {
      // the container falling once the hook lets go, then landed (before that it hangs from the crane, drawn with the backdrop)
      if (t >= TI.releaseAt && t < TI.landAt) {
        const b = harborBox(),
          top = (hookTip(92)[1] - HB.px * 14 * b.k) / TK + 9,
          k = (t - TI.releaseAt) / (TI.landAt - TI.releaseAt),
          ca = ART['containers.orange'];
        if (ca) art('containers.orange', hx, top + 20 + (d - top - 20) * k * k, { sx: 64 / ca.w, sy: (20 / ca.h) * (1 + k * 0.06) });
      }
      if (t >= TI.landAt) {
        const cb = t < TI.landAt + 10 ? Math.sin(((t - TI.landAt) / 10) * Math.PI) : 0,
          ca = ART['containers.orange'];
        if (ca) art('containers.orange', hx, d, { sx: (64 / ca.w) * (1 + cb * 0.05), sy: (20 / ca.h) * (1 - cb * 0.12) });
      }
      // Buck walks in and stands his ground
      const bx = ph.again
          ? TI.buckX
          : t < TI.buckIn[0]
            ? XL
            : t < TI.buckIn[1]
              ? XL + ((TI.buckX - XL) * (t - TI.buckIn[0])) / (TI.buckIn[1] - TI.buckIn[0])
              : TI.buckX,
        walking = !ph.again && t >= TI.buckIn[0] && t < TI.buckIn[1];
      const horning = t >= TI.hornAt && t < TI.hornAt + 22;
      if (horning) {
        art('buck.horn', bx, d, { scale: S });
        const age = t - TI.hornAt;
        pg.lineCap = 'round';
        for (let r = 0; r < 3; r++) {
          const rad = 6 + r * 7 + age * 0.8;
          pg.beginPath();
          pg.arc(bx + 18, d - 26, rad, -0.6, 0.6);
          pg.lineWidth = 2.6;
          pg.strokeStyle = ink(C.indigo);
          pg.stroke();
          pg.lineWidth = 1.4;
          pg.strokeStyle = ink(r === 1 ? C.yel : C.pink);
          pg.stroke();
        }
      } else if (walking) art('buckwalk.w' + (1 + (((bx / 6) | (0 & 3)) % 4)), bx, d, { scale: S });
      else art('buck.stand', bx, d, { scale: S, sy: 1 + Math.sin(G.frame * 0.06) * 0.012 });
      // Pratt stomps in under the hook, gets horned dizzy, gets squashed
      if (t >= TI.prattIn[0] && t < TI.landAt) {
        const px = t < TI.prattIn[1] ? XR - ((XR - hx) * (t - TI.prattIn[0])) / (TI.prattIn[1] - TI.prattIn[0]) : hx;
        if (t < TI.hornAt + 8) art('prattwalk.w' + (1 + (((px / 6) | 0) % 4)), px, d, { scale: S, flip: true });
        else {
          art('pratt.dizzy', px, d, { scale: S, sx: 1 + Math.sin(G.frame * 0.3) * 0.04 });
          if (t > TI.lowerEnd) text('?!', px + 10, d - 54, 10, C.yel, 'center', C.indigo);
        }
      }
      if (t >= TI.landAt && t < TI.landAt + 54) {
        const a = (t - TI.landAt) / 54;
        if (t < TI.landAt + 40) drawFlat('pratt', hx, d, TI.landAt + 40 - t, false, S); // Pratt flattened in front of the container (Chris 2026-11-11)
        pg.globalAlpha = 1 - a;
        for (let k = 0; k < 6; k++) {
          const ang = (k / 6) * 6.283;
          pg.beginPath();
          pg.arc(hx + Math.cos(ang) * (10 + a * 20), d - 6 + Math.sin(ang) * 4 * (1 + a), 3 - a * 2, 0, 7);
          pg.fillStyle = ink(C.cream);
          pg.fill();
        }
        pg.globalAlpha = 1;
        text(
          'SQUASH 800',
          hx,
          d - 40 - a * 14,
          9 + (t < TI.landAt + 8 ? (t - TI.landAt) * 0.6 : 4.8) * (1 - a * 0.5),
          C.yel,
          'center',
          C.indigo
        );
      }
      // Pinch scuttles in, winds up, charges and bonks into the container
      const stopX = hx + 32 + 16;
      if (t >= TI.crabIn[0]) {
        const cx =
          t < TI.crabIn[1]
            ? XR - ((XR - 250) * (t - TI.crabIn[0])) / (TI.crabIn[1] - TI.crabIn[0])
            : t < TI.chargeAt
              ? 250
              : t < TI.bonkAt
                ? 250 - ((250 - stopX) * (t - TI.chargeAt)) / (TI.bonkAt - TI.chargeAt)
                : stopX;
        if (t < TI.crabIn[1]) art('crab.scuttle' + (1 + (((cx / 6) | 0) & 1)), cx, d, { scale: S, flip: true });
        else if (t < TI.chargeAt) {
          art('crab.wind', cx + Math.sin(G.frame * 1.7), d, { scale: S, flip: true });
          text('!', cx, d - 40, 14, C.yel, 'center', C.indigo);
        } else if (t < TI.bonkAt) art('crab.charge', cx, d, { scale: S, flip: true, sx: 1.06 });
        else {
          if (t < TI.bonkAt + 34)
            text('BONK!', cx - 6, d - 44 - (t - TI.bonkAt) * 0.3, 11 + Math.min(4, (t - TI.bonkAt) * 0.5), C.yel, 'center', C.indigo);
          art('crab.dizzy', cx, d, { scale: S, flip: true, sx: 1 + Math.sin(G.frame * 0.3) * 0.04 });
          for (let k = 0; k < 3; k++) {
            const a = G.frame * 0.15 + k * 2.1;
            glyphStar(cx + Math.cos(a) * 12, d - 34 + Math.sin(a) * 3, 3.6, C.yel);
          }
        }
      }
    } // end of the scene's actors
    // the logo: nothing until the scene has played, a rising sweep, then it slams down (after that it stays up on later loops)
    const first = !G.introDone || T < TI.logoAt + 40,
      at = TI.logoAt;
    // (no shadow before the drop: Chris 2026-11-07, it looked silly)
    let ly = null;
    let idle = false;
    if (G.introDone && !(T >= at - 16 && T < at + 40 && first)) {
      ly = 40;
      idle = true;
    } else if (T >= at - 16) {
      const k = (T - (at - 16)) / 16;
      ly = k < 1 ? -70 + 110 * k * k : 40 - 7 * Math.sin(((T - at) / 7) * Math.PI) * Math.exp(-(T - at) / 9);
    }
    if (ly != null) {
      if (ART['logo.main']) {
        drawLogo(ly + 68, idle, T - (TI.logoAt + 40), PW / 2);
      } // PW here is the old field's 320
      else {
        text('PORT STACKER', PW / 2, ly - 4, 30, C.pink, 'center', C.indigo);
        rrect(PW / 2 - 46, ly + 14, 92, 18, 4, C.yel, C.indigo, 1.5);
        text('DELUXE', PW / 2, ly + 23.5, 12, C.indigo, 'center');
      }
    }
    if (G.introDone)
      TITLE_MENU.forEach((label, i) => {
        const sel = (G.titleSel || 0) === i,
          y = 116 + i * 14.5; // the title menu (four lines since the ENCYCLOPEDIA: a little tighter and smaller to stay clear of the scene)
        text(label, PW / 2, y, sel ? 11.5 : 9.5, sel ? C.cream : C.skyD, 'center', C.indigo);
        if (sel) {
          const ax = PW / 2 - textW(FONT_MAIN, label, 11.5) / 2 - 9 + Math.sin(G.frame * 0.15) * 1.5;
          glyphTri(ax, y, 5, 'right', C.yel);
        }
      }); // a drawn arrow beside the words (phones swapped in their own font arrow)
    // (no HI score on the title: it sat over the intro; the high-score board shows it, Chris 2026-11-07)
    // no build or device info on the title (Chris 2026-11-07): it's under INFO in the pause menu
    pg.restore();
  }
}
const TITLE_MENU = ['START GAME', 'HOW TO PLAY', 'ENCYCLOPEDIA', 'HIGH SCORES']; // (Chris 2026-11-11: the ENCYCLOPEDIA holds all the detail)
let LOGO_IDLE = 'swing'; // Chris's pick (Workshop logo-idle round 1, 2026-11-07). // how the logo moves once it has landed: still | float | hop | swing | wave (Workshop round logo-idle)
function drawLogo(bot, idle, k, cx) {
  // k: frames since it settled, so each movement eases in from rest (no jump when it starts)
  const a = ART['logo.main'],
    im = IMG['logo.main'],
    x = cx != null ? cx : PW / 2,
    f = G.frame;
  if (!a || !im || !im.complete) return;
  const mode = idle ? LOGO_IDLE : 'still',
    ramp = Math.min(1, Math.max(0, k || 0) / 60),
    kk = Math.max(0, k || 0);
  if (mode === 'float') {
    art('logo.main', x, bot + Math.sin(f * 0.05) * 1.6, { rot: Math.sin(f * 0.031) * 0.012 });
    return;
  }
  if (mode === 'hop') {
    const bf = 3600 / (RAG.bpm || 96),
      ph = (f % bf) / bf,
      land = Math.max(0, 1 - ph * 5); // a little hop on every beat of the music
    art('logo.main', x, bot - Math.sin(ph * Math.PI) * 2.6, { sx: 1 + land * 0.03, sy: 1 - land * 0.045 });
    return;
  }
  if (mode === 'swing') {
    pg.save();
    pg.translate(x, bot - a.h);
    pg.rotate(Math.sin(kk * 0.04) * 0.035 * ramp);
    pg.drawImage(im, -a.w / 2 - (a.ax || 0), 0, a.w, a.h); // (its anchor, as art() draws it landing: without, it jumped 1.7 px on starting to swing)
    pg.restore();
    return;
  } // hangs and swings from its top
  if (mode === 'wave') {
    const n = 42,
      sw = im.width / n,
      dw = a.w / n;
    for (let i = 0; i < n; i++)
      pg.drawImage(
        im,
        i * sw,
        0,
        sw + 0.5,
        im.height,
        x - a.w / 2 - (a.ax || 0) + i * dw,
        bot - a.h + Math.sin(f * 0.08 - i * 0.32) * 1.8,
        dw + 0.2,
        a.h
      );
    return;
  } // a ripple runs through the letters
  art('logo.main', x, bot);
}
function drawSplash() {
  // one tap so a phone will play sound, then the intro (the Retroid app skips this): just a small pink line
  rect(-LAY.ox, -LAY.oy, LAY.LW, LAY.LH, C.paper);
  if (G.state === 'splash' && ((G.frame >> 5) & 1 || G.frame < 20)) text('PRESS ANY BUTTON', PW / 2, PH / 2, 8, C.pink, 'center'); // (under the studio intro: just paper)
}
// replaced in 10e-menus.js
// replaced in 10e-menus.js
// replaced in 10e-menus.js
