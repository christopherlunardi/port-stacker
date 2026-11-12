// C: BOMB WHISTLE AND CLANG. A longer falling-bomb whistle, then a metal clang as he hits the steel catwalk.
SFX.crabFall = function () { tone(1500, 0.75, 'square', 0.03, 650); tone(1500, 0.75, 'sine', 0.06, 650); };
SFX.crabLand = function () { noise(0.06, 0.35, 2500); tone(620, 0.4, 'square', 0.06); tone(932, 0.35, 'triangle', 0.08); tone(110, 0.15, 'triangle', 0.2, 60); };
