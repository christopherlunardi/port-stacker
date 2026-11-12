// Workshop best round 1 (Chris 2026-11-11: no stamps for NEW BEST! / ON THE BOARD! on the game-over card: "I don't really like the
// stamps", and in the millions the stamp overlaps the score). Each option sets BEST.draw(top, t, best, rank) — t: the card's age, best: a
// new best score, rank: its place on the board (1 = top) — drawn on the card after its own contents; the stamp is switched off.
const BEST = { draw: null, at: 56 }; // the count-up finishes at 54
const _bstamp = stamp;
stamp = function (label) {
  if (label === 'NEW BEST!' || label === 'ON THE BOARD!') return;
  return _bstamp.apply(this, arguments);
};
const _bcard = card;
card = function (a, b, o) {
  if (a === 'GAME OVER' && o && o.draw && BEST.draw && (G.newBest || G.made)) {
    const d = o.draw;
    o = Object.assign({}, o, {
      draw: top => {
        d(top);
        const rank = board().filter(e => e.s >= G.score).length + 1;
        BEST.draw(top, o.t, G.newBest, rank);
      }
    });
  }
  return _bcard(a, b, o);
};
const _bupd = update;
update = function (inp) {
  const r = _bupd.apply(this, arguments);
  if (G.state === 'over' && (G.newBest || G.made) && G.t === BEST.at) SFX.tallyDone(); // a ding as it comes up
  return r;
};
const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'TH' : ['TH', 'ST', 'ND', 'RD'][n % 10] || 'TH');
