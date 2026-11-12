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
