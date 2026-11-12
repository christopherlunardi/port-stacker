// C: Over Buck: a little starburst that rides above his hat, so your eyes never leave him
drawComboHud = function () {
  const p = G.p;
  comboBurst(Math.max(16, Math.min(PW - 40, p.x)), p.y - 46, 0.6);
};
