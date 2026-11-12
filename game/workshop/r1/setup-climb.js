// the demo scene with the worker on a ladder (for checking climb0)
newGame(); G.state = 'play'; DEV.inv = true; DEV.noEnemies = true; G.spawnQ = []; G.p.inv = 0;
G.p.x = 212; G.p.y = rowY(12); G.p.face = 1;
G.pieces[5].segs = [1, 1, 1, 0, 0, 0, 0, 0];
for (const i of [3, 2]) { const pc = G.pieces[i]; pc.state = 'plate'; pc.y = plateTop(pc.c); G.stacks[pc.c] += PIECEDEF[pc.type].h; G.stackN[pc.c]++; }
G.enemies = [];
G.p.climb = true; G.p.anim = 0;
