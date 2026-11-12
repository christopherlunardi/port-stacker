// shared by the combo-display options: how long since the last move (for a pop), the multiplier, the window
function comboState() { const win = G.comboWin || 150, age = win - G.comboT; return { m: comboMult(), win, age, k: G.comboT / win, pop: age < 10 ? 1 + 0.4 * Math.sin((age / 10) * Math.PI) : 1 }; }
function star(cx, cy, n, r1, r2, rot) { pg.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + (i / (n * 2)) * Math.PI * 2, r = i & 1 ? r2 : r1; pg.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } pg.closePath(); }
