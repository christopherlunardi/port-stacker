"""Give a recorded clip its sound: play the sounds listed in CLIP.cues.json (written by capture_clip.py) at their times, with the game's
own SFX (or a Workshop option's), and put them on the clip. usage: python3 -I game/tools/render_cues.py CLIP.mp4 [OPTION.js ...] [--only a,b]
--only keeps just the named sounds (e.g. the ones the option is about). Writes CLIP.mp4 in place, with audio."""
import sys, pathlib, asyncio, subprocess, base64, tempfile, json
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parents[2]
args = sys.argv[1:]; only = None
if '--only' in args: i = args.index('--only'); only = set(args[i + 1].split(',')); del args[i:i + 2]
clip, opts = pathlib.Path(args[0]).resolve(), [pathlib.Path(a) for a in args[1:]]
cues = json.loads(clip.with_suffix('.cues.json').read_text())
cues = [c for c in cues if not (c[1] == 'goldEnd' and c[0] < 0.1)]  # newGame() in a clip's setup ends a rush that never was
if only: cues = [c for c in cues if c[1] in only]
secs = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(clip)], capture_output=True, text=True).stdout.strip())
html = (ROOT / 'game/stack-style.html').read_text()
if opts: html = html.replace('</script>', '</script>\n<script>\n' + '\n'.join(o.read_text() for o in opts) + '\n</script>', 1)
RENDER = """async ([cues, secs]) => { /* (Chris 2026-11-11: every clip had the studio chime in it) stop the page itself first: its loop, the studio intro and the title music would otherwise play into the render */ window.requestAnimationFrame = () => 0; try { studio.started = true; if (studio.node) studio.node.stop(); if (studio.cv) { studio.cv.remove(); studio.cv = null; } } catch (e) {} try { musicStop(); } catch (e) {} try { musicTick = () => {}; } catch (e) {}
  const sr = 44100; AC = new OfflineAudioContext(1, Math.ceil(sr * secs), sr); Object.defineProperty(AC, 'state', { get: () => 'running' }); /* (the game's sounds skip themselves while the audio is asleep, build 185; an offline render is 'suspended' at each cue) */
  master = AC.createGain(); master.gain.value = 0.32; master.connect(AC.destination); muted = false;
  noiseBuf = AC.createBuffer(1, sr, sr); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const q = Math.round(128) / sr; // suspend points are rounded to render blocks
  for (const [t, name, a] of cues) { const at = Math.max(q, Math.ceil(t / q) * q); AC.suspend(at).then(() => { try { SFX[name](...a); } catch (e) {} AC.resume(); }); }
  const buf = await AC.startRendering(), L = buf.getChannelData(0), n = L.length;
  const b = new Uint8Array(44 + n * 2), v = new DataView(b.buffer), w = (o, s) => { for (let i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, L[i] * 2.2)) * 32767, true);
  let s = ''; for (let i = 0; i < b.length; i += 32768) s += String.fromCharCode.apply(null, b.subarray(i, i + 32768)); return btoa(s); }"""
async def main():
  with tempfile.TemporaryDirectory() as td:
    p = pathlib.Path(td) / 'p.html'; p.write_text(html)
    async with async_playwright() as pw:
      br = await pw.chromium.launch(); pg = await br.new_page(); await pg.goto(p.as_uri() + '?shot'); await pg.wait_for_timeout(300)
      b64 = await pg.evaluate(RENDER, [cues, secs]); await br.close()
    wav = pathlib.Path(td) / 's.wav'; wav.write_bytes(base64.b64decode(b64)); tmp = pathlib.Path(td) / 'out.mp4'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(clip), '-i', str(wav), '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-shortest', str(tmp)], check=True)
    clip.write_bytes(tmp.read_bytes())
  print('sound on', clip, len(cues), 'cues')
asyncio.run(main())
