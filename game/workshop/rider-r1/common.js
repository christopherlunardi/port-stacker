// Workshop rider round 1 (Chris 2026-11-11: "some indication on a container if there is a guy in front of it that can get sent down as a
// rider"): while an enemy stands where he'd ride a container down if it dropped now (the same test as startFall), the container shows it.
// Each option sets RIDE.draw(pc, n, x, y, W, H) (n: how many would ride), drawn just after the container.
const RIDE = { draw: null };
function riderCount(pc) {
  let n = 0;
  for (const e of G.enemies)
    if ((e.state === 'walk' || e.state === 'stun') && e.y <= pc.y && e.y >= pc.y - RIDE_REACH && e.x >= pc.x - 2 && e.x <= pc.x + PIECE_W * T + 1) n++;
  return n;
}
// drawn over the enemies (after drawDeath, like the rush countdown), so nobody standing on the container hides it
const _rdd = drawDeath;
drawDeath = function () {
  _rdd.apply(this, arguments);
  if (!RIDE.draw || !(G.state === 'play' || G.state === 'pause')) return;
  for (const pc of G.pieces) {
    if (pc.state !== 'rest' || pc.gold) continue;
    const n = riderCount(pc);
    if (n) RIDE.draw(pc, n, pc.x, pc.y, PIECE_W * T, PIECEDEF[pc.type].h);
  }
};
const ridePulse = () => 0.5 + 0.5 * Math.sin(G.frame * 0.25);
