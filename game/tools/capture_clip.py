"""Record a clip of the real game at true speed (the game is stepped frame by frame, not filmed live, so nothing is sped up or dropped).
usage: python3 -I game/tools/capture_clip.py PAGE.html OUT.mp4 "setup js" [seconds] [x y w h in field px] [fps]
The page's own loop is stopped; each output frame runs 60/fps game updates, then renders and prints it. Default crop: the whole field.
The sounds the game played are written to OUT.cues.json (time, SFX name, args); render_cues.py turns them into the clip's soundtrack.
"""
import sys, pathlib, asyncio, subprocess, tempfile
from playwright.async_api import async_playwright
page, out, setup = pathlib.Path(sys.argv[1]).resolve(), pathlib.Path(sys.argv[2]).resolve(), sys.argv[3]
secs = float(sys.argv[4]) if len(sys.argv) > 4 else 3
box = [float(v) for v in sys.argv[5:9]] if len(sys.argv) > 8 else None # default: the whole field
fps = int(sys.argv[9]) if len(sys.argv) > 9 else 30
async def main():
  errs = []
  with tempfile.TemporaryDirectory() as td:
    async with async_playwright() as pw:
      br = await pw.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])
      pg = await br.new_page(viewport={'width': 960, 'height': 720}); pg.on('pageerror', lambda e: errs.append(str(e)))
      await pg.goto(page.as_uri() + '?shot'); await pg.wait_for_timeout(400); await pg.evaluate("ssInApp(); if (typeof studio !== 'undefined' && studio.cv) { studio.cv.remove(); studio.cv = null; studio.done = true; }")
      await pg.evaluate("document.querySelectorAll('#devCode,#devPanel').forEach(e=>e.remove()); window.requestAnimationFrame = () => 0; window.__u = 0; window.__cues = []; for (const k of Object.keys(SFX)) SFX[k] = (...a) => { window.__cues.push([window.__u / 60, k, a]); };")
      await pg.wait_for_timeout(100); await pg.evaluate(setup)
      global box
      if box is None: box = [0, 0] + await pg.evaluate('[PW, PH]')
      s, ox, oy = await pg.evaluate('[LAY.s, LAY.ox, LAY.oy]'); r = await pg.evaluate("(() => { const b = document.getElementById('screen').getBoundingClientRect(); return [b.left, b.top]; })()")
      clip = {'x': r[0] + (box[0] + ox) * s, 'y': r[1] + (box[1] + oy) * s, 'width': box[2] * s, 'height': box[3] * s}
      n, per = int(secs * fps), round(60 / fps)
      for i in range(n):
        await pg.evaluate(f"for (let k = 0; k < {per}; k++) {{ window.__u++; update({{ held: {{}}, pressed: {{}} }}); }} render(); present();")
        await pg.screenshot(path=f'{td}/f{i:04d}.png', clip=clip)
      import json; out.with_suffix('.cues.json').write_text(json.dumps(await pg.evaluate('window.__cues'))) # when each sound fired (seconds into the clip), for render_cues.py
      await br.close()
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', f'{td}/f%04d.png', '-vf', 'scale=640:-2:flags=lanczos,format=yuv420p',
                    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', '-movflags', '+faststart', str(out)], check=True)
  for e in errs: print('PAGEERROR', e)
  print('wrote', out, n, 'frames'); sys.exit(1 if errs else 0)
asyncio.run(main())
