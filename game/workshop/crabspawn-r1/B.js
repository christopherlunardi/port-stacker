// B: BUBBLES AND LEAP. Bubbles rise from the water under the catwalk edge, more and faster as he nears (soft blub sounds instead of
// clicks), then he leaps up out of the harbor in an arc, spraying drops, and lands on the catwalk.
SFX.clack = function () { tone(520, 0.07, 'sine', 0.07, 260); };
SFX.splashUp = function () { noise(0.25, 0.25, 900); tone(240, 0.18, 'triangle', 0.1, 600); };
drawCrabWarnings = function () { if (G.state !== 'play') return;
  for (const w of spawnWarn()) { if (!w.at.crab || w.k < 0.25) continue; const k = (w.k - 0.25) / 0.75, n = 2 + Math.floor(k * 5);
    for (let i = 0; i < n; i++) { const ph = ((G.frame * (0.6 + k * 0.8) + i * 23) % 30) / 30, x = w.at.x + Math.sin(i * 2.3 + G.frame * 0.05) * 9, y = w.at.y + 7 - ph * 14, r = 0.8 + (i % 3) * 0.5;
      if (y > w.at.y + 1 || y < w.at.y - 6) { pg.globalAlpha = 1 - ph; pg.beginPath(); pg.arc(x, y, r, 0, 7); pg.fillStyle = ink(C.cream); pg.fill(); pg.lineWidth = 0.5; pg.strokeStyle = ink(C.sky); pg.stroke(); pg.globalAlpha = 1; } } } };
drawCrabSpawn = function (e) { const k = 1 - e.t / 46, y = e.y + 30 * (1 - k) - Math.sin(k * Math.PI) * 26;
  pg.save(); pg.beginPath(); pg.rect(e.x - 30, e.y - 80, 60, 81); if (k < 0.5) pg.clip(); art(k < 0.9 ? 'crab.wind' : 'crab.scuttle1', e.x, y, { flip: e.dx < 0 }); pg.restore();
  if (k < 0.6) for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.35, t = k * 46; pg.beginPath(); pg.arc(e.x + Math.cos(a) * t * 0.7, e.y + 2 + Math.sin(a) * t * 0.9 + 0.04 * t * t, 1, 0, 7); pg.fillStyle = ink(C.sky); pg.fill(); } };
