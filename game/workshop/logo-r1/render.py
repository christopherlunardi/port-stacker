"""Shoot each logo mockup in mock.html to game/workshop/img/logo-r1/<id>.png. usage: python3 -I render.py FONTS_DIR (node_modules/@fontsource)"""
import sys, asyncio, pathlib, tempfile
from playwright.async_api import async_playwright
F = pathlib.Path(sys.argv[1]).resolve(); here = pathlib.Path(__file__).resolve().parent; out = here.parent / 'img/logo-r1'; out.mkdir(parents=True, exist_ok=True)
fonts = [('Rye', 'rye', 400), ('AlfaSlab', 'alfa-slab-one', 400), ('Stencil', 'big-shoulders-stencil-display', 900), ('Bungee', 'bungee', 400), ('BungeeShade', 'bungee-shade', 400),
  ('Shrikhand', 'shrikhand', 400), ('Ultra', 'ultra', 400), ('Yellowtail', 'yellowtail', 400), ('SpecialElite', 'special-elite', 400), ('BlackOps', 'black-ops-one', 400), ('Oswald', 'oswald', 700)]
ff = '\n'.join(f"@font-face{{font-family:{n};src:url({(F / d / 'files' / f'{d}-latin-{w}-normal.woff2').as_uri()})}}" for n, d, w in fonts)
async def main():
  with tempfile.TemporaryDirectory() as td:
    pg_file = pathlib.Path(td) / 'm.html'; pg_file.write_text((here / 'mock.html').read_text().replace('/*FONTS*/', ff))
    async with async_playwright() as pw:
      b = await pw.chromium.launch(); pg = await b.new_page(viewport={'width': 1200, 'height': 700})
      await pg.goto(pg_file.as_uri())
      await pg.evaluate("Promise.all([...document.fonts].map(f => f.load())).then(() => document.fonts.ready)"); await pg.wait_for_timeout(300)
      for i in 'ABCDEF': await pg.locator('#' + i).screenshot(path=str(out / f'{i}.png'))
      await b.close()
asyncio.run(main())
