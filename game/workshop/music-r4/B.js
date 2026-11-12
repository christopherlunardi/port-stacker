// Option B: DOCKSIDE RAG, DRESSED UP. The same tune and chords as the one in the game, with the things a rag pianist adds (Chris 2026-11-07:
// "flourishes at important parts and a little more interest here and there, like a rag"):
// - a 4-bar intro vamp (C, A7, D7, G7) in octaves, ending on a chromatic step into the tune;
// - grace notes into the accented high notes (D#^E, E^F, G#^A);
// - the right hand in octaves at the high points (bar 7 of A, the D7 and G7 climb in B);
// - chromatic runs filling the gaps into the next phrase (E F F# G into the F bar, D5 D#5 into E5, G A B up into the repeat);
// - stop-time breaks: the band drops out at the start of B and the repeated-note figure answers alone;
// - every other time round, the repeats jump up an octave.
const sec = bars => ({ chords: bars.map(b => b[0]), tune: bars.map(b => b[1]) });
const A = [
  ['C',  'E5 G5 C6 . D#6^E6 . D6 C6'],
  ['C',  'A5 . G5 . E5 G5 - -'],
  ['G7', 'F5 A5 D6 . E6^F6 . E6 D6'],
  ['G7', 'B5 . G5 . D5 F5 E5 D#5'],
  ['C',  'E5 G5 C6 . D#6^E6 . D6 C6'],
  ['C7', 'Bb5 . G5 . E5 F5 F#5 G5'],
  ['F',  'A5+ C6+ F6+ . G#6^A6+ . G6+ F6+'],
  ['F',  'E6 . C6 . A5 . F#5 G5 !'],
  ['C',  'G5 - E5 G5 C6 . E6 -'],
  ['A7', 'C6^C#6 . E6 . A5 C#6 - -'],
  ['D7', 'D6 F#5 A5 D6 . F#6 . E6'],
  ['G7', 'D6 . B5 . G5 - F5 -'],
  ['C',  'E5 G5 C6 . E6 D6 C6 B5'],
  ['G7', 'D6 . B5 G5 . F5 D5 -'],
  ['C',  'C5 E5 G5 C6 . . G5 -'],
];
const B = [
  ['F',   'A5 - A5 C6 . A5 C6 - !'],
  ['F',   'F6 . E6 F6 . C6 A5 - !'],
  ['C7',  'G5 - G5 Bb5 . G5 Bb5 - !'],
  ['C7',  'E6 . D6 E6 . C6 G5 -'],
  ['C7',  'Bb5 . A5 Bb5 . G5 E5 -'],
  ['C7',  'C5 E5 G5 Bb5 . . C6 -'],
  ['F',   'A5+ C6+ F6+ . C6 A5 F5 -'],
  ['F',   'A5 . . . C6 . - -'],
  ['F',   'A5 - A5 C6 . A5 C6 -'],
  ['F7',  'D6^Eb6 . D6 Eb6 . C6 A5 -'],
  ['Bb',  'D6 . Bb5 D6 . F6 . D6'],
  ['Bbm', 'Db6 . Bb5 . F5 Ab5 . -'],
  ['F',   'C6 A5 F5 A5 C6 . F6 -'],
  ['D7',  'F6^F#6+ . D6 . A5 C6 . F#5'],
  ['G7',  'G5 B5 D6 F6+ . . D6 B5'],
];
RAG = {
  name: 'Dockside Rag (dressed up)', bpm: 96, beats: 2, swing: 0, lead: 'honky', bass: 'ragleft', vary: true,
  sections: {
    I:  sec([['C', 'C6+ . . . G5 . E5 .'], ['A7', 'C#6+ . . . A5 . E5 .'], ['D7', 'D6+ . . . A5 . F#5 .'], ['G7', 'G5 . F5 . D5 . D#5 .']]),
    A1: sec([...A, ['C', 'C6+ . . . G5 A5 B5 -']]),
    A2: sec([...A, ['C C7', 'C6+ . . . G5 . Bb5 .']]),
    B1: sec([...B, ['C7', 'C6 . Bb5 . G5 E5 C5 -']]),
    B2: sec([...B, ['C7', 'C6 . Bb5 . G5 E5 D5 D#5']]),
  },
  form: ['I', 'A1', 'A2', 'B1', 'B2', 'A1'], loopFrom: 1,
};
