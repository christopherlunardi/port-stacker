"""Render an art option in the real game, riso print and all.
usage: python3 -I game/workshop/render_option.py OPTION.js OUT_PREFIX [setup.js]
OPTION.js runs right after the game's code and before it starts, so it can replace drawing functions (drawStageBG, drawContainer,
girder, ladder, door, drawShip, ...) or change sprites (SPRITES.worker0 = [...]; colours in C) -- buildSprites() runs at start.
Writes OUT_PREFIX-2s.png (Retroid 2S, 640x480), OUT_PREFIX-rp6.png (Pocket 6, 1920x1080) and OUT_PREFIX-zoom.png (the middle of the
field at 4x, for detail). Builds game/stack-style.html first if it's missing. Fails on any page error.
"""
import sys, pathlib, asyncio, subprocess
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parents[2]
opt, out = pathlib.Path(sys.argv[1]).resolve(), pathlib.Path(sys.argv[2]).resolve()
setup = pathlib.Path(sys.argv[3]) if len(sys.argv) > 3 else ROOT / 'game/workshop/demo-setup.js'
build = ROOT / 'game/stack-style.html'
if not build.exists(): subprocess.run([sys.executable, '-I', str(ROOT / 'game/src/assemble.py')], check=True)
html = build.read_text().replace('</script>', '</script>\n<script>\n' + opt.read_text() + '\n</script>', 1)
page_file = out.parent / (out.name + '.page.html'); out.parent.mkdir(parents=True, exist_ok=True); page_file.write_text(html)
async def main():
  errs = []
  async with async_playwright() as pw:
    br = await pw.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])
    for name, vw, vh in [('2s', 640, 480), ('rp6', 1920, 1080), ('zoom', 1280, 960)]:
      pg = await br.new_page(viewport={'width': vw, 'height': vh}); pg.on('pageerror', lambda e: errs.append(str(e)))
      await pg.goto(page_file.as_uri()); await pg.wait_for_timeout(250)
      await pg.evaluate('ssInApp()'); await pg.evaluate("document.querySelectorAll('#devCode,#devPanel').forEach(e=>e.remove())")
      await pg.evaluate(setup.read_text()); await pg.wait_for_timeout(400)
      if name == 'zoom': await pg.screenshot(path=f'{out}-zoom.png', clip={'x': 320, 'y': 140, 'width': 640, 'height': 480})
      else: await pg.screenshot(path=f'{out}-{name}.png')
    await br.close()
  page_file.unlink()
  for e in errs: print('PAGEERROR', e)
  sys.exit(1 if errs else 0)
asyncio.run(main())
