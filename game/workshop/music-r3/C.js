// Option C: BOLLARD CAKEWALK. A real ragtime: 2/4, a piano left hand (bass note on the beat, chord on the and), and the cakewalk
// rhythm that makes ragtime ragtime (short-long-short: A C . A) as the hook. F major. The second phrase replays the hook over D7 with
// one note changed (F to F#), the trio in Bb has stop-time breaks and plays one line over Eb then Ebm. Brushes underneath; the tune
// moves to the 8-bit pulse the second time round.
const sec = bars => ({ chords: bars.map(b => b[0]), tune: bars.map(b => b[1]) });
const A = [
  ['F',     'A5 C6 . A5 F5 . - -'],
  ['F',     'A5 C6 . A5 G5 . - -'],
  ['C7',    'G5 Bb5 . G5 E5 . - -'],
  ['C7',    'G5 Bb5 . G5 C6 . - -'],
  ['F',     'A5 C6 . A5 F5 . A5 .'],
  ['Bb',    'Bb5 D6 . Bb5 F5 . D5 .'],
  ['F C7',  'C5 . F5 . A5 . G5 .'],
  ['F',     'F5 . . . - - C5 E5'],
  ['F',     'A5 C6 . A5 F5 . - -'],
  ['D7',    'A5 C6 . A5 F#5 . - -'],
  ['Gm',    'Bb5 D6 . Bb5 G5 . - -'],
  ['C7',    'Bb5 C6 . Bb5 E5 . - -'],
  ['F',     'A5 . C6 . F6 . C6 .'],
  ['D7',    'D6 . C6 . A5 . F#5 .'],
  ['G7 C7', 'G5 . B5 . Bb5 . E5 .'],
];
const B = [
  ['Bb',    'F5 . Bb5 . D6 . - - !'],
  ['Bb',    'C6 D6 . C6 Bb5 . - - !'],
  ['F7',    'Eb5 . A5 . C6 . - - !'],
  ['Bb F7',  'Bb5 C6 . Bb5 A5 . - -'],
  ['F7',    'A5 Bb5 . A5 F5 . Eb5 .'],
  ['F7',    'C5 . F5 . A5 . C6 .'],
  ['Bb',    'D6 . . . Bb5 . D6 .'],
  ['Bb',    'F6 . . . - - - -'],
  ['Bb',    'F5 . Bb5 . D6 . - - !'],
  ['Bb7',   'C6 D6 . C6 Ab5 . - - !'],
  ['Eb',    'G5 . Bb5 . Eb6 . . .'],
  ['Ebm',   'Gb5 . Bb5 . Eb6 . . .'],
  ['Bb',    'D6 . F6 . D6 . Bb5 .'],
  ['G7',    'B5 . D6 . F6 . D6 .'],
  ['C7 F7', 'E6 . C6 . Eb6 . C6 .'],
];
RAG = {
  name: 'Bollard Cakewalk', bpm: 100, beats: 2, swing: 0, lead: ['honky', 'pulse'], bass: 'ragleft', drums: true,
  sections: {
    I:  sec([['C7', 'C5 E5 . G5 Bb5 . - -'], ['C7', 'C6 Bb5 . G5 E5 . - -']]),
    A1: sec([...A, ['F', 'F5 . . . - - - -']]),
    A2: sec([...A, ['F', 'F5 . . . - - F5 G5']]),
    B1: sec([...B, ['Bb', 'Bb5 . . . - - - -']]),
    B2: sec([...B, ['Bb C7', 'Bb5 . . . G5 . E5 .']]),
  },
  form: ['I', 'A1', 'A2', 'B1', 'B2', 'A1'], loopFrom: 1,
};
