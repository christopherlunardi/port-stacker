// Option D: CRATE HOP on ragtime piano instead of the 8-bit band (same tune as B), to hear the tune apart from the sound.
// F to Fm turn, an 8-bit band (25% pulse lead, square chords on 2 and 4, a triangle bass hopping octaves, noise drums), a light shuffle.
// The hook lands its notes on the off-beats with rests between (it hops), the second phrase answers it on G7 with a chromatic
// neighbour (A# to B), and the B part opens out into long notes on F before a secondary dominant (D7) walks it home.
// A1 ends on a question (D over G7), A2 on the answer (C). About a minute round, then it loops from A1.
const sec = bars => ({ chords: bars.map(b => b[0]), tune: bars.map(b => b[1]) });
const A = [
  ['C',     '- E5 G5 - C6 - B5 C6'],
  ['C',     '- A5 - G5 - E5 C5 -'],
  ['G7',    '- D5 F5 - B5 - A#5 B5'],
  ['G7',    '- G5 - F5 - D5 B4 -'],
  ['C',     '- E5 G5 - C6 - B5 C6'],
  ['C7',    '- E6 - D6 - C6 Bb5 -'],
  ['F Fm',  'A5 . C6 . Ab5 . C6 .'],
];
RAG = {
  name: 'Crate Hop (piano)', bpm: 140, beats: 4, swing: 0.2, lead: 'honky', bass: 'ragleft', drums: true,
  sections: {
    I:  sec([['G7', 'G4 . . . A4 A#4 B4 .']]),
    A1: sec([...A, ['C G7', 'E5 . C5 . D5 . - -']]),
    A2: sec([...A, ['C', 'C5 . G4 . C5 . - -']]),
    B:  sec([['F', 'F5 . A5 . C6 . . .'], ['F', 'D6 . C6 . A5 . - -'], ['C', 'E5 . G5 . C6 . . .'], ['C', 'D6 . C6 . G5 . - -'],
             ['D7', 'F#5 . A5 . D6 . C6 .'], ['D7', 'A5 . F#5 . D5 . - -'], ['G7', 'G5 . A5 . B5 . D6 .'], ['G7', 'F5 . E5 . D5 . - -']]),
  },
  form: ['I', 'A1', 'A2', 'B', 'A2'], loopFrom: 1,
};
