// D: PAINTED ON THE SHIP. Stencilled on the hull like ship markings: lives at the stern (left), horns at the bow (right). They sail in
// and out with the ship.
function drawCorners() {}
const __ship = drawShip;
drawShip = function (sx) { __ship(sx); if (!G.p || G.state === 'title') return; const d = L.plateY, pop = hudPop();
  const plate = (x, label, n, s) => { pg.save(); pg.translate(x + sx - 32, d + 9.5); pg.scale(s, s); rrect(-20, -5.5, 40, 11, 2, C.cream, C.indigo, 0.8); textF(FONT_MAIN, label, -17, 0.4, 5, C.blue); textF(FONT_MAIN, String(n), 17, 0.4, 8, C.pink, 'right'); pg.restore(); };
  plate(70, 'LIVES', Math.max(0, G.lives), pop.l); plate(300, 'HORN', G.p.horns, pop.h); };
