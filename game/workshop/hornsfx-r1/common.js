// helpers for the horn sound options: an oscillator through a low-pass filter with an envelope, straight into the master bus
function hornVoice(type, f0, f1, dur, vol, cut, delay = 0, vib = 0) {
  if (!AC || muted) return;
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter();
  o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  if (vib) { const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = 6; lg.gain.value = vib; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.05); }
  f.type = 'lowpass'; f.frequency.value = cut; f.Q.value = 1.2;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.setValueAtTime(vol, t + dur * 0.75); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
