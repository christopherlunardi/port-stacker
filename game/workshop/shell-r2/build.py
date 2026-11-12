# Builds the round's option scripts: NAME.js = src/_base.css + src/_H.css or _R.css (handheld / riso) + src/NAME.css (+ src/NAME.dom.js),
# all in one self-contained script. In the CSS, § stands for the page while the on-screen pad is showing.
# usage: python3 -I build.py
import json, pathlib
HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / 'src'
B = 'body:not(.padmode):not(.inapp)'
titles = json.loads((SRC / 'titles.json').read_text())
for f in sorted(SRC.glob('[HR][0-9].css')):
  n = f.stem
  css = ((SRC / '_base.css').read_text() + '\n' + (SRC / f'_{n[0]}.css').read_text() + '\n' + f.read_text()).replace('§', B)
  dom = SRC / f'{n}.dom.js'
  js = f"// shell {n}: {titles.get(n, '')}\n(() => {{\n  const s = document.createElement('style');\n  s.textContent = {json.dumps(css)};\n  document.head.appendChild(s);\n"
  if dom.exists(): js += dom.read_text()
  js += (SRC / '_common.js').read_text() + '})();\n'
  (HERE / f'{n}.js').write_text(js)
  print(n, len(js))
