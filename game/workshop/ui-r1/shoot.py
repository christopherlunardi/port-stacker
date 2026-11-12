"""Shoot the UI-style options on the four screens (pause menu, stage card, high scores, initials) at Retroid 2S size, and build Play copies.
usage: python3 -I game/workshop/ui-r1/shoot.py"""
import asyncio, pathlib
from playwright.async_api import async_playwright
R = pathlib.Path(__file__).resolve().parents[1]; game = (R.parent / 'stack-style.html').read_text(); out = R / 'img/ui-r1'; out.mkdir(parents=True, exist_ok=True)
BOARD = "store.set('board', [{n:'CHR',s:58300,st:4},{n:'BUK',s:41250,st:3},{n:'PRT',s:30800,st:3},{n:'ACE',s:22100,st:2},{n:'GJL',s:18450,st:2},{n:'SAM',s:12000,st:2},{n:'DOC',s:9300,st:1},{n:'MOE',s:6100,st:1},{n:'ZZZ',s:2400,st:1},{n:'AAA',s:800,st:1}]);"
SCREENS = [('pause', "newGame(); G.state='play'; DEV.noEnemies=true; G.enemies=[]; G.spawnQ=[]; pauseGame(); G.menu=1;", 300),
  ('card', "newGame(); startLevel(1); G.t=40;", 120), ('board', BOARD + "G.state='board'; G.t=20; G.lastEntry='BUK41250'; G.frame=0;", 300),
  ('initials', "G.score=27650; G.level=1; G.ini=[2,7,17]; G.iniPos=1; G.state='initials'; G.t=20; G.frame=0;", 300)]
async def main():
  async with async_playwright() as pw:
    b = await pw.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])
    for f in sorted((R / 'ui-r1').glob('[A-Z].js')):
      o = f.stem; html = game.replace('</script>', '</script>\n<script>\n' + f.read_text() + '\n</script>', 1)
      play = R / f'play/ui-r1-{o}.html'; play.write_text('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>html,body{margin:0}</style></head><body>' + html + '</body></html>')
      pg = await b.new_page(viewport={'width': 640, 'height': 480}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
      await pg.goto(play.as_uri() + '?shot'); await pg.wait_for_timeout(600); await pg.evaluate("ssInApp(); document.querySelectorAll('#devCode,#devPanel').forEach(e=>e.remove()); for (const k of Object.keys(SFX)) SFX[k]=()=>{}; G.introDone=true;")
      for name, setup, wait in SCREENS:
        await pg.evaluate(setup); await pg.wait_for_timeout(wait); await pg.screenshot(path=str(out / f'{o}-{name}.png'))
      print(o, errs); await pg.close()
    await b.close()
asyncio.run(main())
