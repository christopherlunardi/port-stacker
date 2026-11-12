// ---------- audio: everything synthesized (tone, noise) ----------
let AC = null,
  master = null,
  noiseBuf = null;
let muted = store.get('mute', false);
// iPhone: the silent switch mutes web audio. Two fixes, both before the sound engine starts and inside the tap that starts it
// (Chris 2026-11-07: no sound on vibrate): say the page plays media (iOS 17+), and loop a real (silent) audio track so iOS treats
// the page like a music player (older iOS). The track is a second of 8kHz 8-bit silence made here, so there's no file to load.
function silentWav() {
  const n = 8000,
    b = new Uint8Array(44 + n),
    v = new DataView(b.buffer),
    w = (o, t) => {
      for (let i = 0; i < t.length; i++) b[o + i] = t.charCodeAt(i);
    };
  w(0, 'RIFF');
  v.setUint32(4, 36 + n, true);
  w(8, 'WAVEfmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true);
  v.setUint32(28, 8000, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  w(36, 'data');
  v.setUint32(40, n, true);
  b.fill(128, 44);
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return 'data:audio/wav;base64,' + btoa(s);
}
function audioUnlock() {
  if (HEADLESS) return;
  try {
    if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback';
  } catch (e) {}
  if (!window.__silent) {
    try {
      const a = document.createElement('audio');
      a.setAttribute('playsinline', '');
      a.setAttribute('webkit-playsinline', '');
      a.loop = true;
      a.preload = 'auto';
      a.src = silentWav();
      document.body.appendChild(a);
      const pr = a.play();
      if (pr && pr.catch)
        pr.catch(() => {
          window.__silent = null;
        });
      window.__silent = a;
    } catch (e) {}
  }
  try {
    if (!AC) {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain();
      master.gain.value = 0.32;
      master.connect(masterChain(AC));
      noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (AC.state === 'suspended' || AC.state === 'interrupted') AC.resume();
    if (typeof musicStart === 'function' && ((G.state === 'title' && G.introDone) || G.state === 'play' || G.state === 'pause'))
      musicStart(); /* never over the stage fanfare or a death (a press during the fanfare used to start it) */ // on the title the music waits for the logo to land
  } catch (e) {}
}
// the master chain (Chris 2026-11-10: the same one as Hereafter Man, for a good volume and to even the sounds out): a gentle "glue"
// compressor that evens out loud and soft without squashing them, makeup gain to bring the whole game up, then a fast limiter and a
// soft clip that only touch the very top so nothing distorts. Hereafter Man's settings.
const MIX = {
  glue: { threshold: -24, knee: 12, ratio: 2.8, attack: 0.012, release: 0.28 },
  makeup: 3.3,
  limit: { threshold: -4, knee: 2, ratio: 20, attack: 0.001, release: 0.08 },
  clip: 0.72
};
function masterChain(ctx) {
  try {
    const comp = o => {
      const c = ctx.createDynamicsCompressor();
      for (const k in o) c[k].value = o[k];
      return c;
    };
    const glue = comp(MIX.glue),
      up = ctx.createGain(),
      lim = comp(MIX.limit),
      clip = ctx.createWaveShaper(),
      n = 2048,
      cv = new Float32Array(n),
      c = MIX.clip;
    up.gain.value = MIX.makeup;
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1,
        a = Math.abs(x);
      cv[i] = a < c ? x : Math.sign(x) * (c + (1 - c) * Math.tanh((a - c) / (1 - c)));
    } // clean below the knee, then a warm round-off
    clip.curve = cv;
    clip.oversample = '2x';
    glue.connect(up);
    up.connect(lim);
    lim.connect(clip);
    clip.connect(ctx.destination);
    return glue;
  } catch (e) {
    return ctx.destination; // an old WebView without these: straight out, as before
  }
}
function tone(f, dur, type = 'square', vol = 0.25, f2 = 0, delay = 0) {
  if (!AC || muted || AC.state !== 'running') return; // asleep: dropped, not saved up to all play at once when it wakes (Fable's bug check)
  const t = AC.currentTime + delay,
    o = AC.createOscillator(),
    gn = AC.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  gn.gain.setValueAtTime(vol, t);
  gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(gn);
  gn.connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}
function noise(dur, vol = 0.2, freq = 1200, delay = 0) {
  if (!AC || muted || AC.state !== 'running') return;
  const t = AC.currentTime + delay,
    s = AC.createBufferSource(),
    f = AC.createBiquadFilter(),
    gn = AC.createGain();
  s.buffer = noiseBuf;
  f.type = 'bandpass';
  f.frequency.value = freq;
  gn.gain.setValueAtTime(vol, t);
  gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f);
  f.connect(gn);
  gn.connect(master);
  s.start(t);
  s.stop(t + dur + 0.02);
}
const SFX = {
  start() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.09, 'square', 0.18, 0, i * 0.07));
  },
  press() {
    tone(620, 0.04, 'square', 0.12, 480);
  },
  drop() {
    tone(420, 0.3, 'triangle', 0.3, 110);
  },
  land() {
    noise(0.09, 0.35, 500);
    tone(110, 0.08, 'square', 0.15);
  }, // a container lands on a catwalk: a short metal thud
  landShip() {
    noise(0.18, 0.4, 260);
    tone(73, 0.35, 'triangle', 0.35, 55);
    tone(196, 0.5, 'square', 0.08, 0, 0.02);
    tone(147, 0.3, 'triangle', 0.18, 0, 0.12);
  }, // on the ship: a deep hull boom with a ringing clang
  riderSend() {
    tone(1200, 0.55, 'triangle', 0.18, 260);
    tone(1210, 0.55, 'sine', 0.1, 265);
  }, // enemies aboard a dropping container: a slide-whistle down
  squash() {
    noise(0.06, 0.45, 2400);
    noise(0.16, 0.35, 420, 0.03);
    tone(330, 0.09, 'square', 0.2, 110);
    tone(90, 0.18, 'sawtooth', 0.22, 45, 0.04);
  }, // crunch then splat
  chain(n) {
    const f = 523 * Math.pow(1.122, Math.min(n, 12) * 2);
    tone(f, 0.1, 'square', 0.16);
    tone(f * 1.5, 0.14, 'square', 0.12, 0, 0.07);
  }, // each link a whole step higher
  points(big) {
    const b = big ? 1 : 0;
    tone(988 + b * 330, 0.06, 'square', 0.09);
    tone(1318 + b * 440, 0.09, 'square', 0.08, 0, 0.05);
    if (big) tone(1760, 0.14, 'triangle', 0.1, 0, 0.11);
  }, // a bright ding with each score popup
  horn() {
    tone(233, 0.32, 'sawtooth', 0.2);
    tone(294, 0.32, 'sawtooth', 0.16);
    tone(349, 0.32, 'square', 0.08);
  }, // the air horn
  empty() {
    tone(160, 0.12, 'square', 0.15);
  },
  stun() {
    tone(900, 0.06, 'square', 0.12, 1400);
  },
  rider() {
    [784, 988, 1175].forEach((f, i) => tone(f, 0.08, 'square', 0.16, 0, i * 0.06));
  },
  order() {
    [523, 659, 784, 659, 1046].forEach((f, i) => tone(f, 0.1, 'square', 0.18, 0, i * 0.08));
  },
  pickup() {
    tone(880, 0.07, 'square', 0.16);
    tone(1320, 0.1, 'square', 0.16, 0, 0.07);
  },
  dash() {
    noise(0.12, 0.18, 1800);
    tone(300, 0.1, 'triangle', 0.12, 700);
  },
  die() {
    tone(660, 0.6, 'square', 0.25, 80);
  },
  clear() {
    [523, 587, 659, 784, 880, 1046].forEach((f, i) => tone(f, 0.12, 'square', 0.18, 0, i * 0.09));
  },
  pause() {
    tone(440, 0.06, 'square', 0.12);
  },
  squawk() {
    // a gull's harsh cry: two falling squawks
    tone(1500, 0.12, 'sawtooth', 0.09, 900);
    tone(1350, 0.16, 'sawtooth', 0.08, 700, 0.14);
  },
  flap() {
    noise(0.05, 0.12, 900);
    noise(0.05, 0.1, 800, 0.09);
  },
  rev() {
    // the forklift revs up: an engine climbing, then a short beep-beep
    tone(70, 0.75, 'sawtooth', 0.14, 190);
    noise(0.7, 0.08, 400);
    tone(980, 0.07, 'square', 0.1, 0, 0.78);
    tone(980, 0.07, 'square', 0.1, 0, 0.9);
  },
  thunder() {
    // a crack, then a long low rumble that rolls away
    noise(0.12, 0.3, 1800);
    noise(1.6, 0.32, 140, 0.05);
    noise(1.1, 0.18, 260, 0.3);
    tone(48, 1.4, 'triangle', 0.16, 34, 0.05);
  },
  // the SHIP LOADED card: a soft knock as each stat lands, a ticking that climbs as the points count up, a bright chord at the total
  tallyRow(r) {
    noise(0.04, 0.16, 700);
    tone(392 + r * 49, 0.06, 'square', 0.09);
  },
  tally(k) {
    tone(620 + k * 760, 0.025, 'square', 0.055);
  },
  tallyTime(over) {
    tone(over ? 300 : 1500, 0.03, 'square', 0.05, over ? 240 : 1700);
  },
  tallyDone() {
    [1046, 1318, 1568].forEach((f, i) => tone(f, 0.22, 'square', 0.1, 0, i * 0.04));
    noise(0.08, 0.12, 3000);
  },
  move() {
    tone(700, 0.03, 'square', 0.08);
  },
  // the title intro (Chris 2026-11-07: sound effects for the intro, a rise into the title slamming down)
  step() {
    noise(0.03, 0.1, 900);
  },
  stomp() {
    noise(0.05, 0.2, 300);
    tone(80, 0.07, 'triangle', 0.16);
  },
  winch(dur, up) {
    tone(up ? 90 : 150, dur, 'sawtooth', 0.045, up ? 150 : 90);
    noise(dur, 0.035, 650);
  },
  clank() {
    noise(0.05, 0.3, 3000);
    tone(1400, 0.12, 'square', 0.05);
    tone(990, 0.25, 'triangle', 0.08, 0, 0.01);
  },
  launch() {
    // a bash in POWER RUSH (Chris 2026-11-09): a smack, then a whistle as he flies off
    noise(0.07, 0.35, 900);
    tone(160, 0.1, 'square', 0.18, 80);
    tone(500, 0.45, 'triangle', 0.09, 1800);
  },
  ko() {
    // and the twinkle as he goes off the edge of the screen
    tone(2600, 0.1, 'triangle', 0.07, 3400); // a quick bright ting
  },
  whoosh() {
    tone(900, 0.28, 'triangle', 0.1, 220);
    noise(0.28, 0.08, 1200);
  },
  scuttle() {
    tone(2300, 0.02, 'square', 0.035);
  },
  doorTick(n) {
    noise(0.02, 0.25, 3500);
    tone(110 + n * 10, 0.18, 'sawtooth', 0.025);
  }, // a door lamp switches on: a relay click and a hum (Chris's pick, Workshop door sounds r1 B, 2026-11-08)
  doorOpen() {
    for (let i = 0; i < 5; i++) noise(0.12, 0.08 + i * 0.02, 260 + i * 40, i * 0.08);
    tone(55, 0.45, 'sawtooth', 0.05, 70);
    noise(0.05, 0.3, 500, 0.45);
    tone(90, 0.1, 'triangle', 0.15, 0, 0.45);
  }, // the shutter rolls up with a rumble and stops with a clunk
  rattle() {
    for (let i = 0; i < 6; i++) tone(1800 + (i & 1) * 400, 0.025, 'square', 0.05, 0, i * 0.05);
  }, // the crab winding up in the title intro
  watchTurn() {
    tone(1200, 0.04, 'square', 0.05);
    tone(1600, 0.06, 'square', 0.05, 0, 0.06);
  }, // the Watchman spots you behind him: a sharp double blip
  watchSpot() {
    tone(900, 0.07, 'square', 0.04, 1350);
  }, // you walked into his flashlight and he breaks into a run: one quick rising blip (Chris 2026-11-11)
  crabFall() {
    tone(2100, 0.7, 'triangle', 0.09, 420);
    tone(2110, 0.7, 'sine', 0.04, 425);
  }, // a crab falling: a cartoon slide whistle down (Chris's pick, Workshop crab drop sounds r1 B, 2026-11-08)
  crabLand() {
    noise(0.05, 0.2, 400);
    tone(160, 0.35, 'sine', 0.2, 520);
    tone(320, 0.25, 'triangle', 0.06, 900, 0.03);
  }, // and a springy boing as he lands
  pickupArrive() {
    [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.12, 'triangle', 0.1, 0, i * 0.07));
  }, // a delivery crate bursting open
  bonk() {
    tone(190, 0.28, 'sine', 0.32, 95);
    tone(520, 0.12, 'square', 0.1, 260);
    noise(0.06, 0.25, 500);
  },
  riser(sec) {
    // white noise sweeping up with a climbing tone, cut dead at the end
    if (!AC || muted) return;
    const t = AC.currentTime,
      s = AC.createBufferSource(),
      f = AC.createBiquadFilter(),
      g = AC.createGain(),
      o = AC.createOscillator(),
      og = AC.createGain();
    s.buffer = noiseBuf;
    s.loop = true;
    f.type = 'bandpass';
    f.Q.value = 3;
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(7000, t + sec);
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + sec);
    g.gain.setValueAtTime(0.0001, t + sec + 0.01);
    s.connect(f);
    f.connect(g);
    g.connect(master);
    s.start(t);
    s.stop(t + sec + 0.05);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(880, t + sec);
    og.gain.setValueAtTime(0.001, t);
    og.gain.exponentialRampToValueAtTime(0.1, t + sec);
    og.gain.setValueAtTime(0.0001, t + sec + 0.01);
    o.connect(og);
    og.connect(master);
    o.start(t);
    o.stop(t + sec + 0.05);
  },
  slam() {
    noise(0.5, 0.6, 180);
    tone(55, 0.7, 'triangle', 0.5, 38);
    tone(110, 0.4, 'square', 0.14, 70);
    noise(1.3, 0.22, 7000, 0.01);
    tone(660, 0.6, 'triangle', 0.12, 0, 0.01);
    tone(990, 0.5, 'triangle', 0.07, 0, 0.01);
  },
  snap() {
    tone(1100, 0.09, 'square', 0.12, 260);
    noise(0.05, 0.3, 2500);
    tone(180, 0.18, 'triangle', 0.12, 90, 0.02);
  }, // a rope snapping
  thud() {
    noise(0.25, 0.5, 160);
    tone(70, 0.3, 'triangle', 0.4, 40);
    tone(140, 0.08, 'square', 0.08, 60);
  }, // something heavy hitting the bottom
  oneup() {
    [784, 1046, 1318, 1568].forEach((f, i) => tone(f, 0.08, 'triangle', 0.2, 0, i * 0.06));
  },
  goldArrive() {
    [1568, 2093, 1568, 2349].forEach((f, i) => tone(f, 0.16, 'triangle', 0.09, 0, i * 0.09));
    tone(3136, 0.5, 'sine', 0.04, 0, 0.3);
  }, // the gold crate on its way down: a twinkle
  goldRush() {
    noise(0.12, 0.35, 3200);
    [523, 659, 784, 1046, 1318, 1568, 2093].forEach((f, i) => tone(f, 0.09, 'square', 0.13, 0, i * 0.045));
    tone(1046, 0.6, 'triangle', 0.12, 0, 0.32);
  }, // it shatters: glass, and a run up to the power-up
  rushCount(n) {
    tone(n === 1 ? 1175 : 988, 0.09, 'square', 0.12);
  }, // POWER RUSH's last three seconds: a beep on each of 3, 2, 1 (the 1 higher), then goldEnd as it runs out
  goldEnd() {
    [1046, 784, 523].forEach((f, i) => tone(f, 0.1, 'triangle', 0.12, 0, i * 0.08));
  } // and back down when it runs out
};
