"""Make the installable web app: a self-contained site in web/ that GitHub Pages serves and Chrome can install (phone, Retroid).
It plays offline: a service worker keeps every file in a cache named after the build, fetches a newer build in the background, and the
page switches to it on the next title screen. Installed, the page drops the on-screen controller and fills the display (body.pwa).
The game itself is dist/stack-style.html unchanged (the release build), wrapped in a full document (the artifact host normally adds the
doctype and head). Everything it needs (art, fonts, sounds) is already inside that one file.
usage (from the repo root, after game/tools/release.py so dist/ is current): python3 -I game/tools/web.py"""
import json, pathlib, re, shutil
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "web"
build = json.loads((ROOT / "dist/version.json").read_text())["build"]
page = (ROOT / "dist/stack-style.html").read_text()
assert not re.search(r"(src|href)\s*=\s*[\"']https?://", page), "the page loads something from the internet: bring it into web/"
if OUT.exists(): shutil.rmtree(OUT)
(OUT / "icons").mkdir(parents=True)

NAME, DARK = "Port Stacker Deluxe", "#120c2e"
DESC = "A container-stacking arcade game from Idle Looping Studios."
# body.pwa (set by pwa.js only when it runs as an installed app): no controller, no title strip, the screen fills the display
PWA_CSS = ("body.pwa{padding:0!important;background:#000!important}"
           "body.pwa .pad,body.pwa .foot,body.pwa .top{display:none!important}"
           "body.pwa #console{display:block!important;height:100%!important;padding:0!important;max-width:none!important;margin:0!important}"
           "body.pwa #screenWrap{position:fixed!important;top:0!important;right:0!important;bottom:0!important;left:0!important;"
           "width:auto!important;height:auto!important;max-width:none!important;aspect-ratio:auto!important;border-radius:0!important;align-self:stretch!important;justify-self:stretch!important;"
           "box-shadow:none!important;margin:0!important}")
head = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        f'<title>{NAME}</title><meta name="description" content="{DESC}">'
        f'<link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="{DARK}">'
        '<link rel="icon" href="icons/icon-192.png"><link rel="apple-touch-icon" href="icons/icon-192.png">'
        '<meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes">'
        '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">'
        f'<style>{PWA_CSS}</style></head><body>')
(OUT / "index.html").write_text(head + page + '<script src="pwa.js"></script></body></html>')

# icons: the app's own icon art (Buck with his air horn, art/appicon); the maskable one is the full-bleed tile, Buck's face in the safe zone
tile = Image.open(ROOT / "art/appicon/tile-1024.png").convert("RGB")
icon = Image.open(ROOT / "art/appicon/icon-512.png").convert("RGB")
icon.save(OUT / "icons/icon-512.png")
icon.resize((192, 192), Image.LANCZOS).save(OUT / "icons/icon-192.png")
tile.resize((512, 512), Image.LANCZOS).save(OUT / "icons/icon-maskable-512.png")

(OUT / "manifest.webmanifest").write_text(json.dumps({
    "name": NAME, "short_name": "Port Stacker", "description": DESC,
    "id": "./", "start_url": "./", "scope": "./", "display": "fullscreen", "display_override": ["fullscreen", "standalone"],
    "orientation": "landscape", "background_color": DARK, "theme_color": DARK, "categories": ["games"],
    "icons": [{"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
              {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
              {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}, indent=1) + "\n")
(OUT / "version.json").write_text(json.dumps({"build": build}) + "\n")

shutil.copy(ROOT / "game/tools/web/pwa.js", OUT / "pwa.js")
files = sorted(str(p.relative_to(OUT)) for p in OUT.rglob("*") if p.is_file() and p.name != "version.json")
sw = (ROOT / "game/tools/web/sw.js").read_text().replace("__BUILD__", str(build)).replace("__FILES__", json.dumps(["./"] + files))
(OUT / "sw.js").write_text(sw)
(OUT / ".nojekyll").write_text("")
print("web app build", build, "->", len(files) + 1, "files")
