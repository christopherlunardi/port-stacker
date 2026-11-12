"""Render the stage-start fanfare the way the game plays it: the fanfare, the READY beat, then the first bars of the gameplay tune.
usage: python3 -I game/tools/render_fanfare.py OUT.mp3 [FANFARE.js] [SONG.js]
FANFARE.js sets JINGLE = {...} (02c-music.js explains it); SONG.js (optional) sets RAG for the tune that follows.
"""
import sys, pathlib, asyncio, subprocess, base64, tempfile
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parents[2]
out = pathlib.Path(sys.argv[1]).resolve()
opts = [pathlib.Path(a).resolve() for a in sys.argv[2:] if a != '-']
subprocess.run([sys.executable, '-I', str(ROOT / 'game/src/assemble.py')], check=True, capture_output=True)
html = (ROOT / 'game/stack-style.html').read_text()
for o in opts: html = html.replace('</script>', '</script>\n<script>\n' + o.read_text() + '\n</script>', 1)
JS = """async () => {
  for (const k of Object.keys(SFX)) SFX[k] = () => {}; G.state = 'board'; G.t = 0; // the game's own sound effects stay out of the recording (the title intro plays them)
  const sr = 44100, secs = 13; AC = new OfflineAudioContext(2, sr * secs, sr); master = AC.createGain(); master.gain.value = 0.32; master.connect(AC.destination);
  noiseBuf = AC.createBuffer(1, sr, sr); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; WAVES = null;
  const jl = playJingle(), start = 0.05 + Math.max(170, Math.min(360, Math.round(jl * 60) + 50)) / 60;
  musicGain = AC.createGain(); musicGain.gain.value = 0.55; musicGain.connect(master);
  Object.assign(mus, { part: RAG.loopFrom || 0, bar: 0, loop: 0, prevVoice: null, bassPrev: 41 }); let t = start; const barLen = 60 / RAG.bpm * (RAG.beats || 2);
  while (t < secs - 1) { scheduleBar(t, RAG.form[mus.part], mus.bar, mus.loop, false); t += barLen; Object.assign(mus, formPos(mus)); }
  const buf = await AC.startRendering(), L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length;
  const b = new Uint8Array(44 + n * 4), v = new DataView(b.buffer), w = (o, s) => { for (let i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 4, true);
  let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); const g = 0.89 / pk;
  for (let i = 0; i < n; i++) { v.setInt16(44 + i * 4, L[i] * g * 32767, true); v.setInt16(46 + i * 4, R[i] * g * 32767, true); }
  let s = ''; for (let i = 0; i < b.length; i += 32768) s += String.fromCharCode.apply(null, b.subarray(i, i + 32768)); return btoa(s); }"""
async def main():
  errs = []
  with tempfile.TemporaryDirectory() as td:
    pf = pathlib.Path(td) / 'f.html'; pf.write_text(html)
    async with async_playwright() as pw:
      br = await pw.chromium.launch(); pg = await br.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
      await pg.goto(pf.as_uri() + '?shot'); await pg.wait_for_timeout(300); b64 = await pg.evaluate(JS); await br.close()
    wav = pathlib.Path(td) / 'f.wav'; wav.write_bytes(base64.b64decode(b64))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav), '-b:a', '128k', str(out)], check=True)
  for e in errs: print('PAGEERROR', e)
  print('wrote', out); sys.exit(1 if errs else 0)
asyncio.run(main())
