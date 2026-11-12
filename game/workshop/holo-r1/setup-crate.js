seed(3); newGame(); startLevel(1); G.state='play'; DEV.noEnemies=true; G.enemies=[]; G.spawnQ=[]; G.p.inv=0; G.p.x=4; G.p.y=rowY(19);
{ const load = G.pieces.slice(); for (let i = 0; i < Math.ceil(load.length/2); i++) { load[i].state='plate'; load[i].y=999; } }
updateGold(); for (let i=0;i<100;i++) updateGold(); GOLD.wait = 1e6;
