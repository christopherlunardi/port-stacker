// B: BULB HORN. A rubber squeeze horn: a quick squeak, then a fat nasal HONK that droops.
SFX.horn = function () { horn2({ f: 880, dur: 0.05, vol: 0.08, type: 'square', drive: 2, formant: 2400, breath: 0.04 }); horn2({ f: 311, dur: 0.28, vol: 0.24, type: 'square', voices: 2, detune: 18, drive: 4, formant: 950, q: 4, scoop: 1.15, scoopT: 0.05, endBend: 0.82, delay: 0.04, breath: 0 }); };
