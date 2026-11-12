// Option B: HARD HAT SHUFFLE. Medium-up swing in F, a 32-bar AABA song like a jazz standard, with a 4-bar intro played once.
// The A strain: I-VI7-ii-V turnarounds, a diminished passing chord, a I7 to IV to iv (Bb6, Bbm6) blues turn, iii-VI7-ii-V home.
// One hook (a three-note pickup climbing to the sixth) comes back in every A; every phrase ends on a chromatic slide (D, Db, C) into
// the next. The bridge goes round the cycle (A7 D7 G7 C7, two bars each) with the same two-bar cell moved onto each chord.
// Band: walking bass with chromatic approach notes, swing ride and hi-hat, piano comping with pushes. Muted trumpet takes the tune,
// clarinet the next time round. The intro is the old I - bIIIdim - ii - bII7 walk-down under a chromatic line.
const A = [ // bars 1-7 of every A
  ['F6 D7b9',   'C5 D5 F5 . A5 . F#5 .'],
  ['Gm7 C7',    'G5 . . F5 E5 . C5 .'],
  ['F6 F#dim7', 'C5 D5 F5 . A5 . C6 .'],
  ['Gm7 C7',    'Bb5 . A5 G5 - E5 G5 Ab5'],
  ['F7',        'A5 . F5 . Eb5 . C5 .'],
  ['Bb6 Bbm6',  'D5 . F5 G5 - F5 Db5 .'],
  ['Am7 D7',    'C5 . E5 G5 - F#5 A5 C6'],
];
const sec = bars => ({ chords: bars.map(b => b[0]), tune: bars.map(b => b[1]) });
RAG = {
  name: 'Hard Hat Shuffle', bpm: 152, beats: 4, swing: 0.33, bass: 'walk', drums: true, lead: ['trumpet', 'clarinet'],
  sections: {
    I:  sec([['F6 Abdim7 Gm7 Gb7', 'A5 . Ab5 . G5 . Gb5 .'], ['Fmaj7 Fmaj7 Gm7 C7', 'F5 . E5 . - - - -'], ['F6 Abdim7 Gm7 Gb7', 'A5 . Ab5 . G5 . Gb5 .'], ['Fmaj7 Fmaj7 Gm7 C7b9', 'F5 . E5 . - D5 Db5 .']]),
    A1: sec([...A, ['Gm7 C7b9', 'Bb5 A5 G5 E5 . D5 Db5 .']]),
    A2: sec([...A, ['F6 E7', 'F5 . . . - E5 G#5 B5']]),
    B:  sec([['A7', 'C#6 . . A5 . E5 G5 A5'], ['A7', 'B5 . A5 G5 . E5 . -'],
             ['D7', 'F#6 . . D6 . A5 C6 D6'], ['D7', 'E6 . D6 C6 . A5 . -'],
             ['G7', 'B5 . . G5 . D5 F5 G5'], ['G7', 'A5 . G5 F5 . D5 . -'],
             ['C7', 'E5 G5 Bb5 C6 . D6 . Db6'], ['C7', 'C6 . Bb5 G5 . E5 D5 Db5']]),
    A3: sec([...A, ['F6 F6 Gm7 C7', 'F5 . . . - - - -']]),
  },
  form: ['I', 'A1', 'A2', 'B', 'A3'], loopFrom: 1,
};
