// D: WHOOSH AND SPLAT. A rush of air as he falls, then a wet splat on landing.
SFX.crabFall = function () { for (let i = 0; i < 6; i++) noise(0.14, 0.05 + i * 0.03, 600 + i * 300, i * 0.1); };
SFX.crabLand = function () { noise(0.05, 0.4, 2200); noise(0.16, 0.35, 380, 0.02); tone(140, 0.16, 'sawtooth', 0.15, 55, 0.02); };
