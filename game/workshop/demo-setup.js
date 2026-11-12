// A frozen scene for comparing art: stage 1 mid-play, every kind of thing on screen at once.
newGame(); G.state = 'play'; DEV.inv = true; DEV.noEnemies = true; G.spawnQ = []; G.p.inv = 0;
G.p.x = 100; G.p.y = rowY(11); G.p.face = 1; G.p.anim = 4;
G.pieces[5].segs = [1, 1, 0, 0];
for (const i of [3, 2]) { const pc = G.pieces[i]; pc.state = 'plate'; pc.y = plateTop(pc.c); G.stacks[pc.c] += PIECEDEF[pc.type].h; G.stackN[pc.c]++; }
const mk = (x, r, dx, state) => ({ type: 'pratt', x, y: rowY(r), dx, dy: 0, acc: 0, speed: 0, chase: 0, state, t: 99999, anim: 0, rideOff: 0 });
G.enemies = [mk(212, 7, -1, 'walk'), mk(180, 15, 1, 'walk'), mk(300, 3, -1, 'stun')];
