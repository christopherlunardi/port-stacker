// Option B: TUG AND BARGE. A stubby pink harbour tug at the left end, tall and round with a cream deckhouse, big portholes, a
// wheelhouse with a pink roof and a fat yellow funnel (indigo cap, pink band) chuffing blue smoke, its bow wedged with tyre
// fenders against a low flat orange barge that carries the containers: yellow rub rail, a row of indigo tyres along the side,
// pink bollards on the deck between the bays, and a raked cream bow plate with hazard stripes at the right.
C.smokeB = [0, 90, 0]; // pale blue puffs
drawShip = function (sx) {
  const d = L.plateY, f = G.frame, X = x => x + sx;
  pg.save(); pg.lineJoin = 'round'; pg.lineCap = 'round';
  // --- the barge: flat deck from the push knees to a raked bow ---
  pg.beginPath(); pg.moveTo(X(30), d); pg.lineTo(X(318), d); pg.lineTo(X(309), d + 15); pg.lineTo(X(30), d + 15); pg.closePath();
  pg.fillStyle = ink(C.orange); pg.fill(); pg.lineWidth = 1.3; pg.strokeStyle = ink(C.indigo); pg.stroke();
  pg.save(); pg.clip();
  rect(X(30), d + 0.8, 290, 2.6, C.yel); rect(X(30), d + 3.4, 290, 0.8, C.indigo); // rub rail
  rect(X(30), d + 11.5, 290, 0.8, C.indigo); rect(X(30), d + 12.3, 290, 4, C.cream); // boot-top (cream, mostly under the waves)
  // bow plate: cream with two pink hazard stripes
  pg.beginPath(); pg.moveTo(X(306), d); pg.lineTo(X(320), d); pg.lineTo(X(320), d + 16); pg.lineTo(X(297), d + 16); pg.closePath(); pg.fillStyle = ink(C.cream); pg.fill();
  pg.lineWidth = 2.6; pg.strokeStyle = ink(C.pink); pg.beginPath(); pg.moveTo(X(302), d + 16); pg.lineTo(X(309), d - 1); pg.moveTo(X(310), d + 16); pg.lineTo(X(317), d - 1); pg.stroke();
  pg.lineWidth = 1; pg.strokeStyle = ink(C.indigo); pg.beginPath(); pg.moveTo(X(306), d); pg.lineTo(X(297), d + 16); pg.stroke();
  pg.restore();
  // tyre fenders hanging along the side
  for (let x = 44; x < 290; x += 20) { pg.beginPath(); pg.arc(X(x), d + 7.6, 3, 0, 7); pg.fillStyle = ink(C.indigo); pg.fill(); pg.beginPath(); pg.arc(X(x), d + 7.6, 1.1, 0, 7); pg.fillStyle = ink(C.orange); pg.fill();
    pg.lineWidth = 0.8; pg.strokeStyle = ink(C.indigo); pg.beginPath(); pg.moveTo(X(x), d + 4.6); pg.lineTo(X(x), d + 2); pg.stroke(); }
  // bollards on the deck between the bays, and a coil of rope
  for (const x of [104, 120, 200, 216]) { rrect(X(x - 2.2), d - 5, 4.4, 5, 1.2, C.pink, C.indigo, 0.9); rrect(X(x - 3), d - 5.8, 6, 2, 0.8, C.pink, C.indigo, 0.8); }
  pg.lineWidth = 1.2; pg.strokeStyle = ink(C.indigo); pg.beginPath(); pg.moveTo(X(106), d - 3.6); pg.lineTo(X(118), d - 3.6); pg.moveTo(X(202), d - 3.6); pg.lineTo(X(214), d - 3.6); pg.stroke();
  pg.lineWidth = 0.6; pg.strokeStyle = ink(C.yel); pg.beginPath(); pg.moveTo(X(106), d - 3.6); pg.lineTo(X(118), d - 3.6); pg.moveTo(X(202), d - 3.6); pg.lineTo(X(214), d - 3.6); pg.stroke();
  // --- the tug: a round pink hull riding higher than the barge ---
  pg.beginPath(); pg.moveTo(X(2), d - 6); pg.lineTo(X(31), d - 6); pg.lineTo(X(33), d + 1); pg.lineTo(X(33), d + 15); pg.lineTo(X(6), d + 15); pg.quadraticCurveTo(X(-5), d + 12, X(-2), d - 1); pg.quadraticCurveTo(X(-1), d - 5, X(2), d - 6); pg.closePath();
  pg.fillStyle = ink(C.pink); pg.fill(); pg.lineWidth = 1.3; pg.strokeStyle = ink(C.indigo); pg.stroke();
  pg.save(); pg.clip(); rect(X(-6), d - 5.2, 40, 2.4, C.cream); rect(X(-6), d - 2.8, 40, 0.8, C.indigo); rect(X(-6), d + 11.5, 40, 0.8, C.indigo); rect(X(-6), d + 12.3, 40, 4, C.cream); pg.restore();
  for (const x of [5, 15, 25]) { pg.beginPath(); pg.arc(X(x), d + 5.5, 2.9, 0, 7); pg.fillStyle = ink(C.indigo); pg.fill(); pg.beginPath(); pg.arc(X(x), d + 5.5, 1.1, 0, 7); pg.fillStyle = ink(C.pink); pg.fill(); }
  pg.beginPath(); pg.arc(X(32.5), d - 2.5, 3.2, 0, 7); pg.fillStyle = ink(C.indigo); pg.fill(); pg.beginPath(); pg.arc(X(32.5), d - 2.5, 1.2, 0, 7); pg.fillStyle = ink(C.cream); pg.fill(); // the bow tyre wedged on the barge
  // deckhouse with portholes; the wheelhouse forward (big windows, pink roof) and the fat funnel aft, standing clear
  rrect(X(4), d - 24, 24, 19, 2, C.cream, C.indigo, 1.2);
  for (const x of [9, 16, 23]) { pg.beginPath(); pg.arc(X(x), d - 15.5, 2.3, 0, 7); pg.fillStyle = ink(C.sky); pg.fill(); pg.lineWidth = 0.8; pg.strokeStyle = ink(C.indigo); pg.stroke(); }
  rect(X(4.6), d - 8.5, 22.8, 2, C.pink);
  rrect(X(1), d - 50, 13, 27, 2, C.yel, C.indigo, 1.2); rect(X(1.6), d - 50, 11.8, 4.5, C.indigo); rect(X(1.6), d - 44, 11.8, 3, C.pink); // the big funnel
  rrect(X(14), d - 37, 16, 14, 2, C.cream, C.indigo, 1.2); rrect(X(12.5), d - 38.5, 19, 3, 1, C.pink, C.indigo, 0.9);
  for (const x of [16, 21, 26]) rrect(X(x), d - 34, 4, 6, 1, C.sky, C.indigo, 0.7);
  pg.lineWidth = 0.9; pg.strokeStyle = ink(C.indigo); pg.beginPath(); pg.moveTo(X(22), d - 38.5); pg.lineTo(X(22), d - 45); pg.stroke(); // mast light
  pg.beginPath(); pg.arc(X(22), d - 46.2, 1.4, 0, 7); pg.fillStyle = ink((f >> 4) & 1 ? C.yel : C.cream); pg.fill(); pg.stroke();
  // chuffing smoke: three puffs rising and drifting back off the funnel
  for (let i = 0; i < 3; i++) { const t = ((f * 0.014 + i / 3) % 1), r = 2 + t * 2.6;
    pg.globalAlpha = 0.9 * (1 - t); pg.beginPath(); pg.arc(X(7.5 - t * 4 + Math.sin(f * 0.06 + i * 2) * 1.5), d - 53 - t * 13, r, 0, 7); pg.fillStyle = ink(C.smokeB); pg.fill(); pg.lineWidth = 0.8; pg.strokeStyle = ink(C.indigo); pg.stroke(); }
  pg.restore();
};
