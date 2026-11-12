# Renders the phone-shell options (shell-r1/*.js) on an iPhone 15 upright and sideways, with a stage being played, and makes the play
# copies (the build with the option added) for game/workshop/play/. usage: python3 -I render.py BUILD.html IMGDIR PLAYDIR [A B ...]
import asyncio, pathlib, sys
from playwright.async_api import async_playwright
HERE = pathlib.Path(__file__).resolve().parent
build, img, play = pathlib.Path(sys.argv[1]).resolve(), pathlib.Path(sys.argv[2]), pathlib.Path(sys.argv[3])
names = sys.argv[4:] or ['Now', 'A', 'B', 'C', 'D', 'E']
img.mkdir(parents=True, exist_ok=True); play.mkdir(parents=True, exist_ok=True)
page = build.read_text()
async def main():
  async with async_playwright() as pw:
    br = await pw.chromium.launch()
    for n in names:
      js = '' if n == 'Now' else (HERE / f'{n}.js').read_text()
      if js:
        i = page.index('</script>') + len('</script>')
        out = page[:i] + '\n<script>\n' + js + '\n</script>' + page[i:]
        if not out.lstrip().lower().startswith('<!doctype'): out = '<!doctype html>\n' + out
        (play / f'shell-r1-{n}.html').write_text(out)
      for orient, vp in [('up', {'width': 393, 'height': 852}), ('side', {'width': 852, 'height': 393})]:
        ctx = await br.new_context(viewport=vp, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(build.as_uri() + '?shot'); await pg.wait_for_timeout(300)
        if js: await pg.add_script_tag(content=js)
        await pg.evaluate("newGame(); G.state='play'; DEV.inv=true; document.querySelectorAll('#devCode,#devPanel').forEach(e=>e.remove());")
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=str(img / f'{n}-{orient}.png'))
        if errs: print(n, orient, 'ERRORS', errs)
        await ctx.close()
      print(n, 'done')
    await br.close()
asyncio.run(main())
