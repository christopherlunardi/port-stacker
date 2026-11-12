"""Build the one-file game: game/src/js/*.js joined in name order, dropped into game/src/shell.html -> game/stack-style.html.
usage: python3 -I game/src/assemble.py            (the build number comes from game/src/build.txt; tools/release.py bumps it)
"""
import pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parents[2]; d = ROOT / 'game/src'
build = int((d / 'build.txt').read_text().strip())
js = ''.join('\n// ===== ' + f.name + ' =====\n' + f.read_text() for f in sorted((d / 'js').glob('*.js')))
import re
assert len(re.findall(r'/\*@BUILD\*/ ?0', js)) == 1  # the build number's place (a formatter may put a space after the marker)
js = re.sub(r'/\*@BUILD\*/ ?0', str(build), js)
out = (d / 'shell.html').read_text().replace('__GAME_JS__', js)
dest = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'game/stack-style.html'
dest.write_text(out); print(dest.name, len(out), 'bytes, build', build)
