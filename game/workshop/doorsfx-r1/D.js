// D: ALARM. A two-tone warning bleep for each lamp, higher each time; the door opens with a hydraulic hiss and a clunk.
SFX.doorTick = function (n) { const f = 700 + n * 120; tone(f, 0.07, 'square', 0.05); tone(f * 0.8, 0.07, 'square', 0.05, 0, 0.08); };
SFX.doorOpen = function () { noise(0.35, 0.18, 5000); noise(0.35, 0.08, 2500); noise(0.05, 0.3, 450, 0.32); tone(85, 0.1, 'triangle', 0.18, 0, 0.32); };
