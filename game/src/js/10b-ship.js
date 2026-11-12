// ---------- the ship: Harbor Classic (Fable's option A, Chris's pick 2026-11-07); replaces drawShip in 10-render ----------
// Option A: HARBOR CLASSIC. The chunky cartoon freighter from the concept sheet: a deep blue hull with a pink boot-top at the
// waterline, a cream rub rail and a row of round portholes, a raised bow at the right with an anchor on its chain, and on the bow
// a two-tier cream bridge with blue windows and pink trim, a pink funnel with an indigo cap puffing cream smoke. A lifeboat on
// davits and a mast with a flapping pennant sit at the stern. Deck rails with stanchions show in the gaps between the bays.
C.hullA = [95, 255, 0];
C.smokeA = [120, 30, 0]; // hull blue with a touch of pink, deeper than the water; pink smoke like the concept
function drawShip(sx) {
  const d = L.plateY,
    f = G.frame,
    X = x => x + sx;
  pg.save();
  pg.lineJoin = 'round';
  pg.lineCap = 'round';
  // hull: rounded stern at the left, flat deck, a stepped-up forecastle at the right with a raked stem
  pg.beginPath();
  pg.moveTo(X(-26), d);
  pg.lineTo(X(288), d);
  pg.lineTo(X(288), d - 7);
  pg.lineTo(X(318), d - 7);
  pg.lineTo(X(307), d + 15);
  pg.lineTo(X(-16), d + 15);
  pg.quadraticCurveTo(X(-30), d + 13, X(-26), d);
  pg.closePath();
  pg.fillStyle = ink(C.hullA);
  pg.fill();
  pg.lineWidth = 1.3;
  pg.strokeStyle = ink(C.indigo);
  pg.stroke();
  // boot-top: a pink band at the waterline, following the stem and stern
  pg.save();
  pg.clip();
  rect(X(-32), d + 8.5, 352, 3.2, C.pink);
  rect(X(-32), d + 7.8, 352, 0.8, C.indigo);
  rect(X(-32), d + 11.7, 352, 0.8, C.indigo);
  rect(X(-32), d + 1.5, 322, 2, C.cream);
  rect(X(-32), d + 3.5, 322, 0.7, C.indigo); // rub rail along the deck
  pg.restore();
  // portholes
  for (let x = -14; x < 286; x += 12) {
    pg.beginPath();
    pg.arc(X(x), d + 5.6, 1.5, 0, 7);
    pg.fillStyle = ink(C.cream);
    pg.fill();
    pg.lineWidth = 0.7;
    pg.strokeStyle = ink(C.indigo);
    pg.stroke();
  }
  // deck rails between the bays and at the stern
  pg.lineWidth = 0.7;
  pg.strokeStyle = ink(C.indigo);
  pg.beginPath();
  for (const [a, b] of [
    [-24, 30],
    [98, 126],
    [194, 222]
  ]) {
    pg.moveTo(X(a), d - 4);
    pg.lineTo(X(b), d - 4);
    for (let x = a; x <= b; x += 5.5) {
      pg.moveTo(X(x), d - 4);
      pg.lineTo(X(x), d);
    }
  }
  pg.stroke();
  // stern: a lifeboat on davits and a mast with a pennant blowing back
  for (const x of [11, 25]) {
    pg.beginPath();
    pg.moveTo(X(x), d - 1);
    pg.lineTo(X(x), d - 13);
    pg.quadraticCurveTo(X(x), d - 16, X(x + 3), d - 15);
    pg.lineWidth = 0.9;
    pg.stroke();
  }
  pg.beginPath();
  pg.moveTo(X(7), d - 11);
  pg.lineTo(X(29), d - 11);
  pg.quadraticCurveTo(X(28), d - 4.5, X(22), d - 4.5);
  pg.lineTo(X(14), d - 4.5);
  pg.quadraticCurveTo(X(8), d - 4.5, X(7), d - 11);
  pg.closePath();
  pg.fillStyle = ink(C.orange);
  pg.fill();
  pg.lineWidth = 1;
  pg.stroke();
  rrect(X(8.5), d - 10.2, 19, 2, 0.8, C.cream, C.indigo, 0.5);
  rrect(X(29), d - 34, 2.2, 34, 1, C.yel, C.indigo, 0.8);
  rect(X(26), d - 26, 8, 1.4, C.indigo);
  const fl = Math.sin(f * 0.12) * 1.2;
  pg.beginPath();
  pg.moveTo(X(29), d - 34);
  pg.lineTo(X(19), d - 31 + fl);
  pg.lineTo(X(29), d - 28);
  pg.closePath();
  pg.fillStyle = ink(C.pink);
  pg.fill();
  pg.lineWidth = 0.8;
  pg.stroke();
  // bow: hawse hole, chain and anchor
  pg.beginPath();
  pg.arc(X(312), d - 4.5, 1.6, 0, 7);
  pg.fillStyle = ink(C.indigo);
  pg.fill();
  pg.fillStyle = ink(C.cream);
  pg.strokeStyle = ink(C.indigo);
  for (let i = 0; i < 2; i++) {
    pg.beginPath();
    pg.arc(X(311.6 - i * 0.3), d - 2 + i * 2, 0.9, 0, 7);
    pg.fill();
    pg.lineWidth = 0.5;
    pg.stroke();
  }
  pg.lineWidth = 2.4;
  pg.strokeStyle = ink(C.indigo);
  pg.beginPath();
  pg.moveTo(X(311), d);
  pg.lineTo(X(311), d + 7.5);
  pg.moveTo(X(308), d + 1.5);
  pg.lineTo(X(314), d + 1.5);
  pg.arc(X(311), d + 4, 3.6, 0.15 * Math.PI, 0.85 * Math.PI);
  pg.stroke();
  pg.lineWidth = 1;
  pg.strokeStyle = ink(C.cream);
  pg.beginPath();
  pg.moveTo(X(311), d + 0.5);
  pg.lineTo(X(311), d + 7);
  pg.moveTo(X(308.5), d + 1.5);
  pg.lineTo(X(313.5), d + 1.5);
  pg.arc(X(311), d + 4, 3.6, 0.2 * Math.PI, 0.8 * Math.PI);
  pg.stroke();
  // bridge: two cream tiers with blue windows and pink trim, the funnel behind
  rrect(X(291), d - 25, 26, 19, 2, C.cream, C.indigo, 1.2);
  rect(X(291.6), d - 11, 24.8, 3, C.pink);
  rect(X(291.6), d - 8, 24.8, 0.8, C.indigo);
  const lit = NIGHT(),
    WIN = lit ? C.yel : C.sky; // at night the bridge windows are lit, and glow
  for (let wx = 294; wx < 315; wx += 7) {
    rrect(X(wx), d - 21, 5, 6, 1, WIN, C.indigo, 0.7);
    if (lit) nightGlow(X(wx + 2.5), d - 18, 8, C.yel, 0.45);
  }
  for (let wx = 294; wx < 315; wx += 3.5) {
    pg.beginPath();
    pg.arc(X(wx + 1.3), d - 13.5, 0.6, 0, 7);
    pg.fillStyle = ink(C.indigo);
    pg.fill();
  }
  rrect(X(301), d - 50, 9, 20, 1.5, C.pink, C.indigo, 1.1);
  rect(X(301.5), d - 50, 8, 4, C.indigo);
  rect(X(301.5), d - 45, 8, 2, C.cream); // funnel
  rrect(X(294), d - 39, 20, 15, 2, C.cream, C.indigo, 1.2);
  rect(X(294.6), d - 39, 18.8, 1.8, C.pink);
  for (let wx = 296; wx < 312; wx += 5.5) {
    rrect(X(wx), d - 35, 4, 5, 1, WIN, C.indigo, 0.7);
    if (lit) nightGlow(X(wx + 2), d - 32.5, 7, C.yel, 0.4);
  }
  rrect(X(296), d - 29, 16, 2.4, 0.8, C.pink, C.indigo, 0.6);
  pg.beginPath();
  pg.moveTo(X(304), d - 39);
  pg.lineTo(X(304), d - 44);
  pg.lineWidth = 0.9;
  pg.strokeStyle = ink(C.indigo);
  pg.stroke(); // a little radar stub on the wheelhouse
  pg.beginPath();
  pg.arc(X(304), d - 44.5, 1.3, 0, 7);
  pg.fillStyle = ink(C.yel);
  pg.fill();
  pg.stroke();
  // smoke: three cream puffs drifting up and back from the funnel
  for (let i = 0; i < 3; i++) {
    const t = (f * 0.012 + i / 3) % 1,
      r = 1.8 + t * 2.4;
    pg.globalAlpha = 0.9 * (1 - t);
    pg.beginPath();
    pg.arc(X(305.5 - t * 9 + Math.sin(f * 0.05 + i) * 1.2), d - 53 - t * 13, r, 0, 7);
    pg.fillStyle = ink(C.smokeA);
    pg.fill();
    pg.lineWidth = 0.8;
    pg.strokeStyle = ink(C.indigo);
    pg.stroke();
  }
  pg.restore();
}
