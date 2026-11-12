// richer horn voices (round 2): detuned stacks through overdrive and a formant filter, a pitch scoop into the note, a breath of noise
function hornDrive(amount) { const ws = AC.createWaveShaper(), n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(x * amount) / Math.tanh(amount); } ws.curve = c; return ws; }
function horn2({ f, dur, vol = 0.25, detune = 12, voices = 3, type = 'sawtooth', drive = 3, formant = 1100, q = 2.5, scoop = 0.94, scoopT = 0.04, endBend = 1, delay = 0, breath = 0.06, vib = 0, attack = 0.012 }) {
  if (!AC || muted) return;
  const t = AC.currentTime + delay, out = AC.createGain(), bp = AC.createBiquadFilter(), lp = AC.createBiquadFilter(), sh = hornDrive(drive);
  bp.type = 'peaking'; bp.frequency.value = formant; bp.Q.value = q; bp.gain.value = 9; lp.type = 'lowpass'; lp.frequency.value = Math.min(6000, formant * 3.2);
  out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(vol, t + attack); out.gain.setValueAtTime(vol, t + dur * 0.8); out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  sh.connect(bp); bp.connect(lp); lp.connect(out); out.connect(master);
  for (let i = 0; i < voices; i++) { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.detune.value = (i - (voices - 1) / 2) * detune;
    o.frequency.setValueAtTime(f * scoop, t); o.frequency.exponentialRampToValueAtTime(f, t + scoopT); if (endBend !== 1) { o.frequency.setValueAtTime(f, t + dur * 0.7); o.frequency.exponentialRampToValueAtTime(f * endBend, t + dur); }
    if (vib) { const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = 7; lg.gain.value = vib; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.05); }
    g.gain.value = 1 / voices; o.connect(g); g.connect(sh); o.start(t); o.stop(t + dur + 0.05); }
  if (breath) noise(Math.min(0.08, dur), breath, formant * 1.4, delay);
}
