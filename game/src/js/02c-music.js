// ---------- music: original ragtime and swing, synthesized (Chris 2026-11-07: music that stays satisfying forever) ----------
// A song is data in RAG:
//   bpm, beats (beats per bar: 2 for the old 2/4 rags, 4 for swing), swing (0..0.4: how late the off-beat slots land; 0.33 = triplet swing)
//   sections: { I: {chords: [...], tune: [...]}, A1: ..., } any number of bars each; form: ['I','A1','A2','B','A3']; loopFrom: form index
//     the loop goes back to (so an intro plays once).
//   chords[bar]: one or more chord symbols, splitting the bar evenly ('F6 D7b9' = two beats each; 'F6 F6 Gm7 C7' = a beat each).
//     Symbols: root + 6 m6 7 m7 maj7 9 m9 13 7b9 7#9 7#5 dim7 m7b5 aug, or none for a plain triad (C, Am).
//   tune[bar]: slots across the bar (8 = eighths in 4/4, sixteenths in 2/4). A note (C5, Bb5, F#6) holds until the next note or '-';
//     '.' holds, '-' rests. 'D#6^E6' = E6 with a grace note D#6 just before it; 'F6+' = F6 in octaves (F5 under it).
//     vary: true jumps the repeats an octave every other time round. A bar ending ' !' is a stop-time break: the band hits the downbeat and lets the tune answer alone.
//   bass: 'oompah' | 'habanera' | 'walk' (jazz walking line with chromatic approaches) | 'stride' (low root, mid chord, low fifth, chord)
//   comp: chords for the walk style ('swing': short stabs with pushes)   drums: true (brushes for 2/4, a swing ride kit for 4/4)
//   lead: an instrument, or a list that changes each time round the loop: honky, piano, trumpet, clarinet, vibes, calliope, mallet, pulse (8-bit)
//   bass 'bounce' (8-bit octave bass, bassVoice tri) or 'ragleft' (ragtime left hand: bass on the beat, chord on the and); comp 'offbeat'
//   (short chords on 2 and 4 in compVoice); drums 'chip' (8-bit noise hat, snare, kick)
//   double: 'octave' doubles the tune an octave down (stride piano right hand)
// Old songs with A/B sections and a 16-bar form still play (sections default to song[name]).
const NOTE_I = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11
};
const QUAL = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  6: [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  7: [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  9: [0, 4, 7, 10, 14],
  m9: [0, 3, 7, 10, 14],
  13: [0, 4, 10, 14, 21],
  '7b9': [0, 4, 7, 10, 13],
  '7#9': [0, 4, 7, 10, 15],
  '7#5': [0, 4, 8, 10],
  dim7: [0, 3, 6, 9],
  dim: [0, 3, 6, 9],
  m7b5: [0, 3, 6, 10],
  aug: [0, 4, 8]
};
// what the comping hand plays, above the root (the bass has the root): only real chord notes, so nothing lands a step apart
// (Chris's pick, Workshop chords round 2, 2026-11-08: 7th chords are the 3rd, 5th and 7th; the old jazz voicings with added 9ths and
// 13ths, crammed into one octave and cut to three notes, made smudgy clusters and lost the 7th)
const VOICE = {
  '': [4, 7, 12],
  m: [3, 7, 12],
  6: [4, 9, 12],
  m6: [3, 9, 12],
  7: [4, 7, 10],
  m7: [3, 7, 10],
  maj7: [4, 7, 11],
  9: [4, 10, 14],
  m9: [3, 10, 14],
  13: [4, 10, 21],
  '7b9': [4, 10, 13],
  '7#9': [4, 10, 15],
  '7#5': [4, 8, 10],
  dim7: [3, 6, 9],
  dim: [3, 6, 9],
  m7b5: [3, 6, 10],
  aug: [4, 8, 12]
};
function chordOf(sym) {
  const m = /^([A-G][b#]?)(.*)$/.exec(sym || 'C');
  const q = m && QUAL[m[2]] ? m[2] : '';
  return { root: m ? NOTE_I[m[1]] : 0, q, tones: QUAL[q], voice: VOICE[q] };
}
function midiOf(n) {
  const m = /^([A-G][b#]?)(\d)$/.exec(n);
  return m ? 12 * (+m[2] + 1) + NOTE_I[m[1]] : null;
}
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
// The game's song: Dockside Rag, dressed up, with a trio (Chris's pick, Workshop music round 4, 2026-11-07). Flourishes, octaves, stop-time,
// an intro vamp, octave-up repeats, and a third strain in F on the cakewalk rhythm. The plain first version is kept below as DOCKSIDE_PLAIN.
let RAG = (() => {
  const sec = bars => ({ chords: bars.map(b => b[0]), tune: bars.map(b => b[1]) });
  const A = [
    ['C', 'E5 G5 C6 . D#6^E6 . D6 C6'],
    ['C', 'A5 . G5 . E5 G5 - -'],
    ['G7', 'F5 A5 D6 . E6^F6 . E6 D6'],
    ['G7', 'B5 . G5 . D5 F5 E5 D#5'],
    ['C', 'E5 G5 C6 . D#6^E6 . D6 C6'],
    ['C7', 'Bb5 . G5 . E5 F5 F#5 G5'],
    ['F', 'A5+ C6+ F6+ . G#6^A6+ . G6+ F6+'],
    ['F', 'E6 . C6 . A5 . F#5 G5 !'],
    ['C', 'G5 - E5 G5 C6 . E6 -'],
    ['A7', 'C6^C#6 . E6 . A5 C#6 - -'],
    ['D7', 'D6 F#5 A5 D6 . F#6 . E6'],
    ['G7', 'D6 . B5 . G5 - F5 -'],
    ['C', 'E5 G5 C6 . E6 D6 C6 B5'],
    ['G7', 'D6 . B5 G5 . F5 D5 -'],
    ['C', 'C5 E5 G5 C6 . . G5 -']
  ];
  const B = [
    ['F', 'A5 - A5 C6 . A5 C6 - !'],
    ['F', 'F6 . E6 F6 . C6 A5 - !'],
    ['C7', 'G5 - G5 Bb5 . G5 Bb5 - !'],
    ['C7', 'E6 . D6 E6 . C6 G5 -'],
    ['C7', 'Bb5 . A5 Bb5 . G5 E5 -'],
    ['C7', 'C5 E5 G5 Bb5 . . C6 -'],
    ['F', 'A5+ C6+ F6+ . C6 A5 F5 -'],
    ['F', 'A5 . . . C6 . - -'],
    ['F', 'A5 - A5 C6 . A5 C6 -'],
    ['F7', 'D6^Eb6 . D6 Eb6 . C6 A5 -'],
    ['Bb', 'D6 . Bb5 D6 . F6 . D6'],
    ['Bbm', 'Db6 . Bb5 . F5 Ab5 . -'],
    ['F', 'C6 A5 F5 A5 C6 . F6 -'],
    ['D7', 'F6^F#6+ . D6 . A5 C6 . F#5'],
    ['G7', 'G5 B5 D6 F6+ . . D6 B5']
  ];
  const C1 = [
    ['F', 'A5 C6 . A5 F5 . - - !'],
    ['F', 'A5 C6 . A5 G5 . - - !'],
    ['C7', 'G5 Bb5 . G5 E5 . - -'],
    ['C7', 'G5 Bb5 . G5 C6 . - -'],
    ['F', 'A5 C6 . A5 F5 . A5 .'],
    ['Bb', 'Bb5 D6 . Bb5 F5 . D5 .'],
    ['F C7', 'C5 . F5 . A5 . G5 .'],
    ['F', 'F5 . . . - - C5 E5'],
    ['F', 'A5 C6 . A5 F5 . - -'],
    ['D7', 'A5 C6 . A5 F#5 . - -'],
    ['Gm', 'Bb5 D6 . Bb5 G5 . - -'],
    ['C7', 'Bb5 C6 . Bb5 E5 . - -'],
    ['F', 'A5+ . C6+ . F6+ . C6 .'],
    ['D7', 'D6 . C6 . A5 . F#5 .'],
    ['G7', 'G5 . B5 . D6 . F6 .']
  ];
  return {
    name: 'Dockside Rag (with a trio)',
    bpm: 96,
    beats: 2,
    swing: 0,
    lead: 'honky',
    bass: 'ragleft',
    vary: true,
    sections: {
      I: sec([
        ['C', 'C6+ . . . G5 . E5 .'],
        ['A7', 'C#6+ . . . A5 . E5 .'],
        ['D7', 'D6+ . . . A5 . F#5 .'],
        ['G7', 'G5 . F5 . D5 . D#5 .']
      ]),
      A1: sec([...A, ['C', 'C6+ . . . G5 A5 B5 -']]),
      A2: sec([...A, ['C C7', 'C6+ . . . G5 . Bb5 .']]),
      B1: sec([...B, ['C7', 'C6 . Bb5 . G5 E5 C5 -']]),
      B2: sec([...B, ['C7', 'C6 . Bb5 . G5 E5 D5 D#5']]),
      C1: sec([...C1, ['F', 'F5 . . . - - C5 E5']]),
      C2: sec([...C1, ['G7', 'G5 . F5 . D5 . D#5 .']])
    },
    form: ['I', 'A1', 'A2', 'B1', 'B2', 'A1', 'C1', 'C2'],
    loopFrom: 1
  };
})();
const DOCKSIDE_PLAIN = {
  name: 'Dockside Rag',
  bpm: 96,
  beats: 2,
  voice: 'honky',
  bass: 'oompah',
  A: {
    chords: ['C', 'C', 'G7', 'G7', 'C', 'C7', 'F', 'F', 'C', 'A7', 'D7', 'G7', 'C', 'G7', 'C', 'C'],
    tune: [
      'E5 G5 C6 . E6 . D6 C6',
      'A5 . G5 . E5 G5 - -',
      'F5 A5 D6 . F6 . E6 D6',
      'B5 . G5 . D5 F5 - -',
      'E5 G5 C6 . E6 . D6 C6',
      'Bb5 . G5 . E5 C5 - -',
      'A5 C6 F6 . A6 . G6 F6',
      'E6 . C6 . A5 - - -',
      'G5 - E5 G5 C6 . E6 -',
      'C#6 . E6 . A5 C#6 - -',
      'D6 F#5 A5 D6 . F#6 . E6',
      'D6 . B5 . G5 - F5 -',
      'E5 G5 C6 . E6 D6 C6 B5',
      'D6 . B5 G5 . F5 D5 -',
      'C5 E5 G5 C6 . . G5 -',
      'C6 . . . - - - -'
    ]
  },
  B: {
    chords: ['F', 'F', 'C7', 'C7', 'C7', 'C7', 'F', 'F', 'F', 'F7', 'Bb', 'Bbm', 'F', 'D7', 'G7', 'C7'],
    tune: [
      'A5 - A5 C6 . A5 C6 -',
      'F6 . E6 F6 . C6 A5 -',
      'G5 - G5 Bb5 . G5 Bb5 -',
      'E6 . D6 E6 . C6 G5 -',
      'Bb5 . A5 Bb5 . G5 E5 -',
      'C5 E5 G5 Bb5 . . C6 -',
      'A5 C6 F6 . C6 A5 F5 -',
      'A5 . . . C6 . - -',
      'A5 - A5 C6 . A5 C6 -',
      'Eb6 . D6 Eb6 . C6 A5 -',
      'D6 . Bb5 D6 . F6 . D6',
      'Db6 . Bb5 . F5 Ab5 . -',
      'C6 A5 F5 A5 C6 . F6 -',
      'F#6 . D6 . A5 C6 . F#5',
      'G5 B5 D6 F6 . . D6 B5',
      'C6 . Bb5 . G5 E5 C5 -'
    ]
  },
  form: ['A', 'A', 'B', 'B', 'A']
};
let musicOn = store.get('music', true),
  musicGain = null,
  mus = { t: 0, part: 0, bar: 0, loop: 0, timer: 0, prevVoice: null, bassPrev: 41 };

// ---------- instruments ----------
let WAVES = null;
function waves() {
  if (WAVES || !AC) return WAVES;
  const mk = amps => {
    const re = new Float32Array(amps.length + 1),
      im = new Float32Array(amps.length + 1);
    amps.forEach((a, i) => {
      im[i + 1] = a;
    });
    return AC.createPeriodicWave(re, im);
  };
  WAVES = {
    piano: mk([1, 0.42, 0.3, 0.16, 0.12, 0.07, 0.05, 0.03, 0.02]),
    reed: mk([1, 0.05, 0.55, 0.04, 0.32, 0.03, 0.18, 0.02, 0.1]),
    brass: mk([1, 0.8, 0.62, 0.5, 0.4, 0.3, 0.22, 0.16, 0.12, 0.08]),
    pulse: mk(Array.from({ length: 24 }, (_, i) => Math.abs(Math.sin((i + 1) * Math.PI * 0.25)) / (i + 1)))
  };
  return WAVES;
} // pulse: a 25% duty pulse, the 8-bit lead sound
function env(g, at, a, peak, dec, sus, end) {
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + a);
  if (dec) g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * sus), at + a + dec);
  g.gain.exponentialRampToValueAtTime(0.0001, end);
}
function vibrato(o, at, end, rate, cents, delay) {
  const l = AC.createOscillator(),
    lg = AC.createGain();
  l.frequency.value = rate;
  lg.gain.setValueAtTime(0, at);
  lg.gain.linearRampToValueAtTime(cents, at + delay + 0.1);
  l.connect(lg);
  lg.connect(o.detune);
  l.start(at);
  l.stop(end);
}
function voiceNote(voice, m, at, dur, vol) {
  if (!AC || !musicGain || at < MUS_CUT) return;
  if (voice === 'honky' && !mus.menu) return marimbaNote(m, at, dur, vol * 0.89); // (in the game: the marimba, as loud as the piano)
  const f = hz(m),
    W = waves(),
    out = musicGain;
  const osc = (type, det) => {
    const o = AC.createOscillator();
    if (W && W[type]) o.setPeriodicWave(W[type]);
    else o.type = type;
    o.frequency.value = f;
    o.detune.value = det || 0;
    return o;
  };
  const play = (o, g, end, filt) => {
    if (filt) {
      o.connect(filt);
      filt.connect(g);
    } else o.connect(g);
    g.connect(out);
    o.start(at);
    o.stop(end + 0.05);
  };
  if (voice === 'piano') {
    const end = at + Math.min(2.2, Math.max(0.35, dur * 1.6)),
      lp = AC.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(5200, at);
    lp.frequency.exponentialRampToValueAtTime(1400, at + 0.6);
    lp.connect(out);
    for (const det of [-4, 4]) {
      const o = osc('piano', det),
        g = AC.createGain();
      env(g, at, 0.004, vol * 0.6, 0.18, 0.35, end);
      o.connect(g);
      g.connect(lp);
      o.start(at);
      o.stop(end + 0.05);
    }
    return;
  }
  if (voice === 'trumpet') {
    const end = at + dur + 0.06,
      o = osc('brass'),
      g = AC.createGain(),
      lp = AC.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 1.5;
    lp.frequency.setValueAtTime(500, at);
    lp.frequency.exponentialRampToValueAtTime(2600, at + 0.05);
    lp.frequency.exponentialRampToValueAtTime(1700, at + 0.2);
    o.detune.setValueAtTime(-35, at);
    o.detune.linearRampToValueAtTime(0, at + 0.05);
    if (dur > 0.3) vibrato(o, at, end, 5.5, 14, 0.18);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.03);
    g.gain.setValueAtTime(vol * 0.85, Math.max(at + 0.04, at + dur - 0.04));
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    play(o, g, end, lp);
    return;
  }
  if (voice === 'clarinet') {
    const end = at + dur + 0.06,
      o = osc('reed'),
      g = AC.createGain(),
      lp = AC.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2200;
    if (dur > 0.3) vibrato(o, at, end, 5, 10, 0.22);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.035);
    g.gain.setValueAtTime(vol * 0.9, Math.max(at + 0.04, at + dur - 0.03));
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    play(o, g, end, lp);
    return;
  }
  if (voice === 'vibes') {
    const end = at + Math.min(2.4, Math.max(0.6, dur * 2));
    for (const [mul, a, d] of [
      [1, 1, 1],
      [4, 0.18, 0.25],
      [10.1, 0.05, 0.08]
    ]) {
      const o = AC.createOscillator(),
        g = AC.createGain();
      o.frequency.value = f * mul;
      env(g, at, 0.003, vol * a, d === 1 ? 0 : d, 0.01, d === 1 ? end : at + d + 0.1);
      if (d === 1) {
        const t = AC.createOscillator(),
          tg = AC.createGain();
        t.frequency.value = 5.5;
        tg.gain.value = 0.3;
        t.connect(tg);
        tg.connect(g.gain);
        t.start(at);
        t.stop(end);
      }
      play(o, g, d === 1 ? end : at + d + 0.1, null);
    }
    return;
  }
  if (voice === 'celesta') {
    // POWER RUSH's candy chime (Chris 2026-11-09): a music-box celesta, a clean bell with a glassy ping on top
    const end = at + Math.min(1.2, Math.max(0.35, dur * 1.4));
    for (const [mul, a, d] of [
      [1, 1, 0.9],
      [2, 0.35, 0.35],
      [5.04, 0.16, 0.12],
      [8.9, 0.06, 0.05]
    ]) {
      const o = AC.createOscillator(),
        g = AC.createGain();
      o.type = 'sine';
      o.frequency.value = f * mul;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(vol * a, at + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, Math.min(end, at + d + dur * (mul === 1 ? 1 : 0.3)));
      play(o, g, end, null);
    }
    return;
  }
  if (voice === 'pulse' || voice === 'square') {
    const end = at + dur,
      o = osc(voice === 'pulse' ? 'pulse' : 'square'),
      g = AC.createGain(); // 8-bit lead (pulse) and accompaniment (square)
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.004);
    g.gain.setValueAtTime(vol, Math.max(at + 0.005, end - 0.02));
    g.gain.exponentialRampToValueAtTime(vol * 0.6, Math.max(at + 0.006, end - 0.02) + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, end + 0.01);
    if (dur > 0.35) vibrato(o, at, end, 6, 9, 0.2);
    play(o, g, end, null);
    return;
  }
  if (voice === 'tri') {
    const end = at + dur,
      o = osc('triangle'),
      g = AC.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.003);
    g.gain.setValueAtTime(vol, Math.max(at + 0.004, end - 0.015));
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    play(o, g, end, null);
    return;
  }
  if (voice === 'bass') {
    const end = at + Math.max(0.25, dur) + 0.12,
      o = osc('triangle'),
      o2 = osc('sine'),
      g = AC.createGain(),
      lp = AC.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1400, at);
    lp.frequency.exponentialRampToValueAtTime(420, at + 0.12);
    env(g, at, 0.006, vol, 0.12, 0.5, end);
    o.connect(lp);
    o2.connect(lp);
    lp.connect(g);
    g.connect(out);
    o.start(at);
    o2.start(at);
    o.stop(end + 0.05);
    o2.stop(end + 0.05);
    return;
  }
  // calliope (steam organ), mallet (xylophone), and the old honky-tonk piano
  const parts =
    voice === 'calliope'
      ? [
          ['sine', 0, 1],
          ['square', 1200, 0.07],
          ['sine', 1902, 0.12]
        ]
      : voice === 'mallet'
        ? [
            ['sine', 0, 1],
            ['triangle', 2400, 0.22]
          ]
        : [
            ['triangle', 0, 1],
            ['square', 7, 0.18],
            ['triangle', -6, 0.55]
          ];
  for (const [type, det, v] of parts) {
    const o = AC.createOscillator(),
      g = AC.createGain();
    o.type = type;
    o.frequency.value = f;
    o.detune.value = det;
    g.gain.setValueAtTime(0.0001, at);
    if (voice === 'calliope') {
      g.gain.exponentialRampToValueAtTime(vol * v * 0.8, at + 0.02);
      g.gain.setValueAtTime(vol * v * 0.8, at + Math.max(0.03, dur * 0.85));
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur + 0.06);
      vibrato(o, at, at + dur + 0.3, 6, 9, 0);
    } else if (voice === 'mallet') {
      g.gain.exponentialRampToValueAtTime(vol * v * 1.2, at + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22 + Math.min(dur, 0.2));
    } else {
      g.gain.exponentialRampToValueAtTime(vol * v, at + 0.008);
      g.gain.exponentialRampToValueAtTime(vol * v * 0.35, at + 0.09);
      g.gain.exponentialRampToValueAtTime(0.0001, at + Math.max(0.12, dur) + 0.12);
    }
    o.connect(g);
    g.connect(out);
    o.start(at);
    o.stop(at + dur + 0.3);
  }
}
function pianoNote(m, at, dur, vol) {
  voiceNote('honky', m, at, dur, vol);
}
function drum(kind, at, vol) {
  // brushes, ride, hat, kick, snare: filtered noise and a thump
  if (!AC || !musicGain || !noiseBuf || at < MUS_CUT) return;
  const out = musicGain;
  if (kind === 'kick') {
    const o = AC.createOscillator(),
      g = AC.createGain();
    o.frequency.setValueAtTime(110, at);
    o.frequency.exponentialRampToValueAtTime(45, at + 0.12);
    env(g, at, 0.003, vol, 0, 0, at + 0.18);
    o.connect(g);
    g.connect(out);
    o.start(at);
    o.stop(at + 0.2);
    return;
  }
  const s = AC.createBufferSource(),
    f = AC.createBiquadFilter(),
    g = AC.createGain();
  s.buffer = noiseBuf;
  const spec = {
    ride: ['highpass', 6500, 0.28],
    hat: ['highpass', 8000, 0.05],
    snare: ['bandpass', 1800, 0.14],
    brush: ['bandpass', 5000, 0.06],
    thud: ['lowpass', 120, 0.12]
  }[kind];
  f.type = spec[0];
  f.frequency.value = spec[1];
  env(g, at, 0.002, vol, 0, 0, at + spec[2]);
  s.connect(f);
  f.connect(g);
  g.connect(out);
  s.start(at, Math.random() * 0.5);
  s.stop(at + spec[2] + 0.02);
  if (kind === 'ride') {
    const o = AC.createOscillator(),
      og = AC.createGain();
    o.type = 'square';
    o.frequency.value = 3150;
    env(og, at, 0.002, vol * 0.02, 0, 0, at + 0.22);
    o.connect(og);
    og.connect(out);
    o.start(at);
    o.stop(at + 0.25);
  }
}

// ---------- the band ----------
function sectionOf(song, name) {
  return (song.sections && song.sections[name]) || song[name];
}
const LEAD_GAIN = 0.8; // the tune's loudness against the band (Chris 2026-11-08: slightly too loud)
function voiceChord(ch, prev) {
  // the comping hand: each chord as close as it can be to the last (smooth voice leading, kept in one place), but its middle held
  // between E4 and G4 so it can't drift down into the bass or up into the tune (Workshop chords round 2)
  const centre = Math.max(VOICE_LO, Math.min(VOICE_HI, prev ? prev.reduce((a, b) => a + b, 0) / prev.length : (VOICE_LO + VOICE_HI) / 2));
  return ch.voice
    .map(iv => {
      const pc = (ch.root + iv) % 12;
      let n = pc + 12 * Math.round((centre - pc) / 12);
      while (n < centre - 6) n += 12;
      while (n >= centre + 6) n -= 12;
      return n;
    })
    .sort((a, b) => a - b);
}
const VOICE_LO = 63,
  VOICE_HI = 66;
function bassNear(pc, prev) {
  let n = pc + 12 * Math.round((prev - pc) / 12);
  while (n < 36) n += 12;
  while (n > 55) n -= 12;
  return n;
}
// POWER RUSH (Chris 2026-11-09): the same song carries on from where it is, no restart, just quicker (goldMusic) and in candy: the tune on
// a celesta with a chime an octave up, the left hand's chords on bells, and a drum beat. It turns on and off at the next bar line.
// THE GAME ON MARIMBA (Chris 2026-11-11, from the Workshop keys round: "game is marimba, menus are what we have"): while you play, the
// honky-tonk piano's part (the tune and the left hand) is played on a marimba (the Workshop's option G); on the menus (the title and its
// demos and high scores, How to Play, the Encyclopedia, the high-score screens, and the pause menu, quieter as before) it stays the piano.
// A change cuts over at once (musicCutover), like POWER RUSH's.
const MENU_STATES = ['title', 'howto', 'board', 'initials', 'pause', 'over'];
const musMenu = () => typeof G !== 'undefined' && (MENU_STATES.includes(G.state) || !!G.attract);
function marimbaNote(m, at, dur, vol) {
  const f = hz(m),
    end = at + Math.min(0.9, 0.25 + dur * 0.6);
  for (const [mul, v, len] of [
    [1, 1.25, 0],
    [3.9, 0.25, 0.07],
    [10, 0.06, 0.025]
  ]) {
    // the bar, its woody overtone, and the knock
    const o = AC.createOscillator(),
      g = AC.createGain();
    o.type = 'sine';
    o.frequency.value = f * mul;
    env(g, at, mul === 1 ? 0.002 : 0.001, Math.max(0.0002, vol * v), mul === 1 ? 0.05 : 0, mul === 1 ? 0.6 : 1, len ? at + len : end);
    o.connect(g);
    g.connect(musicGain);
    o.start(at);
    o.stop(end + 0.05);
  }
}
const musRush = () => typeof G !== 'undefined' && !!G.p && G.p.gold > 0 && (G.state === 'play' || G.state === 'howto');
function scheduleBar(at, sec, bar, loop, rep) {
  const rush = musRush();
  const song = RAG,
    S = sectionOf(song, sec),
    beats = song.beats || 2,
    beat = 60 / song.bpm,
    barLen = beat * beats;
  let tuneStr = S.tune[bar] || '';
  const stop = / !$/.test(tuneStr);
  if (stop) tuneStr = tuneStr.replace(/ !$/, '');
  const tune = tuneStr.trim().split(/\s+/),
    n = tune.length || 8,
    slot = barLen / n,
    sw = (song.swing || 0) * slot;
  const slotT = i => at + slot * i + (i & 1 ? sw : 0);
  const syms = String(S.chords[bar] || 'C')
      .trim()
      .split(/\s+/),
    chs = syms.map(chordOf),
    chAt = b => chs[Math.min(chs.length - 1, Math.floor((b * chs.length) / beats))];
  const nextSyms = nextBarChord();
  const nextCh = chordOf(nextSyms);
  const style = song.bass || 'oompah',
    old = !song.sections;
  if (old) {
    // the 2/4 rags: oom-pah or habanera left hand on the old piano
    const ch = chs[0],
      root = 48 + ch.root,
      bassLo = root - 12,
      fifth = root - 12 + 7 > 47 ? root - 5 : root + 7 - 12;
    const chordNote = iv => 60 + (((iv % 12) + 12) % 12) - (((iv % 12) + 12) % 12 > 7 ? 12 : 0),
      three = ch.tones.slice(0, 3);
    if (stop) {
      pianoNote(bassLo, at, slot * 1.5, 0.17);
      for (const iv of three) pianoNote(chordNote(iv), at, slot * 1.2, 0.07);
    } else if (style === 'habanera') {
      pianoNote(bassLo, slotT(0), slot * 2.5, 0.16);
      pianoNote(fifth, slotT(3), slot * 0.9, 0.12);
      pianoNote(bassLo + 12 > 47 ? bassLo : bassLo + 12, slotT(4), slot * 1.6, 0.13);
      for (const k of [2, 6]) for (const iv of three) pianoNote(chordNote(iv), slotT(k), slot * 1.1, 0.05);
    } else {
      pianoNote(bassLo, slotT(0), slot * 1.6, 0.16);
      pianoNote(fifth, slotT(4), slot * 1.6, 0.14);
      for (const k of [2, 6]) for (const iv of three) pianoNote(chordNote(iv), slotT(k), slot * 1.2, 0.055);
    }
    if (song.drums && !stop) {
      drum('thud', slotT(0), 0.22);
      drum('thud', slotT(4), 0.18);
      for (const k of [2, 6]) drum('brush', slotT(k), 0.07);
    }
  } else {
    const bt = b => at + beat * b + 0; // beats land straight; swing is in the eighths
    const swingB = b => at + beat * b + (b % 1 ? sw : 0);
    if (stop) {
      const ch = chs[0],
        rag = style === 'ragleft',
        chip = style === 'bounce',
        bm = bassNear(ch.root, mus.bassPrev);
      voiceNote(
        rag ? 'honky' : chip ? song.bassVoice || 'tri' : 'bass',
        rag && bm - 12 >= 31 ? bm - 12 : bm,
        at,
        beat * 0.9,
        rag ? 0.18 : chip ? 0.3 : 0.5
      );
      const v = voiceChord(ch, mus.prevVoice);
      mus.prevVoice = v;
      v.forEach(m =>
        voiceNote(rag ? 'honky' : chip ? song.compVoice || 'square' : 'piano', m, at, beat * 0.8, rag ? 0.07 : chip ? 0.03 : 0.11)
      );
      if (song.drums) {
        drum('snare', at, 0.18);
        drum('kick', at, 0.4);
      }
    } else if (style === 'stride') {
      // stride piano: low root on 1 (and 3), chord on 2 and 4; with two chords a bar each gets its half
      for (let b = 0; b < beats; b++) {
        const ch = chAt(b),
          first = b === 0 || chAt(b - 1) !== ch;
        if (b % 2 === 0) {
          const pc = first ? ch.root : (ch.root + ch.tones[2 % ch.tones.length]) % 12;
          const m = bassNear(pc, first ? 41 : mus.bassPrev);
          mus.bassPrev = m;
          voiceNote('piano', m, bt(b), beat * 0.9, 0.15);
          voiceNote('piano', m - 12 >= 28 ? m - 12 : m, bt(b), beat * 0.9, 0.07);
        } else {
          const v = voiceChord(ch, mus.prevVoice);
          mus.prevVoice = v;
          v.forEach(m => voiceNote('piano', m, bt(b), beat * 0.6, 0.07));
        }
      }
      if (song.drums)
        for (let b = 0; b < beats; b++) {
          drum(b % 2 ? 'snare' : 'thud', bt(b), b % 2 ? 0.05 : 0.18);
          drum('brush', swingB(b + 0.5), 0.05);
        }
    } else if (style === 'bounce' || style === 'ragleft') {
      // bounce: 8-bit octave bass on every beat (low, then the octave on the and);
      // ragleft: a ragtime left hand, bass note on the beat (root, then the fifth) and the chord on the and
      for (let b = 0; b < beats; b++) {
        const ch = chAt(b),
          first = b === 0 || chAt(b - 1) !== ch,
          pc = first || b % 2 === 0 ? ch.root : (ch.root + 7) % 12;
        const m = bassNear(pc, first ? 41 : mus.bassPrev);
        mus.bassPrev = m;
        if (style === 'bounce') {
          voiceNote(song.bassVoice || 'tri', m - 12 < 28 ? m : m - 12, bt(b), beat * 0.42, 0.3);
          voiceNote(song.bassVoice || 'tri', m - 12 < 28 ? m + 12 : m, swingB(b + 0.5), beat * 0.4, 0.26);
        } else {
          voiceNote(rush ? 'tri' : 'honky', m - 12 >= 31 ? m - 12 : m, bt(b), beat * 0.5, rush ? 0.3 : 0.16);
          if (!rush) voiceNote('honky', m, bt(b), beat * 0.5, 0.08);
          const v = voiceChord(ch, mus.prevVoice);
          mus.prevVoice = v;
          v.slice(0, 3).forEach(n =>
            voiceNote(rush ? 'celesta' : 'honky', n + (rush ? 12 : 0), swingB(b + 0.5), beat * 0.38, rush ? 0.035 : 0.055)
          );
        }
      }
      if (song.comp === 'offbeat')
        for (let b = 0; b < beats; b++) {
          if (b % 2 === 0) continue;
          const v = voiceChord(chAt(b), mus.prevVoice);
          mus.prevVoice = v;
          v.slice(0, 3).forEach(n => voiceNote(song.compVoice || 'square', n, bt(b), beat * 0.32, 0.028));
        }
      if (rush)
        // the rush beat: kick on every beat, a snare on the 2 (every other beat), sixteenth hats with the off ones softer
        for (let b = 0; b < beats; b++) {
          drum('kick', bt(b), 0.3);
          if (b % 2) drum('snare', bt(b), 0.16);
          for (const q of [0.25, 0.5, 0.75]) drum('hat', bt(b + q), q === 0.5 ? 0.09 : 0.045);
        }
      else if (song.drums === 'chip')
        for (let b = 0; b < beats; b++) {
          drum('hat', swingB(b + 0.5), 0.07);
          if (b % 2) drum('snare', bt(b), 0.1);
          else drum('kick', bt(b), 0.18);
        }
      else if (song.drums)
        for (let b = 0; b < beats; b++) {
          drum('thud', bt(b), 0.16);
          drum('brush', swingB(b + 0.5), 0.06);
        }
    } else {
      // walking bass: root on each chord change, chord tones between, a half step into the next chord
      let prev = mus.bassPrev;
      for (let b = 0; b < beats; b++) {
        const ch = chAt(b),
          first = b === 0 || chAt(b - 1) !== ch,
          nextIsNew = b === beats - 1 ? true : chAt(b + 1) !== ch;
        const target = b === beats - 1 ? nextCh : chAt(b + 1);
        let m;
        if (first) m = bassNear(ch.root, prev);
        else if (nextIsNew) {
          const tgt = bassNear(target.root, prev);
          m = tgt + ((bar + b) % 3 === 0 ? 1 : -1);
        } else {
          const opts = ch.tones.slice(1, 4).map(iv => bassNear((ch.root + iv) % 12, prev));
          m = opts.reduce((a, c) => (Math.abs(c - prev) < Math.abs(a - prev) && c !== prev ? c : a), opts[0]);
        }
        voiceNote('bass', m, bt(b), beat * 0.92, 0.42);
        prev = m;
      }
      mus.bassPrev = prev;
      // comping: a short chord on each change, with a push on the and-of-2 or and-of-3 in bars with one chord
      const hits = [];
      chs.forEach((c, i) => hits.push([(i * beats) / chs.length, c]));
      if (chs.length === 1) hits.push([bar % 2 ? 1.5 : 2.5, chs[0]]);
      for (const [b, ch] of hits) {
        const v = voiceChord(ch, mus.prevVoice);
        mus.prevVoice = v;
        v.forEach(m => voiceNote('piano', m, swingB(b), beat * 0.45, 0.075));
      }
      if (song.drums) {
        for (const b of [0, 1, 1.5, 2, 3, 3.5]) drum('ride', swingB(b), b % 1 ? 0.03 : 0.05);
        for (const b of [1, 3]) drum('hat', bt(b), 0.08);
        drum('kick', bt(0), 0.12);
        drum('kick', bt(2), 0.08);
        if (bar % 8 === 7) {
          drum('snare', swingB(3.5), 0.16);
          drum('snare', bt(3), 0.1);
        }
        if (bar === 0) drum('ride', bt(0), 0.1);
      }
    }
  }
  // the tune
  const leads = Array.isArray(song.lead) ? song.lead : [song.lead || song.voice || 'honky'],
    voice = rush ? 'celesta' : leads[loop % leads.length];
  const lvol =
    LEAD_GAIN *
    ({
      celesta: 0.16,
      honky: 0.13,
      piano: 0.2,
      trumpet: 0.13,
      clarinet: 0.13,
      vibes: 0.2,
      calliope: 0.075,
      mallet: 0.12,
      pulse: 0.06,
      square: 0.045
    }[voice] || 0.13);
  const main = t => midiOf(t.replace(/^.*\^/, '').replace('+', ''));
  const up = (old || song.vary) && loop & 1 && rep && !tune.some(t => (main(t) || 0) > 86) ? 12 : 0;
  for (let i = 0; i < n; i++) {
    const t = tune[i];
    if (!t || t === '.' || t === '-') continue;
    const m = main(t);
    if (m == null) continue;
    let len = 1;
    while (i + len < n && tune[i + len] === '.') len++;
    const dur = slotT(i + len) - slotT(i) - (old ? 0 : 0.015);
    if (t.includes('^')) {
      const g = midiOf(t.split('^')[0]);
      if (g != null) voiceNote(voice, g + up, slotT(i) - 0.045, 0.05, lvol * 0.75);
    } // a grace note just before
    voiceNote(voice, m + up, slotT(i), dur, lvol);
    if (up) voiceNote(voice, m, slotT(i), dur, lvol * 0.4);
    if (t.endsWith('+')) voiceNote(voice, m + up - 12, slotT(i), dur, lvol * 0.6); // octaves in the right hand
    if (rush) voiceNote('mallet', m + up + 12, slotT(i), Math.min(dur, 0.15), lvol * 0.35); // the candy sparkle an octave up
    if (song.double === 'octave' && voice === 'piano') voiceNote('piano', m - 12, slotT(i), dur, lvol * 0.5);
  }
  if (old && loop & 1 && bar % 4 === 3 && !stop && tune[7] === '-')
    voiceNote(voice, 48 + chs[0].root + 19, slotT(7), slot * 0.8, lvol * 0.5);
}
function formPos(p) {
  const song = RAG,
    f = song.form;
  let part = p.part,
    bar = p.bar + 1,
    loop = p.loop;
  if (bar >= sectionOf(song, f[part]).tune.length) {
    bar = 0;
    part++;
    if (part >= f.length) {
      part = song.loopFrom || 0;
      loop++;
    }
  }
  return { part, bar, loop };
}
function nextBarChord() {
  const q = formPos(mus),
    S = sectionOf(RAG, RAG.form[q.part]);
  return String(S.chords[q.bar] || 'C')
    .trim()
    .split(/\s+/)[0];
}
// (Chris 2026-11-09: the candy took a second to come in or go out) when POWER RUSH starts or stops (pausing counts), the music cuts over
// at once instead of at the next bar line: the notes already queued fade out, and the bar that's playing is played again from this very
// spot in the new sound and tempo (MUS_CUT skips everything before now), then the song carries on from there.
let MUS_CUT = 0;
function musicCutover() {
  const now = AC.currentTime,
    cur = (mus.hist || []).filter(h => h.at <= now + 0.01 && h.at + h.len > now).pop();
  const old = musicGain;
  musicGain = AC.createGain();
  musicGain.gain.value = old.gain.value;
  musicGain.connect(master);
  try {
    old.gain.cancelScheduledValues(now);
    old.gain.setTargetAtTime(0, now, 0.015);
  } catch (e) {}
  setTimeout(() => {
    try {
      old.disconnect();
    } catch (e) {}
  }, 300);
  if (!cur) return;
  const len = (60 / RAG.bpm) * (RAG.beats || 2),
    at = now - ((now - cur.at) / cur.len) * len; // the same point in the bar at the new tempo
  Object.assign(mus, { part: cur.part, bar: cur.bar, loop: cur.loop });
  MUS_CUT = now + 0.01;
  scheduleBar(at, RAG.form[cur.part], cur.bar, cur.loop, cur.rep);
  MUS_CUT = 0;
  mus.hist = [{ at, len, part: cur.part, bar: cur.bar, loop: cur.loop, rep: cur.rep }];
  mus.t = at + len;
  Object.assign(mus, formPos(mus));
}
function musicTick() {
  // schedules a little ahead of the clock, a bar at a time
  if (!AC || !musicGain) return;
  const rushNow = musRush(),
    menuNow = musMenu();
  if (rushNow !== !!mus.rush || menuNow !== !!mus.menu) {
    mus.rush = rushNow;
    mus.menu = menuNow;
    if (mus.t) musicCutover();
  }
  const barLen = (60 / RAG.bpm) * (RAG.beats || 2);
  mus.boost = 1 + ((mus.boost || 1) - 1) * 0.9;
  musicGain.gain.setTargetAtTime(musicOn && !muted ? (G.state === 'pause' ? 0.35 : 1) * 0.55 * mus.boost : 0, AC.currentTime, 0.08);
  if (!mus.t || mus.t < AC.currentTime) mus.t = AC.currentTime + 0.1;
  while (mus.t < AC.currentTime + 0.6) {
    const sec = RAG.form[mus.part],
      rep = mus.part > 0 && RAG.form[mus.part - 1] === sec;
    scheduleBar(mus.t, sec, mus.bar, mus.loop, rep);
    (mus.hist = mus.hist || []).push({ at: mus.t, len: barLen, part: mus.part, bar: mus.bar, loop: mus.loop, rep });
    if (mus.hist.length > 4) mus.hist.shift();
    mus.t += barLen;
    Object.assign(mus, formPos(mus));
  }
}
function musicStart(boost, fromLoop) {
  // fromLoop: skip the song's intro (gameplay starts straight into the tune)
  if (HEADLESS || !AC || musicGain) return;
  musicGain = AC.createGain();
  musicGain.gain.value = boost ? 0.55 * boost : 0;
  musicGain.connect(master);
  Object.assign(mus, {
    hist: [],
    rush: musRush(),
    menu: musMenu(),
    boost: boost || 1,
    t: 0,
    part: fromLoop ? RAG.loopFrom || 0 : 0,
    bar: 0,
    loop: 0,
    prevVoice: null,
    bassPrev: 41
  });
  mus.timer = setInterval(musicTick, 100);
  musicTick();
}
function musicStop() {
  // fade out (death, stage clear, a new stage's fanfare)
  if (!musicGain) return;
  const g = musicGain;
  musicGain = null;
  clearInterval(mus.timer);
  try {
    g.gain.cancelScheduledValues(AC.currentTime);
    g.gain.setTargetAtTime(0, AC.currentTime, 0.05);
  } catch (e) {}
  setTimeout(() => {
    try {
      g.disconnect();
    } catch (e) {}
  }, 400);
}
// the stage-start fanfare (Chris 2026-11-07: a little tune while the stage comes in, then the music when you can move):
// a chromatic run up, a bounce through C6 / A7 / D7 G7, and a final chord stab. About 3 seconds at 168.
// JINGLE: bars of 4 eighth-note slots (notes) over chords (one or two per bar); end: the final chord and the notes on top of it.
//   lead: an instrument (default: the song's); hits: the left hand plays only with the tune's notes (big-band stabs) instead of oom-pah;
//   horn: a ship's horn blows first (seconds).
// Chris's pick (Workshop fanfare round 1, 2026-11-07): the ship's horn, then a quick rag tag answers it.
let JINGLE = {
  name: "Ship's horn",
  bpm: 168,
  swing: 0.2,
  horn: 1.1,
  notes: ['C5 E5 G5 C6', 'Bb5 . A5 Bb5', 'B5 - D6 -', 'F6 - D6 B5'],
  chords: ['C', 'C7', 'G7', 'G7'],
  end: 'C6',
  top: ['C6', 'E6']
};
let jingleGain = null;
function playJingle() {
  if (HEADLESS || !AC || muted) return;
  jingleStop();
  const J = JINGLE,
    save = musicGain,
    saveMenu = mus.menu;
  mus.menu = true; // the fanfare is always on the menus' piano (Chris 2026-11-11: from 1-2 on it came out on the game's marimba)
  jingleGain = musicGain = AC.createGain();
  musicGain.gain.value = 0.55;
  musicGain.connect(master);
  const beat = 60 / J.bpm,
    half = beat / 2,
    lead = J.lead || (Array.isArray(RAG.lead) ? RAG.lead[0] : RAG.lead || RAG.voice || 'honky'),
    lv = { pulse: 0.06, honky: 0.14, square: 0.05 }[lead] || 0.12;
  const lh = lead === 'pulse' ? 'tri' : 'honky',
    lhv = lh === 'tri' ? 0.3 : 0.16;
  let t0 = AC.currentTime + 0.05,
    prev = null;
  if (J.horn) {
    for (const [m, v] of [
      [43, 0.5],
      [50, 0.3]
    ])
      voiceNote('trumpet', m, t0, J.horn, v * 0.3);
    voiceNote('bass', 31, t0, J.horn, 0.4);
    t0 += J.horn + 0.15;
  }
  J.notes.forEach((bar, bi) => {
    const toks = bar.split(' '),
      syms = J.chords[bi].split(' ');
    toks.forEach((n, i) => {
      const m = midiOf(n.replace('+', '')),
        at = t0 + (bi * 4 + i) * half + (i & 1 ? half * J.swing : 0);
      if (m == null) return;
      let len = 1;
      while (i + len < 4 && toks[i + len] === '.') len++;
      voiceNote(lead, m, at, half * len * 0.9, lv);
      if (n.endsWith('+')) voiceNote(lead, m - 12, at, half * len * 0.9, lv * 0.6);
      if (J.hits) {
        const ch = chordOf(syms[Math.min(syms.length - 1, ((i * syms.length) / 4) | 0)]),
          v = voiceChord(ch, prev);
        prev = v;
        voiceNote(lh, 36 + ch.root, at, half * 0.9, lhv);
        v.forEach(x => voiceNote(lh === 'tri' ? 'square' : 'honky', x, at, half * 0.8, lh === 'tri' ? 0.03 : 0.07));
      }
    });
    if (!J.hits)
      for (let b = 0; b < 2; b++) {
        const ch = chordOf(syms[Math.min(syms.length - 1, ((b * syms.length) / 2) | 0)]),
          at = t0 + (bi * 2 + b) * beat;
        voiceNote(lh, 36 + ch.root, at, beat * 0.5, lhv);
        const v = voiceChord(ch, prev);
        prev = v;
        v.slice(0, 3).forEach(n =>
          voiceNote(lh === 'tri' ? 'square' : 'honky', n, at + half + half * J.swing, beat * 0.35, lh === 'tri' ? 0.03 : 0.06)
        );
      }
  });
  const end = t0 + J.notes.length * 2 * beat,
    ch = chordOf(J.end);
  (J.top || []).forEach((n, i) => voiceNote(lead, midiOf(n) + 12 * (i === 0 ? 0 : 0), end, beat * 1.4, lv * (i ? 0.7 : 1.2)));
  voiceNote(lh, 36 + ch.root, end, beat * 1.5, lhv * 1.2);
  voiceChord(ch, prev).forEach(n => voiceNote(lh === 'tri' ? 'square' : 'honky', n, end, beat * 1.2, lh === 'tri' ? 0.035 : 0.08));
  drum('kick', end, 0.3);
  drum('ride', end, 0.12);
  musicGain = save;
  mus.menu = saveMenu;
  return end + beat * 1.5 - AC.currentTime; // seconds until it has rung out
}
function jingleStop() {
  if (!jingleGain) return;
  const g = jingleGain;
  jingleGain = null;
  try {
    g.gain.setTargetAtTime(0, AC.currentTime, 0.04);
  } catch (e) {}
  setTimeout(() => {
    try {
      g.disconnect();
    } catch (e) {}
  }, 400);
}
