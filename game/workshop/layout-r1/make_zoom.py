"""Layout prototype (Chris 2026-11-07: the game feels cramped): the same game on a field zoomed out ~20%, 384x288 instead of 320x240.
Still 4:3. Catwalks 40px apart instead of 32 (headroom for 30px characters), a 22px score bar with a gap under it, room for 4 containers on
the ship. The stages are carried over onto the bigger grid (rows 3/7/11/15 -> 4/9/14/19, columns shifted 4 to the middle, edges kept at
the edges). Patches a copy of game/src; the real game is untouched.
usage: python3 -I game/workshop/layout-r1/make_zoom.py OUT.html"""
import sys, pathlib, re
ROOT = pathlib.Path(__file__).resolve().parents[3]; src = ROOT / 'game/src'
files = {f.name: f.read_text() for f in sorted((src / 'js').glob('*.js'))}
def sub(name, old, new, count=1):
  assert old in files[name], (name, old[:60]); files[name] = files[name].replace(old, new, count)
sub('00-setup.js', 'const PW = 320, PH = 240;', 'const PW = 384, PH = 288;')
sub('00-setup.js', 'const T = 8, FY = 16, ROWS = 28, COLS = 40;', 'const T = 8, FY = 24, ROWS = 33, COLS = 48;')
files['04-levels.js'] = re.sub(r'const PLATE_ROW = \d+', 'const PLATE_ROW = 30', files['04-levels.js'])
files['04-levels.js'] += """
// prototype: carry the stages over onto the zoomed-out grid
(() => { const RM = { 3: 4, 7: 9, 11: 14, 15: 19 }, cm = c => c <= 2 ? c : c >= 37 ? c + 8 : c + 4, ea = a => a === 0 ? 0 : a + 4, eb = b => b === 39 ? 47 : b + 4;
  for (const d of LEVELS) { d.floors = d.floors.map(([r, a, b]) => [RM[r], ea(a), eb(b)]); d.ladders = d.ladders.map(([c, t, b]) => [cm(c), RM[t], RM[b]]);
    d.pieces = d.pieces.map(([t, c, r]) => [t, c + 4, RM[r]]); d.plates = d.plates.map(c => c + 4); d.spawns = d.spawns.map(([c, r]) => [c === 0 ? 0 : c === 39 ? 47 : c + 4, RM[r]]);
    d.start = [d.start[0] + 4, RM[d.start[1]]]; if (d.belts) d.belts = d.belts.map(([r, a, b, dir]) => [RM[r], ea(a), eb(b), dir]); } })();
"""
sub('10-render.js', 'rect(0, 237, PW, 3, C.blue);', 'rect(0, PH - 3, PW, 3, C.blue);')
files['10-render.js'] = files['10-render.js'].replace('pg.moveTo(x, 238.5); pg.quadraticCurveTo(x + 3, 237, x + 6, 238.5);', 'pg.moveTo(x, PH - 1.5); pg.quadraticCurveTo(x + 3, PH - 3, x + 6, PH - 1.5);')
sub('10-render.js', 'base = 233 + Math.sin', 'base = PH - 7 + Math.sin')
sub('10-render.js', 'drawShip(sx); for (const pc of G.pieces)', 'drawShip(sx + 32); for (const pc of G.pieces)')
sub('10b-ship.js', 'pg.moveTo(X(6), d); pg.lineTo(X(288)', 'pg.moveTo(X(-26), d); pg.lineTo(X(288)') # the hull runs 32 further aft, so the ship spans the wider sea
sub('10b-ship.js', 'pg.lineTo(X(16), d + 15); pg.quadraticCurveTo(X(2), d + 13, X(6), d)', 'pg.lineTo(X(-16), d + 15); pg.quadraticCurveTo(X(-30), d + 13, X(-26), d)')
files['10b-ship.js'] = files['10b-ship.js'].replace('rect(X(0), d + 8.5, 320', 'rect(X(-32), d + 8.5, 352').replace('rect(X(0), d + 7.8, 320', 'rect(X(-32), d + 7.8, 352').replace('rect(X(0), d + 11.7, 320', 'rect(X(-32), d + 11.7, 352').replace('rect(X(0), d + 1.5, 290', 'rect(X(-32), d + 1.5, 322').replace('rect(X(0), d + 3.5, 290', 'rect(X(-32), d + 3.5, 322')
sub('10b-ship.js', 'for (let x = 22; x < 286', 'for (let x = -14; x < 286'); sub('10b-ship.js', '[[8, 30],', '[[-24, 30],')
sub('10-render.js', 'rect(0, d + 10, PW, 30, C.blue);', 'rect(0, d + 10, PW, PH - d - 10, C.blue);')
a = files['10-render.js'].index('function drawBand() {'); b = files['10-render.js'].index('function card(a, b) {')
files['10-render.js'] = files['10-render.js'][:a] + """function drawBand() { // a 22px bar with a clear gap under it (the top catwalk is 34px lower)
  rrect(3, 1, PW - 6, 20, 5, C.cream, C.indigo, 1.3);
  const cell = (x, label, value, col = C.pink, al = 'left') => { textF('Bungee', label, x, 6.5, 4.8, C.blue, al); textF('Bungee', value, x, 14.5, 9, col, al); };
  cell(12, 'SCORE', String(G.score).padStart(6, '0')); cell(92, 'HIGH', String(Math.max(G.hi, G.score)).padStart(6, '0'), C.indigo);
  art('buck.stand', 186, 19, { scale: 0.36 }); textF('Bungee', 'x' + Math.max(0, G.lives), 193, 12, 9, C.pink);
  if (G.p) { textF('Bungee', 'HORN', 232, 6.5, 4.8, C.blue); textF('Bungee', 'x' + G.p.horns, 232, 14.5, 9, C.pink); }
  cell(PW - 40, 'STAGE', (1 + G.loop) + '-' + (G.level + 1), C.pink, 'center');
  if (G.combo >= 2 && G.comboT > 0) { const m = 1 + (G.combo >> 1), pulse = 1 + Math.max(0, (G.comboT - 135) / 15) * 0.35; textF('Bungee', 'COMBO x' + m, PW / 2, 32, (8 + m * 2) * pulse, m >= 3 ? C.pink : C.yel, 'center', C.indigo); }
}
""" + files['10-render.js'][b:]
files['10e-menus.js'] = files['10e-menus.js'].replace('pg.translate(0, (PH - 240) / 2);', 'pg.translate((PW - 320) / 2, (PH - 240) / 2);')
build = int((src / 'build.txt').read_text().strip()); js = ''.join('\n// ===== ' + n + ' =====\n' + t for n, t in files.items()).replace('/*@BUILD*/0', str(build))
out = (src / 'shell.html').read_text().replace('__GAME_JS__', js); pathlib.Path(sys.argv[1]).write_text(out); print('wrote', sys.argv[1])
