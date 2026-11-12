// ---------- moving on floors and ladders ----------
// Everyone moves one whole pixel at a time (speeds collect in .acc), so floors and ladder tops are met exactly and nothing jitters at 120Hz.
// x is the middle of the body, y the feet. A ladder's x is its column's middle, so you are on it when x matches.
function colOf(x) {
  return Math.floor(x / T);
}
function floorRowAt(y) {
  const d = y - FY;
  return d % T === 0 ? d / T : -1;
}
function hasFloor(r, c) {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS && L.floor[r][c] === 1;
}
function ladderAt(x, y, dy) {
  // the ladder you can climb one pixel along, from here
  for (const l of L.ladders) {
    if (l.x !== x) continue;
    if (dy < 0 ? y > l.top && y <= l.bot : y >= l.top && y < l.bot) return l;
  }
  return null;
}
function onLadderLine(x, y) {
  for (const l of L.ladders) if (l.x === x && y >= l.top && y <= l.bot) return true;
  return false;
}
function canStep(e, dx, dy) {
  if (dx) {
    const r = floorRowAt(e.y);
    if (r < 0 || !hasFloor(r, colOf(e.x))) return false;
    const nx = e.x + dx;
    return nx >= 3 && nx <= PW - 3 && hasFloor(r, colOf(nx));
  }
  if (dy) return !!ladderAt(e.x, e.y, dy);
  return false;
}
// the player's forgiving step: if the way isn't open yet but a ladder or floor is within reach, slide onto it first (2px a step, so it's quick)
const SNAP = 11; // about a ladder's width either side (Chris 2026-11-07: getting on and off was too fussy)
function stepPlayer(p, axis, h, v) {
  if (axis === 'h' && h) {
    if (canStep(p, h, 0)) {
      p.x += h;
      p.face = h;
      return 'h';
    }
    for (let r = 0; r < ROWS; r++) {
      const ry = rowY(r); // near the end of a ladder: step off onto the catwalk
      if (
        ry !== p.y &&
        Math.abs(ry - p.y) <= SNAP &&
        hasFloor(r, colOf(p.x)) &&
        hasFloor(r, colOf(p.x + h)) &&
        onLadderLine(p.x, ry) &&
        onLadderLine(p.x, p.y)
      ) {
        p.y += Math.sign(ry - p.y) * Math.min(2, Math.abs(ry - p.y));
        p.face = h;
        return 'slide';
      }
    }
    return null;
  }
  if (axis === 'v' && v) {
    if (canStep(p, 0, v)) {
      p.y += v;
      return 'v';
    }
    const r = floorRowAt(p.y);
    if (r >= 0)
      for (const l of L.ladders) {
        if (l.x !== p.x && Math.abs(l.x - p.x) <= SNAP && ladderAt(l.x, p.y, v) && hasFloor(r, colOf(l.x)) && hasFloor(r, colOf(p.x))) {
          const d = l.x - p.x;
          p.x += Math.sign(d) * Math.min(2, Math.abs(d));
          return 'slide';
        }
      }
    return null;
  }
  return null;
}
