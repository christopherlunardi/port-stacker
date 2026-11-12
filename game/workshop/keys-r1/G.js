// G: marimba: warm wooden bars, a soft knock and a quick ring, the left hand deep and round
keysVoice((m, at, dur, vol, f, out) => {
  const end = at + Math.min(0.9, 0.25 + dur * 0.6);
  const o = kOsc('sine', f), g = kGain(at, 0.002, vol * 1.25, 0.05, 0.6, end);
  const o2 = kOsc('sine', f * 3.9), g2 = kGain(at, 0.001, vol * 0.25, 0, 1, at + 0.07);
  const o3 = kOsc('sine', f * 10), g3 = kGain(at, 0.001, vol * 0.06, 0, 1, at + 0.025);
  for (const [x, y] of [[o, g], [o2, g2], [o3, g3]]) { x.connect(y); y.connect(out); x.start(at); x.stop(end + 0.05); }
}, 0.89);
