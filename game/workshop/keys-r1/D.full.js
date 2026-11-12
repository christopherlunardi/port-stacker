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
// D: electric piano (a Rhodes-style tine): soft and round, a little bell on the attack that melts away, and a slow shimmer
keysVoice((m, at, dur, vol, f, out) => {
  const end = at + Math.min(1.8, Math.max(0.35, dur * 1.7));
  const car = kOsc('sine', f), mod = AC.createOscillator(), mg = AC.createGain(), g = kGain(at, 0.004, vol * 1.05, 0.4, 0.45, end);
  mod.frequency.value = f; mg.gain.setValueAtTime(f * 1.6, at); mg.gain.exponentialRampToValueAtTime(f * 0.25, at + 0.35);
  mod.connect(mg); mg.connect(car.frequency); car.connect(g); g.connect(out);
  const trem = AC.createOscillator(), tg = AC.createGain(); trem.frequency.value = 4.5; tg.gain.value = vol * 0.12; trem.connect(tg); tg.connect(g.gain);
  const bell = kOsc('sine', f * 7.1), bg = kGain(at, 0.002, vol * 0.1, 0, 1, at + 0.12); bell.connect(bg); bg.connect(out);
  for (const o of [car, mod, trem, bell]) { o.start(at); o.stop(end + 0.05); }
}, 0.54);
