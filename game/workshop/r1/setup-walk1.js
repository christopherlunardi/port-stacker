// the demo scene on the second walking frame (worker1)
newGame(); G.state = 'play'; DEV.inv = true; DEV.noEnemies = true; G.spawnQ = []; G.p.inv = 0;
G.p.x = 124; G.p.y = rowY(13); G.p.face = 1;
G.pieces[5].segs = [1, 1, 1, 0, 0, 0, 0, 0];
for (const i of [3, 2]) { const pc = G.pieces[i]; pc.state = 'plate'; pc.y = plateTop(pc.c); G.stacks[pc.c] += PIECEDEF[pc.type].h; G.stackN[pc.c]++; }
const mk = (type, x, r, dx, state) => ({ type, x, y: rowY(r), dx, dy: 0, acc: 0, speed: 0, chase: 0, state, t: 99999, anim: 0, rideOff: 0 });
G.enemies = [mk('gull', 212, 8, -1, 'walk'), mk('crab', 180, 18, 1, 'walk'), mk('rat', 60, 3, 1, 'walk'), mk('gull', 300, 13, -1, 'stun')];
G.p.anim = 8;
