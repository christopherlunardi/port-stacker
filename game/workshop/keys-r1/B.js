// B: upright piano: rounder and warmer, a soft hammer, notes ring a little longer and darken as they fade
keysVoice((m, at, dur, vol, f, out) => {
  const end = at + Math.min(1.6, Math.max(0.3, dur * 1.5)), lp = AC.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.setValueAtTime(m > 60 ? 4200 : 2600, at); lp.frequency.exponentialRampToValueAtTime(m > 60 ? 1300 : 800, at + 0.5);
  lp.connect(out);
  for (const det of [-3, 3]) { const o = kOsc('piano', f, det), g = kGain(at, 0.005, vol * 0.62, 0.25, 0.3, end); o.connect(g); g.connect(lp); o.start(at); o.stop(end + 0.05); }
  kClick(at, vol * 0.25, 2400, out);
}, 0.66);
