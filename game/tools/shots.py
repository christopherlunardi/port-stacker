"""Screenshots of the build on the screens we care about, in a real browser (Playwright). Fails on any page error.
usage: python3 -I game/tools/shots.py BUILD.html OUTDIR [js-to-run-before-the-shot]
  devices: rp2s (Retroid Pocket 2S in the launcher, 640x480), rp6 (Pocket 6 in the launcher, 1920x1080), tv4k (Pocket 6 on a 4K TV),
  phone (portrait, the artifact link), phoneland (landscape), desktop.
The default setup starts stage 1 and plays a few seconds with the bot off; pass your own JS (e.g. "startLevel(2); G.state='play'").
"""
import sys, pathlib, asyncio
from playwright.async_api import async_playwright
DEVICES = {
  'rp2s': dict(viewport={'width': 640, 'height': 480}, device_scale_factor=1, inapp=True),
  'rp6': dict(viewport={'width': 960, 'height': 540}, device_scale_factor=2, inapp=True),
  'tv4k': dict(viewport={'width': 1920, 'height': 1080}, device_scale_factor=2, inapp=True),
  'phone': dict(viewport={'width': 390, 'height': 844}, device_scale_factor=3, is_mobile=True, has_touch=True),
  'phoneland': dict(viewport={'width': 844, 'height': 390}, device_scale_factor=3, is_mobile=True, has_touch=True),
  'desktop': dict(viewport={'width': 1280, 'height': 800}, device_scale_factor=1),
}
SETUP = "newGame(); G.state='play'; DEV.inv=true;"
async def main():
  build, out = pathlib.Path(sys.argv[1]).resolve(), pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
  setup = sys.argv[3] if len(sys.argv) > 3 else SETUP
  errors = []
  async with async_playwright() as pw:
    br = await pw.chromium.launch()
    for name, d in DEVICES.items():
      d = dict(d); inapp = d.pop('inapp', False)
      ctx = await br.new_context(**d); page = await ctx.new_page()
      page.on('pageerror', lambda e, n=name: errors.append(f'{n}: {e}'))
      await page.goto(build.as_uri().replace('file://', 'file://') + '?shot')
      await page.wait_for_timeout(300)
      if inapp: await page.evaluate("ssInApp(); if (typeof studio !== 'undefined' && studio.cv) { studio.cv.remove(); studio.cv = null; studio.done = true; }")  # (the Retroid app goes straight to the studio intro: past it)
      await page.evaluate("document.querySelectorAll('#devCode').forEach(e=>e.remove())")
      await page.evaluate(setup); await page.wait_for_timeout(2600)
      await page.screenshot(path=str(out / f'{name}.png'))
      lay = await page.evaluate('JSON.stringify({s:LAY.s,LW:LAY.LW,LH:LAY.LH,W:LAY.W,H:LAY.H})')
      if not await page.evaluate('!!gl'): errors.append(f'{name}: the print shader did not start (WebGL off: check the shader compiles)')
      print(f'{name:10} {lay}')
      await ctx.close()
    await br.close()
  for e in errors: print('PAGEERROR', e)
  sys.exit(1 if errors else 0)
asyncio.run(main())
