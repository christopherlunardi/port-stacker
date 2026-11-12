// Close-up scene for the enemy options: the three pests (both walk frames) and a stunned gull in the zoomed middle of the field.
newGame(); G.state = 'play'; DEV.inv = true; DEV.noEnemies = true; G.spawnQ = []; G.p.inv = 0;
G.p.x = 60; G.p.y = rowY(13); G.p.face = 1;
const mk = (type, x, r, dx, state, anim) => ({ type, x, y: rowY(r), dx, dy: 0, acc: 0, speed: 0, chase: 0, state, t: 99999, anim, rideOff: 0 });
G.enemies = [mk('gull', 100, 13, 1, 'walk', 0), mk('gull', 124, 13, 1, 'walk', 8), mk('crab', 152, 13, 1, 'walk', 0), mk('crab', 176, 13, 1, 'walk', 8),
  mk('rat', 204, 13, 1, 'walk', 0), mk('rat', 228, 13, 1, 'walk', 8), mk('gull', 110, 8, -1, 'stun', 0), mk('crab', 160, 8, -1, 'walk', 0), mk('rat', 210, 8, -1, 'walk', 0)];
