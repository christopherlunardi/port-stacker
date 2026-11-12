// the comping hand stacked in order from a note near the middle, every note at least a minor third above the last, so the chord never
// smudges into notes a step apart, and nothing is dropped (Workshop chords round 1, 2026-11-08)
voiceChord = function (ch, prev) {
  const centre = prev ? prev[0] : 57;
  const out = [];
  ch.voice.forEach((iv, i) => {
    const pc = (ch.root + iv) % 12;
    let n;
    if (!i) { n = pc + 12 * Math.round((centre - pc) / 12); while (n < 53) n += 12; while (n > 61) n -= 12; }
    else { n = pc; while (n <= out[i - 1] + 2) n += 12; while (n > out[i - 1] + 12) n -= 12; if (n <= out[i - 1] + 2) n += 12; }
    out.push(n);
  });
  return out;
};
// B: CLEAN RAG CHORDS. 7th chords are the plain 3rd, 5th and 7th (G7 = B D F), triads plain, stacked in order with no notes a step apart.
Object.assign(VOICE, { '': [4, 7, 12], m: [3, 7, 12], 6: [4, 9, 12], m6: [3, 9, 12], 7: [4, 7, 10], m7: [3, 7, 10], maj7: [4, 7, 11], 9: [4, 10, 14], m9: [3, 10, 14] });
