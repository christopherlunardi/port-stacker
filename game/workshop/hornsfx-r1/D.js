// D: PARTY AIR HORN. A bright, blaring major chord with a hard start and a quick drop at the end: BWAAH.
SFX.horn = function () { for (const f of [349, 440, 523]) { hornVoice('sawtooth', f, f, 0.32, 0.13, 3200); hornVoice('sawtooth', f, f * 0.84, 0.12, 0.1, 2400, 0.32); } };
