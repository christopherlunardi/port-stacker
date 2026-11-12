// E: DOUBLE HONK. Two quick truck-horn blasts, HONK-HONK, with a bit of grit.
SFX.horn = function () { for (const d of [0, 0.17]) { hornVoice('sawtooth', 233, 228, 0.13, 0.18, 1600, d); hornVoice('sawtooth', 294, 288, 0.13, 0.14, 1600, d); hornVoice('square', 349, 340, 0.13, 0.05, 2000, d); } };
