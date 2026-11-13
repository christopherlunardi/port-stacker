"""Make a new build for the phone link and the Retroid launcher: bump game/src/build.txt, build, and copy it to dist/ with
dist/version.json. The launcher on the handhelds compares its build with dist/version.json on GitHub (main) and downloads
dist/stack-style.html when it's newer, so a release reaches the Retroids as soon as it's pushed.
The copy that goes out (dist/: the phone link and the Retroids) is squashed (Chris 2026-11-10, as with Hereafter Man): every comment
stripped and the code minified with esbuild, so the page's source says nothing about who made it and is hard to read. It stays within
ES2017 and what Chrome 80 reads (the Retroid 2S's old WebView: left alone, esbuild wrote CSS 'inset', which it can't), and top-level names are kept, so the launcher's hooks still
work. game/stack-style.html stays readable (the Workshop's play copies are made from it). The release fails if the squashed page
still mentions Chris.
usage: python3 -I game/tools/release.py
"""
import codecs, pathlib, subprocess, json, hashlib, datetime, sys, re, os
ROOT = pathlib.Path(__file__).resolve().parents[2]
bt = ROOT / 'game/src/build.txt'; build = int(bt.read_text().strip()) + 1; bt.write_text(str(build) + '\n')
subprocess.run([sys.executable, '-I', str(ROOT / 'game/src/assemble.py')], check=True)
ESB = os.environ.get('ESBUILD', '/opt/npm-tools/node_modules/esbuild/bin/esbuild')
def esb(src, loader):
  return subprocess.run([ESB, '--minify', '--loader=' + loader, '--target=' + ('es2017' if loader == 'js' else 'chrome80,safari14'), '--legal-comments=none', '--charset=utf8', '--log-level=error'],
                        input=src, capture_output=True, text=True, check=True).stdout
page = (ROOT / 'game/stack-style.html').read_text()
page = re.sub(r'<!--.*?-->', '', page, flags=re.S)
page = re.sub(r'<style>(.*?)</style>', lambda m: '<style>' + esb(m.group(1), 'css') + '</style>', page, flags=re.S)
page = re.sub(r'(<script>)(.*?)(</script>)', lambda m: m.group(1) + esb(m.group(2), 'js') + m.group(3), page, flags=re.S)
left = re.findall(r'Chris|Lunardi|christopherlunardi|Ghost Jail', page)
if left: sys.exit('the squashed page still mentions: ' + ', '.join(sorted(set(left))))
OTHER = ['ohetre gvzr', 'qngn rnfg']  # other games' names, rot13 so the repo itself never spells them out (Chris 2026-11-11)
other = re.findall('|'.join(r'\s*'.join(map(re.escape, codecs.decode(n, 'rot13').split())) for n in OTHER), page, re.I)  # never name other games in what ships
if other: sys.exit('the squashed page names another game: ' + ', '.join(sorted(set(other))))
html = page.encode()
(ROOT / 'dist').mkdir(exist_ok=True); (ROOT / 'dist/stack-style.html').write_bytes(html)
(ROOT / 'dist/version.json').write_text(json.dumps({'build': build, 'bytes': len(html), 'sha256': hashlib.sha256(html).hexdigest(),
  'made': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%MZ')}, indent=1) + '\n')
print('released build', build)
# the installable web app in web/ (GitHub Pages) is made from this same build
subprocess.run([sys.executable, '-I', str(ROOT / 'game/tools/web.py')], check=True)
