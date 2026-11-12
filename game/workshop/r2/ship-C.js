// Option C: MODERN LINER. A long, low, cream hull with a bold pink band and a blue underbody, a sharp raked bow at the right
// with a yellow bulbous nose at the waterline, and the bridge aft at the left: a tall slim cream tower with three wraparound
// blue window strips (the top one wider, as bridge wings), a slanted pink exhaust stack, a mast with a slowly turning radar bar
// and a blinking pink light. Lashing frames stand between the bays and a chase of yellow deck lights runs along the rail.
C.glassC = [0, 150, 0]; C.keelC = [120, 255, 0]; // window glass: a deeper sky blue; the underbody: navy, darker than the water
drawShip = function (sx) {
  const d = L.plateY, f = G.frame, X = x => x + sx;
  pg.save(); pg.lineJoin = 'round'; pg.lineCap = 'round';
  // hull: flat transom at the stern, a long flat deck, a small flare up to the raked stem
  const hull = () => { pg.beginPath(); pg.moveTo(X(2), d); pg.lineTo(X(290), d); pg.lineTo(X(319), d - 5); pg.lineTo(X(303), d + 16); pg.lineTo(X(4), d + 16); pg.closePath(); };
  hull(); pg.fillStyle = ink(C.cream); pg.fill();
  pg.save(); hull(); pg.clip();
  rect(X(0), d + 3, 325, 4.8, C.pink); rect(X(0), d + 7.8, 325, 1, C.yel); // the band and its yellow pinstripe
  rect(X(0), d + 9.6, 325, 8, C.keelC); rect(X(0), d + 9, 325, 0.8, C.indigo); // blue underbody
  pg.lineWidth = 0.7; pg.strokeStyle = ink(C.indigo); pg.beginPath(); for (let i = 0; i < 3; i++) { pg.moveTo(X(307 + i * 1.6), d + 1 + i * 2.6); pg.lineTo(X(310 + i * 1.6), d + 1 + i * 2.6); } pg.stroke(); // draft marks at the bow
  pg.restore();
  hull(); pg.lineWidth = 1.3; pg.strokeStyle = ink(C.indigo); pg.stroke();
  pg.beginPath(); pg.ellipse(X(311), d + 11, 6.5, 2.4, 0, 0, 7); pg.fillStyle = ink(C.yel); pg.fill(); pg.lineWidth = 1.1; pg.stroke(); // bulbous bow
  rect(X(2), d - 1.2, 288, 1.2, C.indigo); // deck edge
  // lashing frames between the bays, and a chase of deck lights along the rail
  for (const a of [100, 196]) { rrect(X(a), d - 11, 24, 2.4, 0.6, C.cream, C.indigo, 0.8); for (const x of [a + 1.5, a + 12, a + 22.5]) rrect(X(x - 1), d - 10, 2, 10, 0.5, C.cream, C.indigo, 0.8);
    pg.lineWidth = 0.6; pg.strokeStyle = ink(C.indigo); pg.beginPath(); pg.moveTo(X(a + 2), d - 9); pg.lineTo(X(a + 11), d - 1.5); pg.moveTo(X(a + 11), d - 9); pg.lineTo(X(a + 2), d - 1.5); pg.moveTo(X(a + 13), d - 9); pg.lineTo(X(a + 22), d - 1.5); pg.moveTo(X(a + 22), d - 9); pg.lineTo(X(a + 13), d - 1.5); pg.stroke(); }
  let n = 0; for (const [a, b] of [[32, 96], [100, 124], [128, 192], [196, 220], [224, 288]]) for (let x = a + 4; x < b; x += 8, n++) { const on = ((f >> 3) + n) % 5 === 0;
    pg.beginPath(); pg.arc(X(x), d - 2.6, on ? 1.3 : 0.9, 0, 7); pg.fillStyle = ink(on ? C.yel : C.indigo); pg.fill(); if (on) { pg.lineWidth = 0.5; pg.strokeStyle = ink(C.indigo); pg.stroke(); } }
  // the bridge tower aft: cream, three window strips, the top one wider as the bridge wings, a pink cap band
  rrect(X(5), d - 44, 22, 44, 1.5, C.cream, C.indigo, 1.3);
  rrect(X(1), d - 42, 30, 7, 1.5, C.cream, C.indigo, 1.2); rrect(X(2.5), d - 40.5, 27, 4, 1, C.glassC, C.indigo, 0.7);
  for (const y of [d - 31, d - 22]) rrect(X(7), y, 18, 4, 1, C.glassC, C.indigo, 0.7);
  rect(X(5.6), d - 12, 20.8, 5, C.pink); rect(X(5.6), d - 7, 20.8, 1, C.yel); // the band carries on across the tower's foot
  pg.lineWidth = 0.7; pg.strokeStyle = ink(C.indigo); pg.beginPath(); pg.moveTo(X(5), d - 12); pg.lineTo(X(27), d - 12); pg.moveTo(X(5), d - 6); pg.lineTo(X(27), d - 6); pg.stroke();
  rrect(X(14), d - 17, 4, 5, 0.8, C.glassC, C.indigo, 0.7); // a door
  // slanted exhaust stack behind the wings, mast with radar bar and a blinking light
  pg.beginPath(); pg.moveTo(X(8), d - 44); pg.lineTo(X(12), d - 50); pg.lineTo(X(18), d - 50); pg.lineTo(X(16), d - 44); pg.closePath(); pg.fillStyle = ink(C.pink); pg.fill(); pg.lineWidth = 1.1; pg.strokeStyle = ink(C.indigo); pg.stroke();
  pg.beginPath(); pg.moveTo(X(11.3), d - 49); pg.lineTo(X(17.6), d - 49); pg.lineWidth = 1.6; pg.stroke();
  pg.lineWidth = 0.9; pg.beginPath(); pg.moveTo(X(23), d - 44); pg.lineTo(X(23), d - 51); pg.stroke();
  const ra = f * 0.04, rl = 3 * Math.abs(Math.cos(ra)); pg.lineWidth = 1.2; pg.beginPath(); pg.moveTo(X(23 - rl), d - 49.5); pg.lineTo(X(23 + rl), d - 49.5); pg.stroke(); // radar bar, seen turning
  pg.beginPath(); pg.arc(X(23), d - 52, 1.3, 0, 7); pg.fillStyle = ink((f >> 4) & 1 ? C.pink : C.pinkL); pg.fill(); pg.lineWidth = 0.7; pg.stroke();
  pg.restore();
};
