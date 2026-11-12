// D: HATCH. A round hatch appears in the catwalk and starts rattling, its lid lifting a crack with two eyes peering out; knock-knock
// sounds. Then the lid flips open, he springs out, and the hatch closes and vanishes.
SFX.clack = function () { tone(180, 0.05, 'triangle', 0.12); noise(0.03, 0.12, 700); };
SFX.splashUp = function () { tone(300, 0.08, 'square', 0.08, 600); noise(0.06, 0.2, 2000); };
function hatch(x, y, lift, rattle, eyes) { const j = rattle ? Math.sin(G.frame * 2.2) * 0.6 : 0;
  pg.beginPath(); pg.ellipse(x, y + 1.2, 9, 2.4, 0, 0, 7); pg.fillStyle = ink(C.indigo); pg.fill();
  if (eyes) for (const s of [-1, 1]) { pg.beginPath(); pg.arc(x + s * 2.2, y + 0.6, 0.9, 0, 7); pg.fillStyle = ink(C.cream); pg.fill(); }
  pg.save(); pg.translate(x + 8 + j, y + 0.8); pg.rotate(-lift); pg.beginPath(); pg.ellipse(-8, -0.4, 8.6, 2.2, 0, 0, 7); pg.fillStyle = ink(C.blue); pg.fill(); pg.lineWidth = 0.8; pg.strokeStyle = ink(C.indigo); pg.stroke();
  for (const dx of [-11, -8, -5]) { pg.beginPath(); pg.moveTo(dx, -1.6); pg.lineTo(dx + 1.5, 0.8); pg.stroke(); } pg.restore(); }
drawCrabWarnings = function () { if (G.state !== 'play') return;
  for (const w of spawnWarn()) { if (!w.at.crab || w.k < 0.2) continue; const k = (w.k - 0.2) / 0.8, knock = w.t % Math.max(10, Math.round(w.t / 4)) < 4;
    hatch(w.at.x, w.at.y, knock ? 0.08 + k * 0.25 : k * 0.12, knock, k > 0.4); } };
drawCrabSpawn = function (e) { const k = 1 - e.t / 46, lift = Math.min(1.6, k * 6);
  hatch(e.x, e.y, lift, false, false); if (k > 0.85) return;
  const up = k < 0.35 ? k / 0.35 : 1, y = e.y + 14 * (1 - up) - Math.sin(Math.min(1, k / 0.75) * Math.PI) * 14;
  pg.save(); pg.beginPath(); pg.rect(e.x - 30, e.y - 80, 60, 81); pg.clip(); art(k < 0.7 ? 'crab.climb' : 'crab.scuttle1', e.x, y, { flip: e.dx < 0 }); pg.restore(); };
