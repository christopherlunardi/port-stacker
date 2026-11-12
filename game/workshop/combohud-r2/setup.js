newGame(); startLevel(1); G.state = 'play'; DEV.inv = true; G.score = 182400; G.p.x = 200; G.p.y = rowY(9);
for (let i = 0; i < 60; i++) update({ held: {}, pressed: {} });
G.combo = 11; G.comboT = 1e6; G.comboWin = 1e6;
