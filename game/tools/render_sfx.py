"""Record one of the game's sound effects (or a Workshop option's version of it) to an MP3, played N times with a gap, the way it
repeats in play. usage: python3 -I game/tools/render_sfx.py OUT.mp3 SFXNAME [OPTION.js ...] [--times 3] [--gap 0.7] [--secs 1.2]
Uses the built game/stack-style.html (it doesn't rebuild it, so several can run at once)."""
import sys, pathlib, asyncio, subprocess, base64, tempfile
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parents[2]
args = sys.argv[1:]; kw = {}
for k in ['--times', '--gap', '--secs']:
  if k in args: i = args.index(k); kw[k] = float(args[i + 1]); del args[i:i + 2]
out, name, opts = pathlib.Path(args[0]).resolve(), args[1], [pathlib.Path(a) for a in args[2:]]
times, gap, secs = int(kw.get('--times', 3)), kw.get('--gap', 0.7), kw.get('--secs', 1.2)
html = (ROOT / 'game/stack-style.html').read_text()
if opts: html = html.replace('</script>', '</script>\n<script>\n' + '\n'.join(o.read_text() for o in opts) + '\n</script>', 1)
RENDER = """async ([name, secs]) => { const sr = 44100; AC = new OfflineAudioContext(2, Math.ceil(sr * secs), sr);
  master = AC.createGain(); master.gain.value = 0.32; master.connect(AC.destination); muted = false;
  noiseBuf = AC.createBuffer(1, sr, sr); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  SFX[name](); const buf = await AC.startRendering(); const L = buf.getChannelData(0), n = L.length;
  const b = new Uint8Array(44 + n * 2), v = new DataView(b.buffer), w = (o, s) => { for (let i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, L[i])) * 32767, true);
  let s = ''; for (let i = 0; i < b.length; i += 32768) s += String.fromCharCode.apply(null, b.subarray(i, i + 32768)); return btoa(s); }"""
async def main():
  with tempfile.TemporaryDirectory() as td:
    p = pathlib.Path(td) / 'p.html'; p.write_text(html); errs = []
    async with async_playwright() as pw:
      br = await pw.chromium.launch(); pg = await br.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
      await pg.goto(p.as_uri() + '?shot'); await pg.wait_for_timeout(300); b64 = await pg.evaluate(RENDER, [name, secs]); await br.close()
    one = pathlib.Path(td) / 'one.wav'; one.write_bytes(base64.b64decode(b64))
    parts = []
    for i in range(times): parts += ['-i', str(one)]
    filt = ''.join(f'[{i}]apad=pad_dur={gap}[a{i}];' for i in range(times)) + ''.join(f'[a{i}]' for i in range(times)) + f'concat=n={times}:v=0:a=1,loudnorm=I=-16[o]'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *parts, '-filter_complex', filt, '-map', '[o]', '-ar', '44100', '-b:a', '128k', str(out)], check=True)
    for e in errs: print('PAGEERROR', e)
  print('wrote', out)
asyncio.run(main())
