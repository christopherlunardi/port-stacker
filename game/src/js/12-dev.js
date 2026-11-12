// ---------- dev mode (owner only), the same ways in as Hereafter Man ----------
// On: opened from a file, unlocked before on this device, claude.ai says you own the artifact, the dev code (same code as Hereafter Man),
// or the secret combo on any pad or keys: DOWN DOWN UP UP RIGHT LEFT RIGHT LEFT B A. Everyone else never sees any of it.
// Use it from the DEV panel (the DEV button in the title bar, or ` on a keyboard). The pause menu is the same as everyone's (Chris 2026-11-08).
const DEV_HASH = 'dedc4706412b6851ff84d9cda4a1f5a5a4bed17b184d497db4a27af8dee7f74d';
const DEV_VIEWS = [
  // screens to preview without the device: [label, device pixels wide, high]
  ['THIS SCREEN', 0, 0],
  ['RETROID 2S 640X480', 640, 480],
  ['RETROID POCKET 6 1080P', 1920, 1080],
  ['4K TV', 3840, 2160],
  ['PHONE TALL 1170X2532', 1170, 1520],
  ['IPAD 4:3', 2048, 1536],
  ['ULTRAWIDE 21:9', 2560, 1080]
];
const DEV_ACTIONS = [
  [
    () => 'INVINCIBLE ' + (DEV.inv ? 'ON' : 'OFF'),
    () => {
      DEV.inv = !DEV.inv;
    }
  ],
  [
    () => 'ENEMIES ' + (DEV.noEnemies ? 'OFF' : 'ON'),
    () => {
      DEV.noEnemies = !DEV.noEnemies;
      if (DEV.noEnemies) {
        G.enemies = [];
      }
    }
  ],
  [
    () => 'LIVES + (' + G.lives + ')',
    () => {
      G.lives++; /* (Chris 2026-11-09) one more life */
      G.lifeFlash = 40;
    }
  ],
  [
    'NEXT STAGE',
    () => {
      startLevel((G.level + 1) % worldLen());
    }
  ],
  [
    'CLEAR STAGE',
    () => {
      G.state = 'clear';
      G.t = 0;
      SFX.clear();
    }
  ],
  [
    'HORN +5',
    () => {
      if (G.p) G.p.horns += 5;
    }
  ],
  [
    () => 'HITBOXES ' + (DEV.hitboxes ? 'ON' : 'OFF'),
    () => {
      DEV.hitboxes = !DEV.hitboxes;
    }
  ],
  [
    () => 'SCREEN: ' + DEV_VIEWS[DEV.viewIdx || 0][0],
    () => {
      DEV.viewIdx = ((DEV.viewIdx || 0) + 1) % DEV_VIEWS.length;
      devApplyView();
    }
  ]
];
function devApplyView() {
  const v = DEV_VIEWS[DEV.viewIdx || 0];
  DEV.view = v[1] ? [v[1], v[2]] : null;
  DEV.showSize = !!DEV.view;
  if (typeof resizeScreen === 'function') resizeScreen();
}
const DEV_SEQ = ['down', 'down', 'up', 'up', 'right', 'left', 'right', 'left', 'b', 'a'];
function devSecret(seq) {
  if (DEV.on || seq.length < DEV_SEQ.length || DEV_SEQ.some((k, i) => seq[seq.length - DEV_SEQ.length + i] !== k)) return;
  try {
    localStorage.setItem('stackstyle.devkey', DEV_HASH);
  } catch (_) {}
  const cd = document.getElementById('devCode');
  if (cd) cd.remove();
  devInstall();
  SFX.oneup();
  G.banner = { text: 'DEV MODE ON', t: 120 };
}
async function devCodeOk(code) {
  try {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code.trim().toLowerCase()));
    return [...new Uint8Array(b)].map(v => v.toString(16).padStart(2, '0')).join('') === DEV_HASH;
  } catch (e) {
    return false;
  }
}
function devCodePrompt() {
  if (DEV.on || document.getElementById('devCode')) return;
  const box = document.createElement('form');
  box.id = 'devCode';
  box.style.cssText =
    'position:fixed;left:50%;top:30%;transform:translateX(-50%);z-index:50;background:#2a1f22;border:1px solid #f2b440;border-radius:8px;padding:14px;display:flex;gap:8px;font:13px system-ui;color:#eee';
  box.innerHTML =
    '<input type="password" autocomplete="off" placeholder="Dev code" style="font:16px system-ui;padding:6px;width:140px"><button style="font:13px system-ui;padding:6px 10px">Unlock</button>';
  box.addEventListener('submit', async e => {
    e.preventDefault();
    const v = box.querySelector('input').value;
    if (await devCodeOk(v)) {
      try {
        localStorage.setItem('stackstyle.devkey', DEV_HASH);
      } catch (_) {}
      box.remove();
      devInstall();
    } else box.remove();
  });
  document.body.appendChild(box);
  box.querySelector('input').focus();
}
function devInstall() {
  if (DEV.on) return;
  DEV.on = true;
  const css = document.createElement('style');
  // its own colours, always the dark ones: on touch screens (phones, the Retroids) the page's colours turn to the cream handheld's, and
  // the panel's text went dark on dark (Chris 2026-11-10: "black on black")
  css.textContent = `#devPanel,#devBtn{--shell:#17203b;--shell-hi:#243058;--ink:#f7ecde;--muted:#a3b1d6;--accent:#ffe200;--button:#2b3866;color-scheme:dark}
  #devBtn{font:700 11px var(--ui);letter-spacing:.14em;background:var(--accent);color:var(--shell);border:0;border-radius:4px;padding:4px 10px;cursor:pointer}
  #devPanel{position:fixed;top:0;right:0;bottom:0;left:0;z-index:20;background:rgba(10,7,9,.72);display:flex;justify-content:center;align-items:flex-start;overflow:auto;padding:max(16px,env(safe-area-inset-top,0px)) 16px 24px}
  #devPanel[hidden]{display:none}
  #devPanel .card{background:var(--shell-hi);color:var(--ink);border:1px solid var(--accent);border-radius:8px;max-width:560px;width:100%;padding:16px;display:flex;flex-direction:column;font:13px/1.4 var(--ui)}
  #devPanel .card>*+*{margin-top:12px}
  #devPanel h3{margin:0;font:700 12px var(--ui);letter-spacing:.16em;color:var(--accent);text-transform:uppercase}
  #devPanel .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}
  #devPanel button{font:11px var(--ui);color:var(--ink);background:var(--button);border:1px solid transparent;border-radius:4px;padding:8px;text-align:left;cursor:pointer}
  #devPanel button:hover,#devPanel button:focus-visible,#devPanel button.sel{border-color:var(--accent);outline:none;box-shadow:0 0 0 2px var(--accent)}
  #devPanel button[aria-pressed="true"]{background:var(--accent);color:#191315}
  #devPanel .srow{display:flex;flex-wrap:wrap;align-items:center}
  #devPanel .srow>*{margin:0 6px 6px 0}
  #devPanel .slab{width:150px;font:700 11px var(--ui);letter-spacing:.08em;color:var(--muted)}
  #devPanel .srow button{min-width:44px;text-align:center}
  #devPanel .muted{color:var(--muted);font-size:10px;margin:0}`;
  document.head.appendChild(css);
  const top = document.querySelector('.top');
  const btn = document.createElement('button');
  btn.id = 'devBtn';
  btn.textContent = 'DEV';
  if (top) top.appendChild(btn);
  const panel = document.createElement('div');
  panel.id = 'devPanel';
  panel.hidden = true;
  const card = document.createElement('div');
  card.className = 'card';
  panel.appendChild(card);
  document.body.appendChild(panel);
  const section = title => {
    const h = document.createElement('h3');
    h.textContent = title;
    card.appendChild(h);
    const gr = document.createElement('div');
    gr.className = 'grid';
    card.appendChild(gr);
    return gr;
  };
  const button = (parent, label, fn) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.onclick = () => {
      fn();
      if (G.state !== 'title') tele('dev', { what: b.textContent.slice(0, 30), label: G.p ? stageId() : '' });
      G.devRun = true; // (Chris 2026-11-09) this game used the dev panel: its play log is marked dev, and left out of real-play numbers
      refresh();
    };
    parent.appendChild(b);
    return b;
  };
  // stages (Chris 2026-11-09: the shift stepper wasn't intuitive): one row per shift, its name and look on the left and a button for each of
  // its stages; the last row is OVERTIME, with - and + to pick how hot, and its stages
  const h = document.createElement('h3');
  h.textContent = 'Go to a stage';
  card.appendChild(h);
  const go = (w, i) => {
    if (!G.p) newGame();
    G.loop = w;
    startLevel(i);
    G.state = 'play';
    close();
  };
  const row = label => {
    const r = document.createElement('div');
    r.className = 'srow';
    const l = document.createElement('span');
    l.className = 'slab';
    l.textContent = label;
    r.appendChild(l);
    card.appendChild(r);
    return [r, l];
  };
  [
    [0, 'SHIFT 1 · DAY'],
    [1, 'SHIFT 2 · NIGHT'],
    [2, 'SHIFT 3 · STORM']
  ].forEach(([w, name]) => {
    const [r] = row(name);
    for (let i = 0; i < worldLen(w); i++) button(r, w + 1 + '-' + (i + 1), () => go(w, i)).title = LEVELS[i].name;
  });
  // overtime: - and + pick which, then its three shifts, each with the stages it replays
  DEV.ot = DEV.ot || 1;
  const [or, ol] = row('');
  button(or, '−', () => (DEV.ot = Math.max(1, DEV.ot - 1)));
  button(or, '+', () => DEV.ot++);
  const otRows = [0, 1, 2].map(sh => {
    const [r, l] = row('');
    l.textContent = '  SHIFT ' + (sh + 1) + ' · ' + SHIFT_LOOKS[sh].toUpperCase();
    for (let i = 0; i < worldLen(sh); i++) button(r, '', () => go(3 + (DEV.ot - 1) * 3 + sh, i)).title = LEVELS[i].name;
    return r;
  });
  function stageLabels() {
    ol.textContent = 'OVERTIME ' + DEV.ot;
    otRows.forEach((r, sh) =>
      r.querySelectorAll('button').forEach((b, i) => (b.textContent = 'OT' + DEV.ot + ' ' + (sh + 1) + '-' + (i + 1)))
    );
  }
  const names = document.createElement('p');
  names.className = 'muted';
  names.textContent = LEVELS.map((lv, i) => 'x-' + (i + 1) + ' ' + lv.name).join(' · ');
  card.appendChild(names);
  const acts = section('Cheats and views');
  const toggles = [];
  for (const a of DEV_ACTIONS) {
    const b = button(acts, '', a[1]);
    toggles.push([b, a[0]]);
  }
  const views = section('Preview a screen');
  DEV_VIEWS.forEach((v, i) =>
    button(views, v[0].toLowerCase(), () => {
      DEV.viewIdx = i;
      devApplyView();
    })
  );
  const st = document.createElement('p');
  st.className = 'muted';
  card.appendChild(st);
  function refresh() {
    stageLabels();
    for (const [b, l] of toggles) b.textContent = typeof l === 'function' ? l() : l;
    st.textContent = 'Build ' + BUILD + ' · field scale ' + LAY.s.toFixed(2) + '× · ` opens and closes this panel, Esc closes it.';
  }
  const open = () => {
    refresh();
    panel.hidden = false;
    if (G.state === 'play') pauseGame();
  };
  const close = () => {
    panel.hidden = true;
  };
  btn.onclick = open;
  // on the Retroid (Chris 2026-11-09): nothing about it shows in the game; hold SELECT about a second and a half to open the panel, then the
  // d-pad moves between its buttons, A presses one, B (or SELECT, or START) closes it. The game doesn't see those presses.
  const items = () => [...card.querySelectorAll('button')].filter(b => !b.hidden);
  let sel = 0,
    holdT = null;
  const mark = () => {
    const it = items();
    sel = Math.max(0, Math.min(it.length - 1, sel));
    it.forEach((b, i) => b.classList.toggle('sel', i === sel));
    if (it[sel]) it[sel].scrollIntoView({ block: 'nearest' });
  };
  const move = k => {
    const it = items(),
      cur = it[sel];
    if (!cur) return;
    const r = cur.getBoundingClientRect();
    if (k === 'left' || k === 'right') sel += k === 'left' ? -1 : 1;
    else {
      // the nearest button in the row above or below
      let best = sel,
        bd = 1e9;
      it.forEach((b, i) => {
        const q = b.getBoundingClientRect(),
          dy = k === 'down' ? q.top - r.top : r.top - q.top;
        if (dy <= 4) return;
        const d = dy * 4 + Math.abs(q.left - r.left);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      sel = best;
    }
    mark();
  };
  const gameKey = window.ssKey;
  window.ssKey = (k, down) => {
    if (!panel.hidden) {
      if (!down) return;
      if (k === 'a') {
        const b = items()[sel];
        if (b) b.click();
        if (!panel.hidden) mark();
      } else if (k === 'b' || k === 'select' || k === 'start') close();
      else move(k);
      return;
    }
    if (k === 'select') {
      clearTimeout(holdT);
      if (down)
        holdT = setTimeout(() => {
          if (gameKey) gameKey('select', false);
          open();
          mark();
        }, 1500);
    }
    if (gameKey) gameKey(k, down);
  };
  panel.addEventListener('click', e => {
    if (e.target === panel) close();
  });
  window.addEventListener(
    'keydown',
    e => {
      if (e.code === 'Backquote') {
        e.preventDefault();
        panel.hidden ? open() : close();
      } else if (e.code === 'Escape' && !panel.hidden) {
        e.preventDefault();
        e.stopImmediatePropagation();
        close();
      }
    },
    true
  );
}
// the way in by hand on a phone: press and hold the title bar about a second, or tap it five times quickly
function devHooks() {
  const top = document.querySelector('.top');
  if (top) {
    let n = 0,
      t0 = 0,
      hold = null;
    const open = () => devCodePrompt();
    top.addEventListener('click', () => {
      const now = Date.now();
      n = now - t0 < 600 ? n + 1 : 1;
      t0 = now;
      if (n >= 5) {
        n = 0;
        open();
      }
    });
    top.addEventListener('pointerdown', () => {
      clearTimeout(hold);
      hold = setTimeout(open, 900);
    });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) top.addEventListener(ev, () => clearTimeout(hold));
    top.addEventListener('contextmenu', e => {
      e.preventDefault();
      open();
    });
  }
  devCheck();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) devCheck();
  });
}
async function devCheck() {
  if (DEV.on) return;
  if (location.protocol === 'file:') return devInstall();
  try {
    if (localStorage.getItem('stackstyle.devkey') === DEV_HASH) return devInstall();
  } catch (e) {}
  for (let i = 0; i < 40 && !(window.claude && window.claude.use); i++) await new Promise(r => setTimeout(r, 750)); // a phone can take a while to hand the page its claude.ai link
  try {
    const u = window.claude && (await window.claude.use('user'));
    if (u && (await u.isOwner())) {
      try {
        localStorage.setItem('stackstyle.devkey', DEV_HASH);
      } catch (_) {}
      devInstall();
    }
  } catch (e) {}
}
