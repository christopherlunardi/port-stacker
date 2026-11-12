// ---------- the studio intro before the title (Chris 2026-11-10): after the first press (the one a phone needs before it plays sound), the
// Idle Looping Studios intro (09c-studio.js, drawn by the Workshop's own code) plays in the game's screen with its sound, then fades to
// the title. Any press skips it. It draws on its own canvas laid over the game screen (inside #screenWrap, so it is the game window, not
// the page: Chris, build 174 covered the whole page) at the screen's own resolution, so the print shader leaves its black and pink
// alone. Its picture runs on the sound's clock, so the two can't drift apart (build 174's were "way off" on the phone). The game sits
// in state 'studio' meanwhile; update() moves it on to the title (studioTick) ----------
const studio = { cv: null, started: false, t0: 0, at: 0, done: false, buf: null, src: null, fading: false, skip: false, clock: null };
function studioStart() {
  G.state = 'studio';
  G.t = 0;
  studio.done = false;
  studio.skip = false;
  if (HEADLESS || typeof STUDIO === 'undefined') {
    studio.done = true;
    return;
  }
  const wrap = (scr && scr.parentNode) || document.body,
    cv = document.createElement('canvas');
  cv.style.cssText =
    'position:absolute;left:0;top:0;width:100%;height:100%;z-index:3;background:#000;opacity:1;transition:opacity .35s;touch-action:none';
  wrap.appendChild(cv);
  cv.addEventListener('pointerdown', e => {
    e.preventDefault();
    studio.skip = true;
  });
  studio.cv = cv;
  studio.started = false;
  let snd = false,
    art = false;
  const go = () => {
    if (!snd || !art || studio.started || !studio.cv) return;
    studio.started = true;
    const begin = () => {
      if (!studio.cv) return;
      studioPlay();
      requestAnimationFrame(studioFrame);
    };
    // the phone's audio is often still waking from the first tap: wait for it (a little), or the sound was skipped (Chris: no sound)
    if (AC && AC.state !== 'running' && AC.resume) {
      let once = false;
      const f = () => {
        if (once) return;
        once = true;
        begin();
      };
      try {
        const pr = AC.resume();
        if (pr && pr.then) pr.then(f, f);
      } catch (e) {}
      setTimeout(f, 600);
    } else begin();
  };
  STUDIO.load(() => {
    art = true;
    go();
  });
  if (AC && !muted && !studio.buf) {
    try {
      const bin = atob(STUDIO.snd.split(',')[1]),
        u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      let fired = false;
      const fin = b => {
        if (fired) return;
        fired = true;
        studio.buf = b || null;
        snd = true;
        go();
      };
      const p = AC.decodeAudioData(u8.buffer, fin, () => fin(null));
      if (p && p.catch) p.catch(() => fin(null));
    } catch (e) {
      snd = true;
    }
  } else snd = true;
  setTimeout(() => {
    snd = true;
    go();
  }, 1500); // a sound that never decodes doesn't hold the intro up
}
// starts the sound a moment ahead and sets the picture's clock to it: the picture's time is the sound's time (less the speaker's delay)
function studioPlay() {
  studio.clock = null;
  if (AC && !muted && studio.buf) {
    try {
      const s = AC.createBufferSource(),
        g = AC.createGain();
      g.gain.value = 1.6; // through the game's master volume and chain (Chris: the intro was a bit quiet)
      s.buffer = studio.buf;
      s.connect(g);
      g.connect(master);
      const at = AC.currentTime + 0.15,
        lag = (AC.outputLatency || 0) + (AC.baseLatency || 0);
      s.start(at);
      studio.src = studio.node = s; /* src: still watched for a stall; node: stopped on a skip */
      studio.clock = () => AC.currentTime - at - lag;
      studio.t0 = performance.now();
      studio.ac0 = AC.currentTime;
      studioLog('played', AC.state);
      return;
    } catch (e) {
      studioLog('start failed: ' + e.message, AC.state);
    }
  } else studioLog(!AC ? 'no audio' : muted ? 'muted' : 'not decoded', AC && AC.state);
  const t0 = performance.now() + 150;
  studio.clock = () => (performance.now() - t0) / 1000;
}
function studioFrame() {
  const cv = studio.cv;
  if (!cv) return;
  // the sound's clock stalls if the phone holds the audio back, at the start or part way through (a call, another app taking the sound):
  // after 0.4 s with no movement the picture keeps going on its own (Fable's bug check: it froze when the clock stopped mid-way)
  if (studio.src) {
    const now = performance.now();
    if (AC.currentTime !== studio.ac0) {
      studio.ac0 = AC.currentTime;
      studio.t0 = now;
    }
  }
  if (studio.src && performance.now() - studio.t0 > 400) {
    const t = studio.clock(),
      p0 = performance.now();
    studio.clock = () => t + (performance.now() - p0) / 1000;
    studio.src = null;
    // and the sound stops: if the audio wakes later it would play out of step with the picture
    try {
      studio.node.stop();
    } catch (e) {}
  }
  const dpr = Math.min(2, window.devicePixelRatio || 1),
    r = cv.getBoundingClientRect(),
    w = Math.max(1, Math.round(r.width * dpr)),
    h = Math.max(1, Math.round(r.height * dpr));
  if (cv.width !== w || cv.height !== h) {
    cv.width = w;
    cv.height = h;
  }
  const c = cv.getContext('2d'),
    t = studio.clock(),
    k = Math.min(w / STUDIO.W, h / STUDIO.H);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#000';
  c.fillRect(0, 0, w, h);
  c.setTransform(k, 0, 0, k, (w - STUDIO.W * k) / 2, (h - STUDIO.H * k) / 2);
  // then it fades to black (Chris picked it on the Workshop) and holds black a beat before the title comes up
  if (t <= STUDIO.len) STUDIO.draw(c, Math.max(0, t));
  else STUDIO.outro(c, Math.min(STUDIO.outroLen, t - STUDIO.len));
  if (t >= STUDIO.len + STUDIO.outroLen + 0.3) studio.done = true;
  if (!studio.fading) requestAnimationFrame(studioFrame);
}
function studioEnd() {
  const cv = studio.cv;
  studio.cv = null;
  // stopped on a skip, and whenever the sound is asleep: left queued, it would play late, over the title, with every sound held back
  // behind it (Fable's bug check)
  if (studio.node && (studio.skip || !AC || AC.state !== 'running'))
    try {
      studio.node.stop();
    } catch (e) {}
  studio.node = studio.src = null;
  studio.skip = false;
  G.state = 'title';
  G.t = 0;
  if (cv) {
    studio.fading = true;
    cv.style.opacity = '0';
    setTimeout(() => {
      cv.remove();
      studio.fading = false;
    }, 400);
  }
}
// what happened to its sound, in the play log (Chris: no sound on the phone)
function studioLog(snd, state) {
  try {
    if (typeof tele === 'function') tele('studio', { snd, ac: state || '' });
  } catch (e) {}
}
// in update(), state 'studio'
function studioTick(inp) {
  if (Object.values(inp.pressed).some(Boolean) && G.t > 10) studio.skip = true;
  if (studio.done || studio.skip) studioEnd();
}
