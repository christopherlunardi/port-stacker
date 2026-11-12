# Renders the round-2 phone shells (iPhone 15 upright + sideways, iPhone SE upright), makes the play copies, and checks every option on
# every phone size: nothing overlapping, nothing off screen or in a safe area, buttons big enough, the game re-fitted to its box.
# usage: python3 -I render.py BUILD.html IMGDIR PLAYDIR [H1 R1 ...]      (add CHECKONLY=1 in the environment to skip the pictures)
import asyncio, io, json, os, pathlib, sys
from playwright.async_api import async_playwright
from PIL import Image
HERE = pathlib.Path(__file__).resolve().parent
build, img, play = pathlib.Path(sys.argv[1]).resolve(), pathlib.Path(sys.argv[2]), pathlib.Path(sys.argv[3])
names = sys.argv[4:] or sorted(p.stem for p in HERE.glob('[HR][0-9].js'))
img.mkdir(parents=True, exist_ok=True); play.mkdir(parents=True, exist_ok=True)
page = build.read_text()
SHOTS = [('up', 393, 852), ('side', 852, 393), ('se', 375, 667)]
# (name, w, h, safe areas top right bottom left): each size plain (in-app view) and with the phone's own notch / home bar
SIZES = [('SE up', 375, 667, (0, 0, 0, 0)), ('SE up bars', 375, 667, (20, 0, 0, 0)), ('SE side', 667, 375, (0, 0, 0, 0)),
         ('15 up', 393, 852, (0, 0, 0, 0)), ('15 up notch', 393, 852, (59, 0, 34, 0)), ('15 up safari', 393, 659, (0, 0, 0, 0)),
         ('15 side', 852, 393, (0, 0, 0, 0)), ('15 side notch', 852, 393, (0, 59, 21, 59)), ('15 side safari', 734, 337, (0, 0, 21, 0)),
         ('ProMax up', 430, 932, (0, 0, 0, 0)), ('ProMax up notch', 430, 932, (59, 0, 34, 0)),
         ('ProMax side', 932, 430, (0, 0, 0, 0)), ('ProMax side notch', 932, 430, (0, 59, 21, 59)),
         ('small 320 up', 320, 568, (0, 0, 0, 0)), ('small side', 568, 320, (0, 0, 0, 0))]
MEASURE = """() => {
  const q = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; };
  const sw = document.querySelector('#screenWrap'), cs = getComputedStyle(sw), r = sw.getBoundingClientRect();
  const bz = parseFloat(cs.marginLeft) || 0, c = document.querySelector('#screen');
  return { boxes: { screen: [r.left - bz, r.top - bz, r.right + bz, r.bottom + bz], top: q('.top'), dpad: q('#dpad'), A: q('#btnA'), B: q('#btnB'), select: q('#btnSel'), start: q('#btnStart') },
    game: [r.width, r.height], pic: [r.left, r.top, r.right, r.bottom], canvas: [c.width, c.height, c.getBoundingClientRect().width, c.getBoundingClientRect().height], dpr: devicePixelRatio, vw: innerWidth, vh: innerHeight,
    capS: (document.querySelector('#btnSel .cap') || document.querySelector('#btnSel')).getBoundingClientRect().height };
}"""
def check(m, safe):
  bad = []; b = m['boxes']; ks = list(b)
  t, r_, bo, l = safe
  for k in ks:
    x0, y0, x1, y1 = b[k]
    if x0 < l - .5 or y0 < t - .5 or x1 > m['vw'] - r_ + .5 or y1 > m['vh'] - bo + .5: bad.append(f'{k} outside ({[round(v) for v in b[k]]})')
    if x1 - x0 < 1 or y1 - y0 < 1: bad.append(f'{k} has no size')
  for i in range(len(ks)):
    for j in range(i + 1, len(ks)):
      a, c = b[ks[i]], b[ks[j]]
      if {ks[i], ks[j]} == {'screen', 'top'}: a = m['pic']   # the name strip is the bezel's chin: it may tuck under the bezel, never over the picture
      if min(a[2], c[2]) - max(a[0], c[0]) > .5 and min(a[3], c[3]) - max(a[1], c[1]) > .5: bad.append(f'{ks[i]} over {ks[j]}')
  for k in ['A', 'B', 'select', 'start']:
    if b[k][2] - b[k][0] < 43.5 or b[k][3] - b[k][1] < 43.5: bad.append(f'{k} too small {b[k][2]-b[k][0]:.0f}x{b[k][3]-b[k][1]:.0f}')
  if b['dpad'][2] - b['dpad'][0] < 100: bad.append('dpad too small')
  gw, gh = m['game']
  if abs(gw / gh - 4 / 3) > .01: bad.append(f'screen not 4:3 ({gw:.0f}x{gh:.0f})')
  cw, ch, bw, bh = m['canvas']
  if abs(bw - gw) > 1 or abs(bh - gh) > 1: bad.append('canvas does not fill the screen box')
  if abs(cw - round(bw * m['dpr'])) > 2 or abs(ch - round(bh * m['dpr'])) > 2: bad.append(f'game not re-fitted ({cw}x{ch} for {bw:.0f}x{bh:.0f})')
  return bad, gw * gh / (m['vw'] * m['vh'])
async def open_(br, js, w, h, safe=(0, 0, 0, 0)):
  ctx = await br.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, is_mobile=True, has_touch=True)
  pg = await ctx.new_page(); errs = []
  pg.on('pageerror', lambda e: errs.append(str(e)))
  await pg.goto(build.as_uri() + '?shot'); await pg.wait_for_timeout(300)
  await pg.add_script_tag(content=js)
  if any(safe): await pg.add_style_tag(content='html:root{--st:%dpx;--sr:%dpx;--sb:%dpx;--sl:%dpx}' % safe)
  await pg.evaluate("newGame(); G.state='play'; DEV.inv=true; document.querySelectorAll('#devCode,#devPanel').forEach(e=>e.remove());")
  return ctx, pg, errs
async def main():
  ok = True; report = {}
  async with async_playwright() as pw:
    br = await pw.chromium.launch()
    for n in names:
      js = (HERE / f'{n}.js').read_text()
      i = page.index('</script>') + len('</script>')
      out = page[:i] + '\n<script>\n' + js + '\n</script>' + page[i:]
      if not out.lstrip().lower().startswith('<!doctype'): out = '<!doctype html>\n' + out
      (play / f'shell-r2-{n}.html').write_text(out)
      report[n] = {}
      for label, w, h, safe in SIZES:
        ctx, pg, errs = await open_(br, js, w, h, safe)
        await pg.wait_for_timeout(700)
        m = await pg.evaluate(MEASURE); bad, share = check(m, safe)
        report[n][label] = round(share * 100, 1)
        if bad or errs: ok = False; print(n, label, 'FAIL', bad, errs)
        await ctx.close()
      if not os.environ.get('CHECKONLY'):
        for orient, w, h in SHOTS:
          ctx, pg, errs = await open_(br, js, w, h)
          await pg.wait_for_timeout(1500)
          png = await pg.screenshot()
          Image.open(io.BytesIO(png)).convert('RGB').save(img / f'{n}-{orient}.jpg', quality=88)
          if errs: ok = False; print(n, orient, 'ERRORS', errs)
          await ctx.close()
      print(n, 'share %:', json.dumps(report[n]))
    await br.close()
  (HERE / 'check.json').write_text(json.dumps(report, indent=1))
  print('ALL CHECKS PASSED' if ok else 'CHECKS FAILED')
asyncio.run(main())
