// Option C: PIER PRESSURE STOMP. A stride-piano rag with jazz harmony, in C with a trio in F: solo piano, left hand striding (low root,
// chord, low fifth, chord), right hand in octaves. Hook: a three-note cell (E G A) that restarts off the beat, so it trips forward.
// The A strain walks the cycle (C6 E7 A7 D7 G7) with diminished passing chords and an F6 to Fm6 turn; the trio has stop-time
// breaks where the left hand stops and the right hand answers alone, and a Bb6 / Bbm6 pair that repeats the same line major then minor.
// Every phrase ends sliding up by half steps into the next downbeat. Brushes underneath; vibes take the tune the next time round.
const sec = bars => ({ chords: bars.map(b => b[0]), tune: bars.map(b => b[1]) });
const A = [ // bars 1-15 of every A
  ['C6',         'E5 G5 A5 . . E5 G5 A5'],
  ['E7',         '- G#5 B5 D6 . C6 B5 G#5'],
  ['A7',         'A5 . C#6 E6 . G6 . E6'],
  ['D7 G7',      'F#6 . D6 C6 . B5 D6 G6'],
  ['C6',         'E6 . . C6 . A5 G5 E5'],
  ['C7',         'Bb5 . G5 E5 . C5 D5 E5'],
  ['F6 Fm6',     'F5 A5 C6 D6 . Ab5 C6 D6'],
  ['C6 A7',      'E6 . . C6 . C#6 E6 G6'],
  ['D7',         'F#6 . D6 A5 . F#5 A5 C6'],
  ['G7',         'B5 . G5 D5 . F5 G5 G#5'],
  ['C6 C#dim7',  'A5 . G5 E5 . E5 G5 A#5'],
  ['Dm7 G7',     'A5 . F5 D5 . B4 D5 F5'],
  ['C6',         'E5 G5 A5 . . E5 G5 A5'],
  ['A7',         '- C#6 E6 G6 . F6 E6 C#6'],
  ['Dm7 G7',     'D6 . F6 A6 . G6 F6 D6'],
];
const B = [ // bars 1-15 of the trio
  ['F6',         'F5 A5 C6 D6 . C6 A5 C6 !'],
  ['F7',         'Eb6 . D6 . C6 . A5 .'],
  ['C7',         'E5 G5 Bb5 C6 . Bb5 G5 Bb5 !'],
  ['C7b9',       'Db6 . C6 . Bb5 . G5 .'],
  ['C7',         'E5 . G5 . Bb5 . C6 Db6'],
  ['C7',         'C6 . Bb5 . G5 E5 . C5'],
  ['F6',         'F5 . A5 . C6 . F6 .'],
  ['Fmaj7 F#dim7', 'E6 . D6 C6 . A5 . Eb6'],
  ['Bb6',        'D6 . F6 . G6 . F6 D6'],
  ['Bbm6',       'Db6 . F6 . G6 . F6 Db6'],
  ['F6',         'C6 . A5 F5 . A5 C6 D6'],
  ['D7',         'C6 . A5 F#5 . A5 C6 Eb6'],
  ['G7',         'D6 . B5 G5 . B5 D6 F6'],
  ['C7',         'E6 . C6 G5 . Bb5 . E5'],
  ['F6 D7',      'F5 A5 C6 . . C6 A5 F#5'],
];
RAG = {
  name: 'Pier Pressure Stomp', bpm: 132, beats: 4, swing: 0.18, bass: 'stride', drums: true, lead: ['piano', 'vibes'], double: 'octave',
  sections: {
    I:  sec([['C6 A7b9', 'G5 . A5 . A#5 . B5 .'], ['Dm7 G7', 'C6 . . . - - - -'], ['C6 A7b9', 'G5 . A5 . A#5 . B5 .'], ['Dm7 G7', '- - - - - D5 . D#5']]),
    A1: sec([...A, ['C6 G7', 'C6 . . . - D5 . D#5']]),
    A2: sec([...A, ['C6 C7', 'C6 . . . - Bb5 G5 E5']]),
    B1: sec([...B, ['Gm7 C7', 'G5 . Bb5 D6 . C6 Bb5 G5']]),
    B2: sec([...B, ['Dm7 G7', 'F5 . A5 D6 . B5 G5 F5']]),
  },
  form: ['I', 'A1', 'A2', 'B1', 'B2', 'A1'], loopFrom: 2,
};
