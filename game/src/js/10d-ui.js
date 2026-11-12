// ---------- UI pieces for menus, cards and boards (2026-11-07: Chris wants the menus, pause menu, stage cards and leaderboard made nice) ----------
// Fonts: open-licence (OFL) faces carried in the page as base64 woff2 and registered with addFont; textF draws with one, falling back to
// the system font until it has loaded. Shapes: rope frames, ribbons, bolts, stamps, dotted leaders, all in the game's inks.
const FONTS_READY = {};
// ONE font for every word in the game (Chris 2026-11-08: 'make everything the redesign font'); a Workshop font option just changes this
let FONT_MAIN = 'Bungee';
function addFont(name, b64) {
  try {
    const f = new FontFace(name, 'url(data:font/woff2;base64,' + b64 + ')');
    f.load()
      .then(ff => {
        document.fonts.add(ff);
        FONTS_READY[name] = true;
      })
      .catch(() => {});
  } catch (e) {}
}
function textF(fam, s, x, y, size, c, align = 'left', outline = null, o = {}) {
  if (o.maxW) {
    const w = textW(fam, s, size, o);
    if (w > o.maxW) size *= o.maxW / w;
  } // shrink to fit a box (side panels, long names)
  pg.font = (FONTS_READY[fam] ? o.weight || '' : '900') + ' ' + size + 'px ' + (FONTS_READY[fam] ? '"' + fam + '", ' : '') + FONT_STACK;
  pg.textAlign = align;
  pg.textBaseline = 'middle'; // bold system font until it has loaded
  if ('letterSpacing' in pg) pg.letterSpacing = (o.track || 0) + 'px';
  if (outline) textOutline(s, x, y, size, outline, o.ow || 0.28);
  pg.fillStyle = ink(c);
  pg.fillText(s, x, y);
  if ('letterSpacing' in pg) pg.letterSpacing = '0px';
}
function textW(fam, s, size, o = {}) {
  pg.font = (o.weight || '') + ' ' + size + 'px ' + (FONTS_READY[fam] ? '"' + fam + '", ' : '') + FONT_STACK;
  if ('letterSpacing' in pg) pg.letterSpacing = (o.track || 0) + 'px';
  const w = pg.measureText(s).width;
  if ('letterSpacing' in pg) pg.letterSpacing = '0px';
  return w;
}
function rrPoints(x, y, w, h, r, step) {
  // points around a rounded rectangle, for rope twists
  const pts = [],
    seg = [
      [x + r, y, x + w - r, y],
      [x + w, y + r, x + w, y + h - r],
      [x + w - r, y + h, x + r, y + h],
      [x, y + h - r, x, y + r]
    ],
    arcs = [
      [x + w - r, y + r, -Math.PI / 2],
      [x + w - r, y + h - r, 0],
      [x + r, y + h - r, Math.PI / 2],
      [x + r, y + r, Math.PI]
    ];
  for (let i = 0; i < 4; i++) {
    const [a, b, c, d] = seg[i],
      L = Math.hypot(c - a, d - b);
    for (let t = 0; t < L; t += step) pts.push([a + ((c - a) * t) / L, b + ((d - b) * t) / L]);
    const [cx, cy, a0] = arcs[i],
      AL = (r * Math.PI) / 2;
    for (let t = 0; t < AL; t += step) {
      const ang = a0 + t / r;
      pts.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]);
    }
  }
  return pts;
}
function ropeRect(x, y, w, h, r, thick = 3.4) {
  // a twisted yellow rope frame like the logo's lettering
  pg.save();
  pg.beginPath();
  pg.roundRect(x, y, w, h, r);
  pg.lineJoin = 'round';
  pg.lineWidth = thick + 1.6;
  pg.strokeStyle = ink(C.indigo);
  pg.stroke();
  pg.lineWidth = thick;
  pg.strokeStyle = ink(C.yel);
  pg.stroke();
  const pts = rrPoints(x, y, w, h, r, thick * 0.9);
  pg.lineWidth = 0.7;
  pg.strokeStyle = ink(C.indigo);
  pg.lineCap = 'round';
  for (let i = 0; i < pts.length; i++) {
    const [px, py] = pts[i],
      [qx, qy] = pts[(i + 1) % pts.length],
      dx = qx - px,
      dy = qy - py,
      L = Math.hypot(dx, dy) || 1,
      nx = -dy / L,
      ny = dx / L,
      s = thick * 0.45;
    pg.beginPath();
    pg.moveTo(px - nx * s - (dx / L) * s * 0.6, py - ny * s - (dy / L) * s * 0.6);
    pg.lineTo(px + nx * s + (dx / L) * s * 0.6, py + ny * s + (dy / L) * s * 0.6);
    pg.stroke();
  }
  pg.restore();
}
function ribbon(cx, y, w, h, col, label, fam, size, tcol = C.cream) {
  // a banner with swallowtail ends folded behind
  const x = cx - w / 2,
    tail = h * 0.9,
    f = h * 0.35;
  for (const s of [-1, 1]) {
    const ex = s < 0 ? x : x + w;
    pg.beginPath();
    pg.moveTo(ex, y + f);
    pg.lineTo(ex + s * tail, y + f);
    pg.lineTo(ex + s * tail * 0.6, y + f + h / 2);
    pg.lineTo(ex + s * tail, y + f + h);
    pg.lineTo(ex, y + f + h);
    pg.closePath();
    pg.fillStyle = ink(C.pinkD || col);
    pg.fill();
    pg.lineWidth = 1.3;
    pg.lineJoin = 'round';
    pg.strokeStyle = ink(C.indigo);
    pg.stroke();
  }
  rrect(x, y, w, h, 2, col, C.indigo, 1.4);
  if (label) textF(fam, label, cx, y + h / 2 + 0.5, size, tcol, 'center', C.indigo);
}
function stamp(label, cx, cy, size, col, rot, fam) {
  // a rubber stamp: double box, a little patchy
  pg.save();
  pg.translate(cx, cy);
  pg.rotate(rot);
  const w = textW(fam, label, size, { track: 1 }) + size * 1.2,
    h = size * 1.7;
  pg.globalAlpha = 0.9;
  rrect(-w / 2, -h / 2, w, h, 2, null, col, 1.6);
  rrect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 1.5, null, col, 0.7);
  textF(fam, label, 0, 0.5, size, col, 'center', null, { track: 1 });
  pg.restore();
}
function leader(x1, x2, y, col = C.indigo) {
  pg.fillStyle = ink(col);
  for (let x = x1; x < x2; x += 3) {
    pg.beginPath();
    pg.arc(x, y, 0.45, 0, 7);
    pg.fill();
  }
}
function lifeRing(x, y, r) {
  pg.beginPath();
  pg.arc(x, y, r, 0, 7);
  pg.arc(x, y, r * 0.5, 0, 7, true);
  pg.fillStyle = ink(C.cream);
  pg.fill('evenodd');
  for (let k = 0; k < 4; k++) {
    pg.beginPath();
    pg.arc(x, y, r, (k * Math.PI) / 2 + 0.35, (k * Math.PI) / 2 + 1.2);
    pg.arc(x, y, r * 0.5, (k * Math.PI) / 2 + 1.2, (k * Math.PI) / 2 + 0.35, true);
    pg.closePath();
    pg.fillStyle = ink(C.pink);
    pg.fill();
  }
  pg.lineWidth = 0.8;
  pg.strokeStyle = ink(C.indigo);
  pg.beginPath();
  pg.arc(x, y, r, 0, 7);
  pg.stroke();
  pg.beginPath();
  pg.arc(x, y, r * 0.5, 0, 7);
  pg.stroke();
}
function dimBackdrop(a = 0.55) {
  pg.save();
  pg.globalAlpha = a;
  rect(-LAY.ox, -LAY.oy, LAY.LW, LAY.LH, C.paper);
  pg.restore();
}
function drawBelts() {
  if (!L || !L.belts) return;
  const off = (G.frame * BELT_SPEED) % 8;
  for (const b of L.belts) {
    const x0 = b.a * T,
      x1 = (b.b + 1) * T,
      y = b.y + 1;
    rect(x0, y, x1 - x0, 3.2, C.indigo);
    pg.save();
    pg.beginPath();
    pg.rect(x0, y, x1 - x0, 3.2);
    pg.clip();
    pg.strokeStyle = ink(C.yel);
    pg.lineWidth = 0.9;
    for (let x = x0 - 8 + (b.dir > 0 ? off : 8 - off); x < x1 + 8; x += 8) {
      pg.beginPath();
      pg.moveTo(x - b.dir * 1.6, y + 0.4);
      pg.lineTo(x + b.dir * 0.6, y + 1.6);
      pg.lineTo(x - b.dir * 1.6, y + 2.8);
      pg.stroke();
    }
    pg.restore();
    for (let x = x0 + 4; x < x1; x += 40) {
      pg.beginPath();
      pg.arc(x, y + 1.6, 1.3, 0, 7);
      pg.fillStyle = ink(C.skyD);
      pg.fill();
    }
  }
}
