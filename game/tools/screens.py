"""Every screen at once, frozen at chosen moments, for checking layout by eye (2026-11-07: after the zoom-out, Chris found things off-centre).
usage: python3 -I game/tools/screens.py PAGE.html OUTDIR [WxH ...]   (default sizes: 640x480 = Retroid 2S / phone, 960x540 = 16:9)
Writes one PNG per screen per size, and a contact sheet per size (sheet-WxH.png)."""
import sys, pathlib, asyncio, subprocess
from playwright.async_api import async_playwright
page, out = pathlib.Path(sys.argv[1]).resolve(), pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
sizes = [tuple(map(int, s.split('x'))) for s in sys.argv[3:]] or [(640, 480), (960, 540)]
T = "G.state='title'; G.introDone={done}; G.t={t}; G.frame={t};"
SCREENS = [
  ('splash', "G.state='splash'; G.frame=30;"),
  ('title-buck', T.format(done='false', t=110)), ('title-horn', T.format(done='false', t=215)), ('title-lower', T.format(done='false', t=290)),
  ('title-fall', T.format(done='false', t=312)), ('title-squash', T.format(done='false', t=330)), ('title-crab', T.format(done='false', t=470)),
  ('title-bonk', T.format(done='false', t=500)), ('title-logo', T.format(done='false', t=640)), ('title-menu', T.format(done='true', t=900)),
  ('title-reset1', T.format(done='true', t=1000)), ('title-reset2', T.format(done='true', t=1080)), ('title-reset3', T.format(done='true', t=1140)),
  ('card', "newGame(); G.state='intro'; G.t=60;"), ('ready', "newGame(); G.state='intro'; G.t=(G.introLen||INTRO_LEN)-30;"),
  ('play', "newGame(); G.state='play'; G.p.x=200; G.p.y=rowY(19); G.spawnQ=[{type:'pratt',t:20,at:{x:12,y:rowY(4),door:0}}]; for(let i=0;i<10;i++) update({held:{},pressed:{}});"),
  ('night-card', "newGame(); G.loop=1; startLevel(3); G.state='intro'; G.t=60;"), ('night-play', "newGame(); G.loop=1; startLevel(3); G.state='play'; G.frame=400; for(let i=0;i<30;i++) update({held:{},pressed:{}});"),
  ('night-over', "newGame(); G.loop=1; startLevel(3); G.state='over'; G.t=80; G.score=31250; G.newBest=true;"),
  ('storm-card', "newGame(); G.loop=2; startLevel(0); G.state='intro'; G.t=60;"),
  ('storm-play', "newGame(); G.loop=2; startLevel(0); G.state='play'; G.frame=400; for(let i=0;i<30;i++) update({held:{},pressed:{}});"),
  ('storm-flash', "newGame(); G.loop=2; startLevel(1); G.state='play'; G.frame=400; for(let i=0;i<30;i++) update({held:{},pressed:{}}); G.storm={next:1e9,age:10,x:1250,seed:99};"),
  ('pops', "newGame(); G.state='play'; G.frame=300; G.score=999999; G.hi=999999; G.lives=9; G.p.horns=99; G.combo=8; G.comboT=140; G.pops=[{x:60,y:120,text:'800',col:'yel',t:60,pts:800},{x:190,y:150,text:'SQUASH X3 3200',col:'yel',t:60,pts:3200,size:9},{x:340,y:90,text:'CHAIN X4 800',col:'pink',t:60,pts:800,size:9,sub:'X3 POINTS'},{x:370,y:200,text:'1600',col:'yel',t:60,pts:1600}]; G.banner={text:'EXTRA LIFE! BONUS AT 40000'};"),
  ('stress-over', "newGame(); G.loop=3; startLevel(3); G.score=999999; G.state='over'; G.t=200; G.made=true; G.newBest=true;"),
  ('stress-board', "store.set('board',[0,1,2,3,4,5,6,7,8,9].map(i=>({n:['WWW','MMM','BUK','AAA','III','QQQ','ZZZ','OOO','888','XYZ'][i],s:999999-i*111111,st:12-i}))); G.state='board';"),
  ('stress-card', "newGame(); G.loop=3; startLevel(3); G.state='intro'; G.t=60;"),
  ('howto', "G.state='title'; G.introDone=true; startHowto('guide'); G.howSel=4; G.howView='list'; setupHowto(); for(let i=0;i<120;i++) update({held:{},pressed:{}});"),
] + [('howto-basic%d' % i, "G.state='title'; G.introDone=true; startHowto(); G.howSel=%d; setupHowto(); for(let i=0;i<90;i++) update({held:{},pressed:{}});" % i) for i in range(7)] + [('howto-read%02d' % i, "G.state='title'; G.introDone=true; startHowto('guide'); G.howView='read'; G.howSel=%d; setupHowto(); for(let i=0;i<90;i++) update({held:{},pressed:{}});" % i) for i in range(18)] + [
  ('clear-rows', "newGame(); G.state='clear'; G.st={score0:0,f:4980,squash:3,riders:4,chain:3,combo:3,horns:2,deaths:0,total:18450,left:37,delta:1850,paid:false}; G.clearOut=0; G.t=80;"),
  ('clear-time', "newGame(); G.state='clear'; G.st={score0:0,f:6780,squash:3,riders:4,chain:3,combo:6,horns:2,deaths:1,total:18450,left:37,delta:1850,paid:false,drop:9200}; G.clearOut=0; G.t=210;"),
  ('clear-horns', "newGame(); G.loop=1; startLevel(3); G.state='clear'; G.st={score0:0,f:7300,squash:12,riders:9,combo:22,horns:6,deaths:0,total:184450,left:-23,delta:-2300,paid:true,drop:41250,hornsLeft:7,hornBonus:28000,hornPaid:false}; G.clearOut=0; G.t=300;"),
  ('clear-count', "newGame(); G.state='clear'; G.st={score0:0,f:4980,squash:3,riders:4,chain:3,combo:3,horns:2,deaths:0,total:18450,left:37,delta:1850,paid:false}; G.clearOut=0; G.t=140;"),
  ('clear-done', "newGame(); G.loop=1; startLevel(3); G.state='clear'; G.st={score0:0,f:7300,squash:12,riders:9,chain:5,combo:4,horns:6,deaths:0,total:184450,left:-23,delta:-2300,paid:false,drop:41250,hornsLeft:3,hornBonus:12000}; G.clearOut=0; G.t=420;"),
  ('pause', "newGame(); G.state='pause'; G.menu=0;"), ('info', "newGame(); G.state='pause'; G.info=true;"),
  ('over', "newGame(); G.state='over'; G.t=40; G.score=9950;"),
  ('board', "store.set('board',[{n:'BUK',s:9950,st:1},{n:'AAA',s:500,st:1}]); G.state='board';"),
  ('initials', "newGame(); G.score=9950; G.state='initials'; G.ini=[0,0,0]; G.iniPos=0;"),
]
# the text check (2026-11-08, after moving every word to one font): every word drawn is recorded with its box on the screen; anything that
# runs off the screen, or overlaps a different word, is reported
HOOK = """(() => { const tf = textF; textF = function (fam, s, x, y, size, c, align = 'left', outline, o = {}) {
  if (window.__T && String(s).trim()) { let sz = size; if (o && o.maxW) { const w0 = textW(fam, s, size, o); if (w0 > o.maxW) sz = size * o.maxW / w0; }
    const w = textW(fam, s, sz, o || {}), x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x, m = pg.getTransform();
    const pts = [[x0, y - sz * 0.42], [x0 + w, y - sz * 0.42], [x0, y + sz * 0.42], [x0 + w, y + sz * 0.42]].map(([a, b]) => [m.a * a + m.c * b + m.e, m.b * a + m.d * b + m.f]);
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); window.__T.push({ s: String(s), a: pg.globalAlpha, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }); }
  return tf.apply(this, arguments); };
  const rb = ribbon; ribbon = function (x, y, w, h) { if (window.__T) { const m = pg.getTransform(), a = [m.a * (x - w / 2 - h * 0.9) + m.e, m.d * y + m.f], b = [m.a * (x + w / 2 + h * 0.9) + m.e, m.d * (y + h * 1.35) + m.f];
    window.__T.push({ s: '[ribbon ' + arguments[5] + ']', a: pg.globalAlpha, x0: a[0], x1: b[0], y0: a[1], y1: b[1] }); } return rb.apply(this, arguments); }; })()"""
AUDIT = """(() => { const T = (window.__T || []).filter(t => t.a > 0.3), W = plate.width, H = plate.height, out = [];
  for (const t of T) if (t.x0 < -1 || t.x1 > W + 1 || t.y0 < -1 || t.y1 > H + 1) out.push('off screen: "' + t.s + '"');
  if (typeof G !== 'undefined' && !['title','board','initials','splash'].includes(G.state)) { const m = LAY, fx0 = m.ox * m.k, fx1 = (m.ox + PW) * m.k; for (const t of T) if (t.y0 > (m.oy + 30) * m.k && t.y1 < (m.oy + PH) * m.k && ((t.x0 < fx0 - 1 && t.x1 > fx0 + 1) || (t.x0 < fx1 - 1 && t.x1 > fx1 + 1))) out.push('crosses the field edge: "' + t.s + '"'); }
  for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) { const a = T[i], b = T[j]; if (a.s === b.s || a.s === '[ribbon ' + b.s + ']' || b.s === '[ribbon ' + a.s + ']') continue;
    const ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
    const rib = a.s.startsWith('[ribbon') || b.s.startsWith('[ribbon');
    if (ix > 1 && iy > 0.5 && (rib || ix * iy > 0.12 * Math.min((a.x1 - a.x0) * (a.y1 - a.y0), (b.x1 - b.x0) * (b.y1 - b.y0)))) out.push('overlap: "' + a.s + '" / "' + b.s + '"'); }
  return [...new Set(out)]; })()"""
problems = []
async def main():
  errs = []
  async with async_playwright() as pw:
    br = await pw.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])
    for w, h in sizes:
      pg = await br.new_page(viewport={'width': w, 'height': h}); pg.on('pageerror', lambda e: errs.append(str(e)))
      await pg.goto(page.as_uri() + '?shot'); await pg.wait_for_timeout(500); await pg.evaluate("ssInApp(); if (typeof studio !== 'undefined' && studio.cv) { studio.cv.remove(); studio.cv = null; studio.done = true; }")  # (past the studio intro the app goes straight to)
      await pg.evaluate("document.querySelectorAll('#devCode,#devPanel').forEach(e=>e.remove()); window.requestAnimationFrame = () => 0; for (const k of Object.keys(SFX)) SFX[k] = () => {};")
      await pg.evaluate(HOOK); await pg.wait_for_timeout(300); files = []
      for name, js in SCREENS:
        await pg.evaluate("window.__T = []; G.banner = null;")
        await pg.evaluate(js + "; G.shake=0; render(); present();"); await pg.wait_for_timeout(30)
        for msg in await pg.evaluate(AUDIT): problems.append(f'{w}x{h} {name}: {msg}')
        f = out / f'{name}-{w}x{h}.png'; await pg.screenshot(path=str(f)); files.append(str(f))
        subprocess.run(['convert', str(f), '-stroke', '#ff0000', '-strokewidth', '1', '-draw', f'line {w//2},0 {w//2},{h}', str(f)], check=True) # the centre line
      await pg.close()
      subprocess.run(['montage', *files, '-tile', '4x', '-geometry', '+3+3', '-title', f'{w}x{h}', str(out / f'sheet-{w}x{h}.png')], check=True)
    await br.close()
  for p in problems: print('TEXT', p)
  for e in errs: print('PAGEERROR', e)
  print('wrote', out); sys.exit(1 if errs else 0)
asyncio.run(main())
