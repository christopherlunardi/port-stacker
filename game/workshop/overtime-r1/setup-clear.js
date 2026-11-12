newGame(); G.loop = 4; startLevel(2); G.state = 'play'; DEV.inv = true; DEV.noEnemies = true; G.enemies = []; G.score = 412650; G.st.f = 95 * 60;
for (const pc of G.pieces) pc.state = 'plate';
for (let i = 0; i < 2000 && G.state !== 'clear'; i++) update({ held: {}, pressed: {} });
for (let i = 0; i < 260; i++) update({ held: {}, pressed: {} });
