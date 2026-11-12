// ---------- the dock worker ----------
// Modern feel over the original: the last direction you pressed wins at a crossing (and the other one is tried if it's blocked), ladders and
// floors snap you on from a few pixels away, B dashes, and the air horn (A) blasts the way he faces, or up or down with up or down held.
const DASH_FRAMES = 10,
  DASH_COOL = 40;
function makePlayer(c, r, horns) {
  return { x: c * T + 4, y: rowY(r), acc: 0, face: 1, climb: false, anim: 0, dash: 0, dashCd: 0, horns, inv: 90, axis: 'h' };
}
function updatePlayer(inp) {
  const p = G.p;
  const H = inp.held,
    P = inp.pressed;
  if (p.inv > 0) p.inv--;
  if (p.dashCd > 0) p.dashCd--;
  if (p.hornT > 0) p.hornT--;
  const h = H.left ? -1 : H.right ? 1 : 0;
  let v = H.up ? -1 : H.down ? 1 : 0;
  if (P.up || P.down) {
    p.wantV = P.up ? -1 : 1;
    p.wantT = 14;
  } else if (p.wantT > 0) p.wantT--; // a tap of up/down is remembered briefly, so walking onto a ladder you tapped for still takes it
  if (!v && h && p.wantT > 0) {
    const r = floorRowAt(p.y);
    if (r >= 0 && L.ladders.some(l => Math.abs(l.x - p.x) <= SNAP && ladderAt(l.x, p.y, p.wantV))) {
      v = p.wantV;
      p.axis = 'v';
    }
  }
  if (P.left || P.right) p.axis = 'h';
  if (P.up || P.down) p.axis = 'v';
  if (!h && v) p.axis = 'v';
  else if (h && !v) p.axis = 'h';
  if (P.b && p.dashCd === 0 && (h || v)) {
    p.dash = DASH_FRAMES;
    p.dashCd = DASH_COOL;
    SFX.dash();
  }
  const speed = (p.axis === 'v' ? 0.85 : 1) * (p.dash > 0 ? 2.6 : 1) * (p.gold > 0 ? GOLD.speed : 1) * buckSpeed(); // overtime's quicker Buck (buckSpeed); GOLD RUSH: quicker (Chris 2026-11-09)
  if (p.dash > 0) p.dash--;
  p.acc += h || v ? speed : 0;
  const n = Math.floor(p.acc);
  p.acc -= n;
  let moved = false;
  for (let i = 0; i < n; i++) {
    const first = p.axis,
      second = first === 'h' ? 'v' : 'h';
    const m = stepPlayer(p, first, h, v) || stepPlayer(p, second, h, v);
    if (!m) {
      p.acc = 0;
      break;
    }
    moved = true;
    p.dist = (p.dist || 0) + 1;
    if (m === 'v') {
      p.climb = true;
      p.wantT = 0;
      p.vdir = v;
    } else if (m === 'h') p.climb = false;
    pressPieces(p);
  }
  if (floorRowAt(p.y) < 0 || !hasFloor(floorRowAt(p.y), colOf(p.x))) p.climb = true;
  if (moved) {
    p.anim++;
    p.movedAt = G.frame;
  }
  if (P.a) blowHorn(p, H.left || H.right ? 0 : H.up ? -1 : H.down ? 1 : 0); // up or down aims it only held on its own (not a diagonal)
}
function blowHorn(p, v) {
  if (G.clouds.length) return;
  if (p.horns <= 0) {
    SFX.empty();
    addPop(p.x, p.y - 28, 'NO HORN', 'pink');
    return;
  }
  p.horns--;
  if (G.st) G.st.horns++;
  SFX.horn();
  p.hornT = 20; // shows the horn pose
  const onLadder = p.climb && floorRowAt(p.y) < 0;
  // on a ladder it blasts up or down (up unless down is held); on a catwalk the way he faces, or (Chris 2026-11-09) straight up or down
  // at the catwalk above or below while up or down is held on its own: a diagonal (a thumb resting low on the phone's d-pad) still
  // blasts the way he faces
  const vert = onLadder || !!v,
    dy = v || -1;
  p.hornDy = vert ? dy : 0; // for the horn pose
  G.clouds.push({
    x: vert ? p.x : p.x + p.face * 16,
    y: vert ? p.y - 12 + dy * 18 : p.y - 13,
    t: 24,
    face: vert ? 0 : p.face,
    dy: vert ? dy : 0,
    bx: p.x /* where Buck stood, for blastHits */,
    by: p.y
  });
}
// does the blast reach this enemy? (Chris 2026-11-09: a guy coming up a ladder right in front of Buck, inside the arcs, didn't freeze: the
// old check went by his feet. Then: generous, but never guys walking on the floors above or below, or anything that doesn't make sense.)
// His whole body (feet to 14 px up, 5 px either side) against the area the arcs sweep, only in front of Buck:
// - sideways: from Buck out to 38 px, and from 30 px above his feet to 18 below (a guy climbing up with his head and chest over the
//   catwalk); the catwalks above and below are 40 px away, so their walkers are always clear.
// - up or down a ladder: 18 px either side of the ladder, out to about 40 px the way he aimed (the next catwalk up, aiming up from near the
//   top: that's where the arcs reach); never behind him.
//   (down: his feet to 42 px below them; up: 50 px above his feet, the arcs start higher, at his head)
const HORN = { ahead: 52, behind: 15 }; // px from where he stands (was 43 ahead and 3 behind)
function blastHits(c, e) {
  if (c.face) {
    // (Chris 2026-11-11) a little further in front (HORN.ahead), and a short way behind him too (HORN.behind)
    const ahead = (e.x - c.bx) * c.face;
    return ahead > -HORN.behind && ahead < HORN.ahead && e.y > c.by - 30 && e.y < c.by + 18;
  }
  if (Math.abs(e.x - c.bx) >= 18) return false;
  return c.dy > 0 ? e.y > c.by - 10 && e.y < c.by + 42 : e.y > c.by - 50 && e.y < c.by + 4;
}
function updateClouds() {
  for (const c of G.clouds) {
    c.t--;
    for (const e of G.enemies)
      if (e.state === 'walk' && blastHits(c, e)) {
        e.state = 'stun';
        e.t = stunTime();
        if (GUARD(e.type) && e.mode !== 'patrol') (e.mode = 'patrol'), (e.acc = 0); // (Chris 2026-11-09) a frozen guard drops its rev or charge: it wakes up like it just arrived
        SFX.stun();
        if (G.st) G.st.stuns = (G.st.stuns || 0) + 1;
        if (PLAYING()) comboMove(1); // each enemy the horn hits is a move (the blast alone isn't)
      }
  }
  G.clouds = G.clouds.filter(c => c.t > 0);
}
