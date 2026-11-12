"""Render a song to an MP3 the way the game plays it (same synth, in a real browser, faster than real time).
usage: python3 -I game/tools/render_music.py OUT.mp3 [OPTION.js] [seconds] [--menu]
OPTION.js (optional) runs after the game's code, e.g. a Workshop song that sets RAG = {...}. Default length: one full pass of the
song's form plus the start of the next (about 1 min 50 s), so you hear the loop come round.
"""
import sys, pathlib, asyncio, subprocess, base64, tempfile
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parents[2]
out = pathlib.Path(sys.argv[1]).resolve()
opt = pathlib.Path(sys.argv[2]).resolve() if len(sys.argv) > 2 and sys.argv[2] != '-' else None
secs = float(sys.argv[3]) if len(sys.argv) > 3 else 0
menu = '--menu' in sys.argv  # record the menus' version (the honky-tonk piano) instead of the in-game one (the marimba)
build = ROOT / 'game/stack-style.html'
subprocess.run([sys.executable, '-I', str(ROOT / 'game/src/assemble.py')], check=True, capture_output=True)
html = build.read_text()
if opt: html = html.replace('</script>', '</script>\n<script>\n' + opt.read_text() + '\n</script>', 1)
RENDER = """async ([secs, MENU]) => {
  for (const k of Object.keys(SFX)) SFX[k] = () => {}; G.state = 'board'; G.t = 0; // the game's own sound effects stay out of the recording (the title intro plays them)
  const sr = 44100; const barLen = 60 / RAG.bpm * (RAG.beats || 2), secOf = n => (RAG.sections && RAG.sections[n]) || RAG[n];
  const formBars = RAG.form.reduce((a, n) => a + secOf(n).tune.length, 0), introBars = RAG.form.slice(0, RAG.loopFrom || 0).reduce((a, n) => a + secOf(n).tune.length, 0);
  if (!secs) secs = (formBars + 4) * barLen + 2;
  AC = new OfflineAudioContext(2, Math.ceil(sr * secs), sr);
  master = AC.createGain(); master.gain.value = 0.32; master.connect(AC.destination);
  noiseBuf = AC.createBuffer(1, sr, sr); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  WAVES = null; musicGain = AC.createGain(); musicGain.gain.value = 0.55; musicGain.connect(master);
  mus = { t: 0, part: 0, bar: 0, loop: 0, timer: 0, prevVoice: null, bassPrev: 41, menu: MENU }; // menu: the menus' sound (the piano), else the in-game one (the marimba)
  let t = 0.05;
  while (t < secs - 1.5) { const sec = RAG.form[mus.part], rep = mus.part > 0 && RAG.form[mus.part - 1] === sec;
    scheduleBar(t, sec, mus.bar, mus.loop, rep); t += barLen; Object.assign(mus, formPos(mus)); }
  const buf = await AC.startRendering(); const L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length;
  const b = new Uint8Array(44 + n * 4), v = new DataView(b.buffer), w = (o, s) => { for (let i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 4, true);
  let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); const g = peak > 0 ? 0.89 / peak : 1;
  for (let i = 0; i < n; i++) { v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i] * g)) * 32767, true); v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i] * g)) * 32767, true); }
  let s = ''; for (let i = 0; i < b.length; i += 32768) s += String.fromCharCode.apply(null, b.subarray(i, i + 32768)); return btoa(s);
}"""
async def main():
  errs = []
  with tempfile.TemporaryDirectory() as td:
    page_file = pathlib.Path(td) / 'song.html'; page_file.write_text(html)
    async with async_playwright() as pw:
      br = await pw.chromium.launch(); pg = await br.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
      await pg.goto(page_file.as_uri() + '?shot'); await pg.wait_for_timeout(300)
      b64 = await pg.evaluate(RENDER, [secs, menu]); await br.close()
    wav = pathlib.Path(td) / 'song.wav'; wav.write_bytes(base64.b64decode(b64))
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav), '-codec:a', 'libmp3lame', '-b:a', '128k', str(out)], check=True)
  for e in errs: print('PAGEERROR', e)
  print('wrote', out, f'{out.stat().st_size // 1024} KB')
  if errs: sys.exit(1)
asyncio.run(main())
