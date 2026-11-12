// E: clavinet: a funky plucked string, bright and snappy, the filter closing fast on each note
keysVoice((m, at, dur, vol, f, out) => {
  const end = at + Math.max(0.12, dur * 0.85) + 0.08, bp = AC.createBiquadFilter();
  bp.type = 'lowpass'; bp.Q.value = 6; bp.frequency.setValueAtTime(Math.min(9000, f * 9), at); bp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.6), at + 0.18);
  bp.connect(out);
  const o = kOsc('pulse', f), o2 = kOsc('sawtooth', f, 4), g = kGain(at, 0.002, vol * 0.55, 0.15, 0.4, end), g2 = kGain(at, 0.002, vol * 0.18, 0.15, 0.4, end);
  o.connect(g); o2.connect(g2); g.connect(bp); g2.connect(bp);
  for (const x of [o, o2]) { x.start(at); x.stop(end + 0.05); }
}, 0.85);
