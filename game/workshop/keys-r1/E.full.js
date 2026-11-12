// Workshop keys round 1 (Chris 2026-11-11: the theme song is perfect, workshop the keyboard sound): every option replaces the 'honky'
// voice (the ragtime piano that plays both hands of Dockside Rag) with another keyboard, same notes, same timing, same loudness.
function keysVoice(fn, k = 1) {
  // k: a rough loudness match to the game's own mix (the Workshop files are also loudness-matched, so no option wins by being louder)
  const was = voiceNote;
  voiceNote = function (voice, m, at, dur, vol) {
    if (voice !== 'honky' || !AC || !musicGain || at < MUS_CUT) return was.apply(this, arguments);
    fn(m, at, dur, vol * k, hz(m), musicGain);
  };
}
function kOsc(type, f, det) {
  const o = AC.createOscillator();
  const W = waves();
  if (W && W[type]) o.setPeriodicWave(W[type]);
  else o.type = type;
  o.frequency.value = f;
  o.detune.value = det || 0;
  return o;
}
function kGain(at, a, peak, dec, sus, end) {
  const g = AC.createGain();
  env(g, at, a, Math.max(0.0002, peak), dec, sus, end);
  return g;
}
function kClick(at, vol, freq, out) {
  // a hammer or key thump: a few milliseconds of filtered noise
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf;
  f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2;
  g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.025);
  s.connect(f); f.connect(g); g.connect(out);
  s.start(at); s.stop(at + 0.04);
}
// E: clavinet: a funky plucked string, bright and snappy, the filter closing fast on each note
keysVoice((m, at, dur, vol, f, out) => {
  const end = at + Math.max(0.12, dur * 0.85) + 0.08, bp = AC.createBiquadFilter();
  bp.type = 'lowpass'; bp.Q.value = 6; bp.frequency.setValueAtTime(Math.min(9000, f * 9), at); bp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.6), at + 0.18);
  bp.connect(out);
  const o = kOsc('pulse', f), o2 = kOsc('sawtooth', f, 4), g = kGain(at, 0.002, vol * 0.55, 0.15, 0.4, end), g2 = kGain(at, 0.002, vol * 0.18, 0.15, 0.4, end);
  o.connect(g); o2.connect(g2); g.connect(bp); g2.connect(bp);
  for (const x of [o, o2]) { x.start(at); x.stop(end + 0.05); }
}, 0.85);
