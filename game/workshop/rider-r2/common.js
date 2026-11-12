// Workshop rider round 2 (Chris 2026-11-11: "what if the pips were on the platform below so they don't take up gameplay area? And on the
// left, the same thing for squashable guys below", "the squashables would have to be a different color, maybe our blue"): the rider count
// moves down onto the catwalk under the container's right end (pink), and the left end shows who it would squash on the way down (blue).
// Each option sets PIPS.draw(side, n, x, y) — side 'ride' (right end) or 'squash' (left end), x the container's left, y its catwalk top.
const PIPS = { draw: null };
drawRiderPips = () => {}; // the build-209 tag is replaced by these
// who it would squash if it dropped now: anyone in its path from here down to where it would stop (one floor, plus one per rider; the same
// x reach and states as the squash in updatePieces). A guess about the future: they can still walk out of the way while it falls.
function wouldSquash(pc, riders) {
  let row = pc.row, y = pc.y;
  for (let leg = 0; leg <= riders; leg++) {
    let r = row + 1;
    while (r < ROWS && !(hasFloor(r, pc.c + 2) && hasFloor(r, pc.c + PIECE_W - 3))) r++;
    if (r >= ROWS) { y = plateTop(pc.c); break; }
    row = r; y = rowY(r);
  }
  let n = 0;
  for (const e of G.enemies)
    if ((e.state === 'walk' || e.state === 'stun') && !wouldRide(e, pc) && e.x >= pc.x - 3 && e.x <= pc.x + PIECE_W * T + 2 && e.y > pc.y && e.y <= y) n++;
  return n;
}
const _p2d = drawDeath;
drawDeath = function () {
  _p2d.apply(this, arguments);
  if (!PIPS.draw) return;
  for (const pc of G.pieces) {
    if (pc.state !== 'rest') continue;
    let r = 0;
    for (const e of G.enemies) if (wouldRide(e, pc)) r++;
    const s = wouldSquash(pc, r);
    if (r) PIPS.draw('ride', Math.min(r, 4), pc.x, pc.y);
    if (s) PIPS.draw('squash', Math.min(s, 4), pc.x, pc.y);
  }
};
const pipPulse = () => 0.5 + 0.5 * Math.sin(G.frame * 0.25);
const pipCol = side => (side === 'ride' ? C.pink : C.blue);
