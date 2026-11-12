// E: EEEOOO AND PLOP. A goofy falling "eeeooo" and a soft plop.
SFX.crabFall = function () { tone(900, 0.7, 'sawtooth', 0.04, 260); tone(905, 0.7, 'triangle', 0.07, 262); };
SFX.crabLand = function () { tone(420, 0.14, 'sine', 0.25, 110); noise(0.04, 0.15, 600); };
