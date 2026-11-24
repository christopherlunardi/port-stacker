// ---------- sending play data to the studio (Chris 2026-11-23: collect everyone's play data, wherever they play, like Lexicon Signal) ----------
// The first time a player reaches the title menu, a notice asks (SHARE: 'yes' / 'no', kept as stackstyle.share; Pause, Options
// switches it). With 'yes', every play log event (14-telemetry.js) goes to the studio site: SHARE_URL is api/stacker.js in the
// idleloopingwebsite repo, which saves each event as a row in the table stacker_events of the site's database (the same one as
// Lexicon Signal's, its own table). Events wait in stackstyle.shareq (the newest 2000) and go in batches of up to 100: soon after
// start, a few seconds after each event, when the device comes back online, and every 2 minutes; a failed post leaves them for the
// next try. Anonymous: a random player id (stackstyle.pid), no name or account. owner: this device has the dev code (Chris's own).
// On the claude.ai link the events go to the artifact's own database instead (14-telemetry.js), and only if not switched off.
// Events from before the player answered wait too, and go if they say yes; 'no' drops them. The Retroid app also still posts the
// log to the repo's issue #1 (until Chris retires that).
const SHARE_URL = 'https://idlelooping.com/api/stacker/',
  SHARE_MAX = 2000,
  SHARE_BATCH = 100;
let SHARE = HEADLESS ? 'no' : store.get('share', null);
const ASK = { on: false, sel: 0 };
function playerId() {
  let id = store.get('pid', '');
  if (!/^[a-z0-9]{12}$/.test(id)) {
    id = '';
    for (let i = 0; i < 12; i++) id += 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)];
    store.set('pid', id);
  }
  return id;
}
function eventId() {
  let s = '';
  for (let i = 0; i < 12; i++) s += 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)];
  return s;
}
// where the game is running: the claude.ai link, the Retroid app, the installed web app, or a browser tab
function playPlace() {
  if (HEADLESS) return 'test';
  if (window.claude) return 'link';
  if (window.StackNative) return 'app';
  try {
    if (matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches) return 'webapp';
  } catch (e) {}
  return 'web';
}
function shareOwner() {
  try {
    return !!(DEV.on || localStorage.getItem('stackstyle.devkey'));
  } catch (e) {
    return false;
  }
}
function shareCan() {
  return !HEADLESS && !window.claude && location.protocol !== 'file:';
}
// tele() hands every event here
function shareQueue(ev) {
  if (!shareCan() || SHARE === 'no') return;
  const q = store.get('shareq', []);
  q.push(ev);
  store.set('shareq', q.slice(-SHARE_MAX));
  clearTimeout(shareQueue.t);
  shareQueue.t = setTimeout(shareFlush, 4000);
}
let shareBusy = false;
function shareFlush() {
  if (SHARE !== 'yes' || shareBusy || !shareCan() || navigator.onLine === false) return;
  const q = store.get('shareq', []);
  if (!q.length) return;
  const batch = q.slice(0, SHARE_BATCH);
  shareBusy = true;
  fetch(SHARE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ v: 1, pid: playerId(), owner: shareOwner(), events: batch })
  })
    .then(r => (r.ok ? r.json() : null))
    .then(j => {
      if (!j || !j.ok) return;
      // saved or turned away as bad (too big, no id): either way done with them
      const done = new Set(batch.map(e => e.id));
      store.set(
        'shareq',
        store.get('shareq', []).filter(e => !done.has(e.id))
      );
      if (batch.length === SHARE_BATCH) setTimeout(shareFlush, 1500); // more waiting
    })
    .catch(() => {})
    .finally(() => {
      shareBusy = false;
    });
}
if (!HEADLESS) {
  setTimeout(shareFlush, 8000);
  addEventListener('online', () => setTimeout(shareFlush, 2000));
  setInterval(shareFlush, 120000);
}
function shareSet(v) {
  SHARE = v;
  store.set('share', v);
  ASK.on = false;
  G.idleFrom = G.t; // (the title's demo waits its usual while again)
  if (v === 'no') store.set('shareq', []);
  else setTimeout(shareFlush, 500);
  G.banner = { text: v === 'yes' ? 'PLAY DATA ON. THANKS!' : 'PLAY DATA OFF', t: 150 };
}
// the title menu asks once (09-game.js calls this on the title before anything else): true while the notice is up and has the buttons
function askTitle(inp) {
  if (SHARE == null && (shareCan() || window.claude) && !G.attract) ASK.on = true; // (not in copies opened from a file: our test tools)
  if (!ASK.on) return false;
  if (inp.pressed.left || inp.pressed.right || inp.pressed.up || inp.pressed.down) {
    ASK.sel = 1 - ASK.sel;
    SFX.move();
  }
  if (inp.pressed.a || inp.pressed.start) {
    SFX.pause();
    shareSet(ASK.sel ? 'no' : 'yes');
  }
  return true;
}
// the notice: a rope-edged card over the title, in the old 320x240 field (drawn by 10-render.js through oldField). (This file comes before 13-main so all of it is set up before boot() logs the session.)
function drawAskBody() {
  const PW = 320,
    PH = 240,
    w = 236,
    x = (PW - w) / 2,
    size = 6.6,
    lh = 9.4,
    body = wrapText(
      'Port Stacker Deluxe can send what happens in your games (stages, scores, deaths, where Buck went) to Idle Looping Studios, so we can tune and balance the game. It is anonymous: no name, no account, nothing else from your device.',
      w - 28,
      size
    ),
    foot = wrapText('Offline? It waits and sends later. Switch it off any time under Pause, Options.', w - 28, size),
    h = 30 + body.length * lh + 6 + foot.length * lh + 30,
    y = Math.max(16, (PH - h) / 2);
  pg.save();
  pg.globalAlpha = 0.45;
  rect(-LAY.ox / TK, -LAY.oy / TK, LAY.LW / TK, LAY.LH / TK, C.indigo); // (the whole screen, wide ones too)
  pg.restore();
  ropePanel(x, y, w, h);
  ribbon(PW / 2, y - 8, 150, 18, C.pink, 'HELP TUNE THE DOCK', FONT_MAIN, 10);
  let ty = y + 20;
  for (const l of body) {
    textF(FONT_MAIN, l, x + 14, ty, size, C.indigo);
    ty += lh;
  }
  ty += 6;
  for (const l of foot) {
    textF(FONT_MAIN, l, x + 14, ty, size, C.blue);
    ty += lh;
  }
  ty += 8;
  const bw = (w - 28 - 10) / 2;
  ['SURE, SEND IT', 'NO THANKS'].forEach((lab, i) => {
    const bx = x + 14 + i * (bw + 10),
      on = ASK.sel === i;
    rrect(bx, ty - 7, bw, 14, 5, on ? C.pink : C.cream, on ? C.indigo : C.blue, on ? 1.4 : 0.8);
    textF(FONT_MAIN, lab, bx + bw / 2, ty + 0.5, 7, on ? C.cream : C.indigo, 'center');
  });
}
