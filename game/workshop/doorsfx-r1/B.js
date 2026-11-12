// B: FACTORY. Each lamp switches on with a relay click and a hum; the shutter rolls up with a rumble and stops with a clunk.
SFX.doorTick = function (n) { noise(0.02, 0.25, 3500); tone(110 + n * 10, 0.18, 'sawtooth', 0.025); };
SFX.doorOpen = function () { for (let i = 0; i < 5; i++) noise(0.12, 0.08 + i * 0.02, 260 + i * 40, i * 0.08); tone(55, 0.45, 'sawtooth', 0.05, 70); noise(0.05, 0.3, 500, 0.45); tone(90, 0.1, 'triangle', 0.15, 0, 0.45); };
