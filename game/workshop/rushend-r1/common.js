// Workshop rushend round 1 (Chris 2026-11-11: "workshop big 3, 2, 1s"): the last three seconds of POWER RUSH counted down in big
// numbers. Each option sets RUSHN.draw(n, age, p) (n: 3, 2 or 1; age: frames since that number came up). Every option has the same
// sound, a beep on each number and a lower one as the rush ends, so only the look differs.
const RUSHN = { draw: null, last: 0 };
SFX.rushCount = n => (n ? tone(n === 1 ? 1175 : 988, 0.09, 'square', 0.12) : (tone(523, 0.12, 'square', 0.12), tone(392, 0.2, 'square', 0.1, 0, 0.1)));
const _rnDeath = drawDeath;
drawDeath = function () {
  _rnDeath.apply(this, arguments);
  const p = G.p;
  if (!p || !RUSHN.draw || !(G.state === 'play' || G.state === 'pause')) return;
  if (p.gold > 0 && p.gold <= 180) {
    const n = Math.ceil(p.gold / 60), age = 60 - (((p.gold - 1) % 60) + 1);
    if (n !== RUSHN.last && G.state === 'play') { RUSHN.last = n; SFX.rushCount(n); }
    RUSHN.draw(n, age, p);
  } else if (p.gold <= 0 && RUSHN.last) { RUSHN.last = 0; SFX.rushCount(0); RUSHN.endT = 30; }
  if (RUSHN.endT > 0 && RUSHN.drawEnd) { RUSHN.drawEnd(30 - RUSHN.endT, p); if (G.state === 'play') RUSHN.endT--; }
};
const rnPop = age => (age < 8 ? 1.35 - 0.35 * (age / 8) : 1); // each number lands big and settles
