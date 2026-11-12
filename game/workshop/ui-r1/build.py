"""Build the UI-style options: inline the fonts each style names (/*FONTS Name=fontsource-dir[:weight] ...*/) as base64.
usage: python3 -I build.py FONTS_DIR (node_modules/@fontsource)"""
import sys, re, base64, pathlib
F = pathlib.Path(sys.argv[1]); here = pathlib.Path(__file__).resolve().parent
for src in sorted(here.glob('*.src.js')):
  s = src.read_text(); m = re.search(r'/\*FONTS (.*?)\*/', s); lines = []
  for spec in m.group(1).split():
    name, d = spec.split('='); d, w = (d.split(':') + ['400'])[:2]
    b = base64.b64encode((F / d / 'files' / f'{d}-latin-{w}-normal.woff2').read_bytes()).decode(); lines.append(f"addFont('{name}', '{b}');")
  (here / src.name.replace('.src.js', '.js')).write_text(s.replace(m.group(0), '\n'.join(lines)))
  print(src.name, '->', src.name.replace('.src.js', '.js'))
