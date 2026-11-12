// clean chord notes (3rd, 5th, 7th; plain triads), with the game's smooth voice leading kept in one register: the chord moves to the
// nearest notes from the last one, but its middle can't wander below LO or above HI (round 1's D drifted down into the bass)
Object.assign(VOICE, { '': [4, 7, 12], m: [3, 7, 12], 6: [4, 9, 12], m6: [3, 9, 12], 7: [4, 7, 10], m7: [3, 7, 10], maj7: [4, 7, 11], 9: [4, 10, 14], m9: [3, 10, 14] });
function cleanVoicing(LO, HI) {
  voiceChord = function (ch, prev) {
    let centre = prev ? prev.reduce((a, b) => a + b, 0) / prev.length : (LO + HI) / 2;
    centre = Math.max(LO, Math.min(HI, centre));
    return ch.voice.map(iv => { const pc = (ch.root + iv) % 12; let n = pc + 12 * Math.round((centre - pc) / 12); while (n < centre - 6) n += 12; while (n >= centre + 6) n -= 12; return n; }).sort((a, b) => a - b);
  };
}
