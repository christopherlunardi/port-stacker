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
// B: upright piano: rounder and warmer, a soft hammer, notes ring a little longer and darken as they fade
keysVoice((m, at, dur, vol, f, out) => {
  const end = at + Math.min(1.6, Math.max(0.3, dur * 1.5)), lp = AC.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.setValueAtTime(m > 60 ? 4200 : 2600, at); lp.frequency.exponentialRampToValueAtTime(m > 60 ? 1300 : 800, at + 0.5);
  lp.connect(out);
  for (const det of [-3, 3]) { const o = kOsc('piano', f, det), g = kGain(at, 0.005, vol * 0.62, 0.25, 0.3, end); o.connect(g); g.connect(lp); o.start(at); o.stop(end + 0.05); }
  kClick(at, vol * 0.25, 2400, out);
}, 0.66);
