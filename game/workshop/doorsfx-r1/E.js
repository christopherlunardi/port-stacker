// E: BELLS. A little bell for each lamp, up a chord; the shutter rattles up softer and lower than now.
SFX.doorTick = function (n) { const f = [784, 988, 1175][n - 1] || 1175; tone(f, 0.4, 'triangle', 0.08); tone(f * 2.76, 0.15, 'sine', 0.02); };
SFX.doorOpen = function () { for (let i = 0; i < 6; i++) tone(700 + (i & 1) * 160, 0.03, 'triangle', 0.06, 0, i * 0.055); };
