// ---------- input ----------
// Buttons: up down left right, a (air horn), b (dash), start (pause), select. Same sources as Hereafter Man: keyboard, any game controller
// (Gamepad API), the on-screen pad on phones, and the Android launcher, which reads the Retroid's buttons itself and calls ssKey().
const keys = {};
let INPUT_SRC = ''; // what you last played with: keys, pad, touch or retroid (for the play log)
let pressed = {};
const BUTTONS = ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'select'];
const KEYMAP = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  KeyZ: 'a',
  Space: 'a',
  KeyJ: 'a',
  KeyX: 'b',
  ShiftLeft: 'b',
  ShiftRight: 'b',
  KeyK: 'b',
  Enter: 'start',
  Escape: 'start',
  KeyP: 'start',
  Tab: 'select',
  Backspace: 'select'
};
const PAD_SEQ = [];
function padNote(k) {
  PAD_SEQ.push(k);
  if (PAD_SEQ.length > 12) PAD_SEQ.shift();
  if (typeof devSecret === 'function') devSecret(PAD_SEQ);
} // the last presses, for the secret way into dev mode (12)
function press(k) {
  if (!keys[k]) {
    pressed[k] = true;
    padNote(k);
  }
  keys[k] = true;
  audioUnlock();
}
function release(k) {
  keys[k] = false;
}
function takeInput() {
  padPoll();
  const inp = { held: keys, pressed };
  return inp;
}
function inputDone() {
  pressed = {};
}
// game controllers in a browser: the d-pad or left stick moves, bottom face button = A (air horn), right = B (dash), the other two
// face buttons and the shoulders the same, Start pauses, Select is Select. Using a pad hides the on-screen buttons until a touch.
const PAD_BTN = { 0: 'a', 2: 'a', 1: 'b', 3: 'b', 4: 'b', 5: 'b', 9: 'start', 8: 'select', 12: 'up', 13: 'down', 14: 'left', 15: 'right' },
  padHeld = {};
function padPoll() {
  if (HEADLESS) return;
  let pads;
  try {
    pads = navigator.getGamepads ? navigator.getGamepads() : null;
  } catch (e) {
    return;
  }
  if (!pads) return;
  const now = {};
  for (const gp of pads) {
    if (!gp || !gp.connected) continue;
    for (const [i, k] of Object.entries(PAD_BTN)) {
      const b = gp.buttons[i];
      if (b && (b.pressed || b.value > 0.5)) now[k] = true;
    }
    const ax = gp.axes[0] || 0,
      ay = gp.axes[1] || 0;
    if (ax < -0.5) now.left = true;
    if (ax > 0.5) now.right = true;
    if (ay < -0.5) now.up = true;
    if (ay > 0.5) now.down = true;
  }
  for (const k of BUTTONS) {
    if (now[k] && !padHeld[k]) {
      INPUT_SRC = 'pad';
      press(k);
      document.body.classList.add('padmode');
      onLayoutChange();
    } else if (!now[k] && padHeld[k]) release(k);
    padHeld[k] = !!now[k];
  }
}
// the Android launcher (android/): the Retroid's buttons arrive here, never as keys, so Android can't hop the focus around the page
window.ssKey = (k, down) => {
  if (BUTTONS.indexOf(k) < 0) return;
  INPUT_SRC = 'retroid';
  if (down) press(k);
  else release(k);
};
window.ssInApp = () => {
  document.body.classList.add('inapp', 'padmode');
  onLayoutChange();
  audioUnlock();
  if (G.state === 'splash') studioStart(); // the Retroid app needs no tap for sound: straight to the studio intro
};
function onLayoutChange() {
  if (typeof resizeScreen === 'function') setTimeout(resizeScreen, 30);
}
if (!HEADLESS) {
  const typing = e => {
    const t = e.target;
    return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
  };
  window.addEventListener('keydown', e => {
    if (typing(e)) return;
    const k = KEYMAP[e.code];
    if (!k) return;
    e.preventDefault();
    INPUT_SRC = 'keys';
    if (!e.repeat) press(k);
  });
  window.addEventListener('keyup', e => {
    if (typing(e)) return;
    const k = KEYMAP[e.code];
    if (k) release(k);
  });
  window.addEventListener('blur', () => {
    for (const k in keys) keys[k] = false;
  });
  window.addEventListener(
    'touchstart',
    () => {
      if (!document.body.classList.contains('inapp') && document.body.classList.contains('padmode')) {
        document.body.classList.remove('padmode');
        onLayoutChange();
      }
    },
    { passive: true }
  );
}
function hookButton(el, k) {
  if (!el) return;
  const on = e => {
    e.preventDefault();
    INPUT_SRC = 'touch';
    press(k);
    el.classList.add('on');
    try {
      el.setPointerCapture(e.pointerId);
    } catch (_) {}
  };
  const off = e => {
    if (e && e.type === 'pointerup') audioUnlock(); // (some phones only let sound start on the finger coming up)
    release(k);
    el.classList.remove('on');
  };
  el.addEventListener('pointerdown', on);
  el.addEventListener('pointerup', off);
  el.addEventListener('pointercancel', off);
  el.addEventListener('lostpointercapture', off);
  el.addEventListener('contextmenu', e => e.preventDefault());
}
function hookTouch() {
  hookButton(document.getElementById('btnA'), 'a');
  hookButton(document.getElementById('btnB'), 'b');
  hookButton(document.getElementById('btnStart'), 'start');
  hookButton(document.getElementById('btnSel'), 'select');
  const el = document.getElementById('dpad');
  if (el) {
    let id = null;
    const set = e => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2),
        dy = e.clientY - (r.top + r.height / 2);
      const dirs = { up: false, down: false, left: false, right: false };
      if (Math.hypot(dx, dy) > 12) {
        const a = (Math.atan2(dy, dx) * 180) / Math.PI; // 8-way
        if (a > -157.5 && a < -22.5) dirs.up = true;
        if (a > 22.5 && a < 157.5) dirs.down = true;
        if (a > 112.5 || a < -112.5) dirs.left = true;
        if (a > -67.5 && a < 67.5) dirs.right = true;
      }
      const one = Object.values(dirs).filter(Boolean).length === 1; // (the secret combo counts plain directions only)
      for (const k in dirs) {
        if (dirs[k] && !keys[k]) {
          pressed[k] = true;
          if (one) padNote(k);
        }
        keys[k] = dirs[k];
      }
      el.className =
        'dpad' + (dirs.up ? ' on-up' : '') + (dirs.down ? ' on-dn' : '') + (dirs.left ? ' on-lf' : '') + (dirs.right ? ' on-rt' : '');
    };
    const clear = () => {
      id = null;
      keys.up = keys.down = keys.left = keys.right = false;
      el.className = 'dpad';
    };
    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      INPUT_SRC = 'touch';
      audioUnlock();
      id = e.pointerId;
      try {
        el.setPointerCapture(id);
      } catch (_) {}
      set(e);
    });
    el.addEventListener('pointermove', e => {
      if (e.pointerId === id) set(e);
    });
    el.addEventListener('pointerup', clear);
    el.addEventListener('pointercancel', clear);
    el.addEventListener('lostpointercapture', clear);
  }
  // iPhone: a held finger starts selecting text and shows the magnifier; taking the touch stops it (pointer events still fire)
  for (const id of ['screen', 'pad']) {
    const e2 = document.getElementById(id);
    if (e2)
      for (const ev of ['touchstart', 'touchmove'])
        e2.addEventListener(
          ev,
          e => {
            if (e.cancelable) e.preventDefault();
          },
          { passive: false }
        );
  }
  const scr = document.getElementById('screen');
  scr.addEventListener('pointerdown', () => {
    audioUnlock();
    if (G.state === 'title' || G.state === 'over' || G.attract) press('start'), release('start'); // (a demo: back to the title)
  });
}
