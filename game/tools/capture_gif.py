"""Record a few seconds of the real game as a GIF (what Chris sees), cropped around a point.
usage: python3 -I game/tools/capture_gif.py BUILD.html OUT.gif "setup js" "follow js returning [x,y] in field units" [seconds] [crop field px]
"""
import sys, pathlib, asyncio, io
from PIL import Image
from playwright.async_api import async_playwright
build, out, setup, follow = pathlib.Path(sys.argv[1]).resolve(), sys.argv[2], sys.argv[3], sys.argv[4]
secs = float(sys.argv[5]) if len(sys.argv) > 5 else 3; crop = float(sys.argv[6]) if len(sys.argv) > 6 else 70
async def main():
  async with async_playwright() as pw:
    br = await pw.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])
    pg = await br.new_page(viewport={'width': 960, 'height': 720}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(build.as_uri()); await pg.wait_for_timeout(300); await pg.evaluate("ssInApp(); if (typeof studio !== 'undefined' && studio.cv) { studio.cv.remove(); studio.cv = null; studio.done = true; }")
    await pg.evaluate("document.querySelectorAll('#devCode,#devPanel').forEach(e=>e.remove())"); await pg.evaluate(setup)
    frames = []; n = int(secs * 15)
    for i in range(n):
      x, y = await pg.evaluate(follow); s = await pg.evaluate('LAY.s'); ox = await pg.evaluate('LAY.ox'); oy = await pg.evaluate('LAY.oy')
      cx, cy = (x + ox) * s, (y + oy) * s; half = crop * s / 2
      png = await pg.screenshot(clip={'x': max(0, cx - half), 'y': max(0, cy - half * 1.2), 'width': half * 2, 'height': half * 2})
      frames.append(Image.open(io.BytesIO(png)).convert('RGB')); await pg.wait_for_timeout(40)
    await br.close()
  frames[0].save(out, save_all=True, append_images=frames[1:], duration=66, loop=0)
  for e in errs: print('PAGEERROR', e)
  print(out, len(frames), 'frames')
asyncio.run(main())
