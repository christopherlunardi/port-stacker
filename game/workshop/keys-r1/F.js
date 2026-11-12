// F: chiptune: the tune on a 25% pulse (the 8-bit lead), the left hand on the triangle bass channel
keysVoice((m, at, dur, vol, f, out) => {
  const low = m < 60, end = at + Math.max(0.1, dur * 0.9) + 0.03;
  const o = kOsc(low ? 'triangle' : 'pulse', f), g = AC.createGain();
  g.gain.setValueAtTime(0.0001, at); g.gain.linearRampToValueAtTime(vol * (low ? 1.0 : 0.42), at + 0.005);
  g.gain.setValueAtTime(vol * (low ? 1.0 : 0.42) * 0.8, at + Math.max(0.02, dur * 0.6)); g.gain.linearRampToValueAtTime(0.0001, end);
  o.connect(g); g.connect(out); o.start(at); o.stop(end + 0.05);
}, 0.41);
