// B: SLIDE WHISTLE AND BOING. A cartoon slide whistle down, then a springy boing as he lands.
SFX.crabFall = function () { tone(2100, 0.7, 'triangle', 0.09, 420); tone(2110, 0.7, 'sine', 0.04, 425); };
SFX.crabLand = function () { noise(0.05, 0.2, 400); tone(160, 0.35, 'sine', 0.2, 520); tone(320, 0.25, 'triangle', 0.06, 900, 0.03); };
