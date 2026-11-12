// E: CLOWN HONK-HONK. Two quick rubber honks, the second higher, cartoon-silly.
SFX.horn = function () { for (const [d, f] of [[0, 294], [0.15, 370]]) horn2({ f, dur: 0.13, vol: 0.24, type: 'square', voices: 2, detune: 22, drive: 4, formant: 1000, q: 4, scoop: 1.2, scoopT: 0.03, endBend: 0.88, delay: d, breath: 0.03 }); };
