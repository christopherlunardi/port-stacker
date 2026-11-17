// the clip: the 1-1 demo played by the bot, without its DEMO PLAY lines; an extra life comes early (so the life bar fills and flashes),
// and Buck blows his horn now and then
drawAttract = () => {};
attractNext = 0;
attractStart();
G.lives = 3;
G.nextLife = 400;
const _cu = update;
update = function (inp) {
  const r = _cu.apply(this, arguments);
  if (G.p && G.state === 'play' && (window.__u === 140 || window.__u === 330 || window.__u === 470)) blowHorn(G.p, 0);
  return r;
};
0; // (so the setup's last value isn't a function: the recorder would call it)
