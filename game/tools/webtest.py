"""Tests the installable web app in web/ (run game/tools/web.py first): serves it on localhost and, in Chromium,
checks the manifest and service worker, plays it offline from the cache (with sound), checks a new build waits for the title screen,
and takes screenshots as an installed app (390x844, 844x390 with touch, 640x480) and as a normal page.
usage: python3 -I game/tools/webtest.py OUTDIR"""
import http.server, json, pathlib, shutil, socketserver, sys, threading, time
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
SITE = OUT / "site"
if SITE.exists(): shutil.rmtree(SITE)
shutil.copytree(ROOT / "web", SITE)

class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=str(SITE), **k)
    def log_message(self, *a): pass
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache"); super().end_headers()
srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), Quiet); srv.daemon_threads = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f"http://127.0.0.1:{srv.server_address[1]}/"
fails = []
def ok(c, msg):
    print(("ok   " if c else "FAIL ") + msg); (None if c else fails.append(msg))

def installed(page):
    # pretend to be the installed app: Chrome answers (display-mode: fullscreen) as true there (headless Chromium can't emulate it)
    page.add_init_script("""(() => { const mm = window.matchMedia.bind(window);
      window.matchMedia = q => /display-mode:\\s*(fullscreen|standalone)/.test(q) ? { matches: true, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : mm(q); })()""")

def boot(page, url=URL):
    page.goto(url); page.wait_for_function("typeof G !== 'undefined' && G.state", timeout=30000)

with sync_playwright() as p:
    br = p.chromium.launch()
    # 1. manifest, service worker, offline with sound
    ctx = br.new_context(viewport={"width": 640, "height": 480})
    pg = ctx.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    boot(pg)
    man = pg.evaluate("fetch(document.querySelector('link[rel=manifest]').href).then(r => r.json())")
    ok(man.get("display") == "fullscreen" and man.get("orientation") == "landscape" and man.get("start_url") == "./" and len(man.get("icons", [])) == 3, "manifest: fullscreen, landscape, start_url ./, 3 icons")
    pg.wait_for_function("navigator.serviceWorker.controller || navigator.serviceWorker.ready.then(() => true)", timeout=20000)
    pg.reload(); boot(pg)
    ok(pg.evaluate("!!navigator.serviceWorker.controller"), "service worker controls the page")
    cache = pg.evaluate("caches.keys()"); ok(any(k.startswith("portstacker-") for k in cache), "precached in " + ", ".join(cache))
    ok(not pg.evaluate("document.body.classList.contains('pwa')"), "a normal tab doesn't get the pwa class")
    ctx.set_offline(True)
    pg.reload(); boot(pg)
    ok(True, "offline reload: the game boots from the cache (state " + pg.evaluate("G.state") + ")")
    pg.keyboard.press("Enter"); time.sleep(0.5); pg.keyboard.press("Enter"); time.sleep(3)
    ok(pg.evaluate("typeof AC !== 'undefined' && AC.state === 'running'"), "offline: sound starts on a key press (AudioContext " + pg.evaluate("typeof AC !== 'undefined' ? AC.state : 'none'") + ")")
    for i in range(6): pg.keyboard.press("Enter"); time.sleep(0.8)
    st = pg.evaluate("G.state"); ok(st in ("play", "card", "ready", "intro") or st not in ("title", "studio"), "offline: a game starts (state " + st + ")")
    ctx.set_offline(False)
    ok(not errs, "no page errors" + (": " + "; ".join(errs[:3]) if errs else ""))
    # 2. a new build waits for the title screen
    pg.evaluate("G.state = 'play'")
    sw = (SITE / "sw.js").read_text(); b = json.loads((SITE / "version.json").read_text())["build"]
    (SITE / "sw.js").write_text(sw.replace(f"const BUILD = {b},", f"const BUILD = {b + 1},"))
    pg.evaluate("window.__stay = 1; navigator.serviceWorker.getRegistration().then(r => r.update())")
    time.sleep(4)
    ok(pg.evaluate("window.__stay === 1"), "a new build doesn't switch in the middle of a game")
    pg.evaluate("G.state = 'title'")
    try:
        pg.wait_for_function("window.__stay !== 1", timeout=8000); swapped = True
    except Exception: swapped = False
    ok(swapped, "on the title screen the new build takes over (page reloaded)")
    boot(pg); time.sleep(1)
    cache = pg.evaluate("caches.keys()"); ok(cache == [f"portstacker-{b + 1}"], "old build's cache deleted (" + ", ".join(cache) + ")")
    (SITE / "sw.js").write_text(sw)
    ctx.close()
    # 3. screenshots: installed (controller hidden) and normal (controller shown)
    shots = [("app-390x844", 390, 844, True, True), ("app-844x390", 844, 390, True, True), ("app-640x480", 640, 480, False, True),
             ("web-390x844", 390, 844, True, False), ("web-844x390", 844, 390, True, False)]
    for name, w, h, touch, inst in shots:
        c = br.new_context(viewport={"width": w, "height": h}, has_touch=touch, is_mobile=touch, device_scale_factor=2 if touch else 1)
        q = c.new_page()
        if inst: installed(q)
        boot(q); time.sleep(2)
        q.keyboard.press("Enter")
        q.wait_for_function("G.state === 'title'", timeout=20000); time.sleep(1.5)
        info = q.evaluate("""(() => { const s = document.getElementById('screen').getBoundingClientRect(), pad = document.querySelector('.dpad');
          return {pwa: document.body.classList.contains('pwa'), pad: !!pad && getComputedStyle(pad).display !== 'none' && pad.getBoundingClientRect().height > 0,
                  x: s.left, y: s.top, w: s.width, h: s.height, iw: innerWidth, ih: innerHeight}; })()""")
        q.screenshot(path=str(OUT / f"{name}.png"))
        if inst:
            ok(info["pwa"] and not info["pad"], f"{name}: pwa class on, controller hidden")
        else:
            ok(not info["pwa"] and info["pad"], f"{name}: normal page shows the controller")
        ok(info["x"] >= -0.5 and info["y"] >= -0.5 and info["x"] + info["w"] <= info["iw"] + 0.5 and info["y"] + info["h"] <= info["ih"] + 0.5,
           f"{name}: the screen fits the window ({info['w']:.0f}x{info['h']:.0f} in {info['iw']}x{info['ih']})")
        c.close()
    br.close()
srv.shutdown()
print("PASS" if not fails else f"FAILED {len(fails)}")
sys.exit(1 if fails else 0)
