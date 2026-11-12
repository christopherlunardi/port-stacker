// C: DROP IN. A shadow grows on the catwalk where he'll land, with a falling whistle at the end; he drops from the top of the screen,
// lands with a squash and a puff of dust.
SFX.clack = function () {};
SFX.splashUp = function () { noise(0.12, 0.35, 300); tone(90, 0.2, 'triangle', 0.25, 50); };
drawCrabWarnings = function () { if (G.state !== 'play') return;
  for (const w of spawnWarn()) { if (!w.at.crab || w.k < 0.2) continue; const k = (w.k - 0.2) / 0.8;
    pg.save(); pg.globalAlpha = 0.25 + k * 0.4; pg.beginPath(); pg.ellipse(w.at.x, w.at.y + 0.5, 3 + k * 9, 1 + k * 1.8, 0, 0, 7); pg.fillStyle = ink(C.indigo); pg.fill(); pg.restore();
    if (w.t === 40) { tone(1800, 0.65, 'sine', 0.06, 500); } } };
drawCrabSpawn = function (e) { const k = 1 - e.t / 46;
  if (k < 0.45) { const f = k / 0.45; art('crab.charge', e.x, e.y - 160 * (1 - f * f), { flip: e.dx < 0 }); return; }
  const s = k < 0.6 ? 1 - Math.sin((k - 0.45) / 0.15 * Math.PI) * 0.35 : 1; art('crab.scuttle1', e.x, e.y, { flip: e.dx < 0, sy: s, sx: 2 - s });
  for (const d of [-1, 1]) { const t = (k - 0.45) * 46; pg.globalAlpha = Math.max(0, 1 - t / 18); pg.beginPath(); pg.arc(e.x + d * (6 + t * 0.6), e.y - 2 - t * 0.15, 2 + t * 0.12, 0, 7); pg.fillStyle = ink(C.cream); pg.fill(); pg.globalAlpha = 1; } };
