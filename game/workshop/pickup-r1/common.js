function pickupJingle() { [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.12, 'triangle', 0.1, 0, i * 0.07)); }
function arrived(it) { if (!it.jingled) { it.jingled = 1; pickupJingle(); } }
