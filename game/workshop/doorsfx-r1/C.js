// C: ARCADE. Clean beeps rising with each lamp, then a quick upward bwip and a whoosh as the door opens.
SFX.doorTick = function (n) { tone([523, 659, 784][n - 1] || 784, 0.08, 'square', 0.07); };
SFX.doorOpen = function () { tone(400, 0.14, 'square', 0.07, 1300); noise(0.22, 0.12, 1800, 0.05); };
