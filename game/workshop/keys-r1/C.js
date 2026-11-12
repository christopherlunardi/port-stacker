// C: tack piano, the old saloon sound: three strings tuned a little apart (the honky-tonk wobble), bright, with a tack on each hammer
keysVoice((m, at, dur, vol, f, out) => {
  const end = at + Math.max(0.22, dur) + 0.35, hp = AC.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 140; hp.connect(out);
  for (const det of [-11, 0, 12]) { const o = kOsc('piano', f, det), g = kGain(at, 0.003, vol * 0.48, 0.12, 0.28, end); o.connect(g); g.connect(hp); o.start(at); o.stop(end + 0.05); }
  kClick(at, vol * 0.5, 5200, out);
}, 1.53);
