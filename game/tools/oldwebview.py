"""Play the game the way the Retroid 2S's older Android WebView would run it: newer canvas features removed (roundRect, letterSpacing,
FontFace), buttons sent the way the launcher sends them (ssKey). Goes title -> start -> stage card -> play -> pause -> INFO -> board ->
initials. Fails on any page error. (2026-11-07: roundRect was missing on the 2S and starting a game crashed.)
usage: python3 -I game/tools/oldwebview.py PAGE.html"""
import sys, asyncio, pathlib
from playwright.async_api import async_playwright
page = pathlib.Path(sys.argv[1]).resolve()
STEPS = ["G.introDone=true; G.state='title'; G.t=700", "ssKey('a', true)", "ssKey('a', false)", "G.t=(G.introLen||236)-60", "G.t=(G.introLen||236)-20",
  "G.state='play'; G.t=0", "pauseGame()", "G.info=true", "G.info=false; G.state='play'; G.state='dying'; G.t=30", "G.state='board'; G.t=30",
  "G.score=12345; G.ini=[0,1,2]; G.iniPos=0; G.state='initials'; G.t=20", "G.state='clear'; G.t=40", "G.state='over'; G.t=20"]
# CSS the 2S's WebView (Chrome 80) can't read (2026-11-09: the dev panel used inset:0 and drew nowhere): flag it in the page
OLD_CSS = [('inset:', 'Chrome 87'), (':is(', 'Chrome 88'), (':where(', 'Chrome 88')]
async def main():
  src = page.read_text()
  import re
  bad = []
  for css in re.findall(r'<style[^>]*>(.*?)</style>', src, re.S) + re.findall(r'textContent = `([^`]*)`', src, re.S):
    for t, why in OLD_CSS:
      for m in re.finditer(re.escape(t), css):
        ctx = css[max(0, m.start() - 40):m.start() + 30].replace('\n', ' ')
        if t == 'aspect-ratio:' and 'aspect-ratio:auto' in ctx: continue
        bad.append(f'{t} ({why}+): ...{ctx}...')
  for b_ in bad: print('OLD CSS', b_)
  async with async_playwright() as pw:
    b = await pw.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']); pg = await b.new_page(viewport={'width': 640, 'height': 480})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.add_init_script("delete CanvasRenderingContext2D.prototype.roundRect; delete CanvasRenderingContext2D.prototype.letterSpacing; delete window.FontFace;")
    await pg.goto(page.as_uri()); await pg.wait_for_timeout(500); await pg.evaluate("ssInApp(); if (typeof studio !== 'undefined' && studio.cv) { studio.cv.remove(); studio.cv = null; studio.done = true; } for (const k of Object.keys(SFX)) SFX[k] = () => {};")
    for st in STEPS: await pg.evaluate(st); await pg.wait_for_timeout(150)
    # Chrome 80 has no aspect-ratio, so the page's fallback height applies: inside the launcher the screen must still fill it all
    # (2026-11-10: the 2S's intro was in the top 60%, white below)
    await pg.add_style_tag(content='@supports (aspect-ratio:1/1){ #screenWrap{height:60vw} }')
    r = await pg.evaluate("(() => { const r = scr.parentNode.getBoundingClientRect(); return [r.width, r.height, innerWidth, innerHeight]; })()")
    if r[0] != r[2] or r[1] != r[3]: errs.append('in the launcher the screen is %sx%s, not the whole %sx%s (old WebView without aspect-ratio)' % tuple(r))
    await b.close()
  print('old WebView:', 'OK' if not errs and not bad else 'ERRORS'); [print('PAGEERROR', e) for e in errs]; sys.exit(1 if errs or bad else 0)
asyncio.run(main())
