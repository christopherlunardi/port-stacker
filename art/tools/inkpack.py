"""Pack the cut-out art into the game as ink images.
Each palette colour becomes ink amounts (R = pink, G = blue, B = yellow, A = coverage); the image is then shrunk to the size the game
draws it at (times 2, for sharp big screens) by averaging those amounts, so edges stay smooth and every asset prints with the same inks.
Writes game/src/js/02b-art.js (generated: don't edit by hand): const ART = { name: { w, h, src } }, w/h in field pixels (320x240 field).
usage: python3 -I art/tools/inkpack.py
"""
import pathlib, io, base64, json, numpy as np
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parents[2]
INKMIX = {  # palette colour -> ink amounts (pink, blue, yellow); keep in step with art/STYLE.md
  (0x2A, 0x1B, 0x7A): (1, 1, 0), (0xF7, 0xEC, 0xDE): (0, 0, 0), (0xFF, 0x48, 0xB0): (1, 0, 0), (0xFF, 0xB3, 0xDA): (.38, 0, .12),
  (0x26, 0x56, 0xC4): (0, 1, 0), (0x5E, 0xC3, 0xEC): (0, .5, 0), (0xFF, 0xE2, 0x00): (0, 0, 1), (0xB5, 0x56, 0x2E): (.75, .4, 1), (0xFF, 0x7A, 0x1A): (.55, 0, 1), (0xF2, 0x3A, 0x2A): (1, 0, .85)}
# name: (file, field-pixel height of the character's reference pose (or of this image), reference file for the character's scale)
SETS = {
  'buck': (['stand', 'run', 'climb', 'climb2', 'horn', 'hornup', 'horndown'], 30, 'stand'),
  'pratt': (['stomp1', 'stomp2', 'climb', 'climb2', 'dizzy', 'squash'], 31, 'stomp1'),
  'containers': (['pink', 'yel', 'blue', 'orange'], 20, None),
  'buckwalk': (['w1', 'w2', 'w3', 'w4'], 30, 'w2'),  # walk cycle (contact, passing, contact, passing), lined up on the head and body
  'prattwalk': (['w1', 'w2', 'w3', 'w4'], 31, 'w2'),
  'crab': (['scuttle1', 'scuttle2', 'wind', 'charge', 'dizzy', 'squash', 'climb'], 19, 'scuttle1'),  # the Captain (ChatGPT 2026-11-08, replaces Pinch: art/crab-pinch-old); 19 tall with his cap
  'bg': (['harbor', 'fore'], 240, None),  # the backdrop: 240 field pixels tall, wider than the field so 16:9 screens see more of it
  'bgparts': (['hook', 'cloud1', 'cloud2'], 0, None),
  'logo': (['main'], 104, None),
  'night': (['fore'], 240, None),
  'forklift': (['drive1', 'drive2', 'rev', 'charge', 'dizzy', 'squash'], 32, 'drive1'),  # the Forklift: since 2026-11-11 a burly driver on a plain little forklift (ChatGPT, art/incoming/forklift-driver-r1.png; Chris: the face-forklift was lame; the old one in art/forklift-old), 32 tall like the walkers
  'gull': (['glide', 'upA', 'upB', 'downA', 'downB', 'dive', 'land', 'takeoff', 'stand', 'walk1', 'walk2', 'walk3', 'dizzy', 'squash'], 22, 'stand'),  # the Gull (ChatGPT 2026-11-09), shift 3
  'storm': (['fore'], 240, None),  # shift 3's storm at dusk (ChatGPT 2026-11-09), cut by stormsplit.py
  'stormlights': (['lit'], 240, None),
  'stormclouds': (['band'], 0, None),  # the storm clouds, already ink amounts  # World 2's backdrop (ChatGPT, 2026-11-07), cut by nightsplit.py; lines up with the day one
  'nightglow': (['windows', 'neon'], 240, None),
  'nightlights': (['lit'], 240, None),  # just the lit pixels of the night painting, laid back on top after the night dimming  # its glows, already in ink amounts (nightsplit.py)
  'watch': (['w1', 'w2', 'w3', 'w4', 'spot', 'climb', 'climb2', 'dizzy', 'squash'], 33, 'w2'),  # the Night Watchman (ChatGPT, 2026-11-08): a little taller than Pratt
  'buckside': (['idle'], 30, None),  # Buck standing side-on (ChatGPT, 2026-11-07): when he stops he faces the way the horn will blow
  'buckhurt': (['hurt'], 0, None),  # Buck's caught pose (arms up), his hat cut off so it can fly (2026-11-07)
  'buckhat': (['hat'], 0, None),  # the title logo (ChatGPT, rope lettering, Chris's pick 2026-11-07)  # moving parts cut from the backdrop by bgsplit.py, at the backdrop's scale
}
SCALE_OF = {'stormclouds': 240 / 948, 'bgparts': 240 / 948, 'buckhurt': 0.0505, 'buckhat': 0.04}  # matched to buck.stand: belt and head the same width, the hat as big as his own
RES_OF = {'bg': 4, 'bgparts': 4, 'night': 4, 'storm': 4, 'stormlights': 4, 'stormclouds': 3, 'nightglow': 1, 'nightlights': 4}
RAW = {'nightglow', 'stormclouds'}  # already ink amounts: no palette snapping
ANCHOR_TOP = {'buckwalk', 'prattwalk', 'watch'}  # (pratt/watch .squash: ChatGPT 2026-11-11, art/incoming/squash-pratt-watch-r1.png, scaled to 36 field px wide)  # sets whose legs and arms change a lot: centre them on the head (the top quarter) instead of the lower half
FILE_SCALE = {'pratt.squash': 0.659, 'watch.squash': 0.4244, 'crab.scuttle2': 194 / 177 * 0.97, 'buck.climb2': 0.7478, 'pratt.climb2': 0.879, 'watch.climb2': 0.5382, 'buck.hornup': 511 / 663, 'buck.horndown': 511 / 663}  # (buck.hornup/horndown: ChatGPT's 2026-11-09 sheet drew Buck bigger: matched hat to boots with the horn pose) ChatGPT drew the Captain's second step smaller than the first: match them (a touch lower, for the bob) so he doesn't swell and shrink as he walks; the second climb pictures (ChatGPT, 2026-11-08) matched to the first ones' height
RES = 6  # stored pixels per field pixel (the field is drawn at 3x on 960x720; x2 for big screens)
pal = np.array(list(INKMIX.keys()), float); mix = np.array(list(INKMIX.values()), float)
art = {}
for folder, (names, hgt, ref) in SETS.items():
  scale = None
  if ref: scale = hgt / Image.open(ROOT / f'art/{folder}/{ref}.png').height
  for n in names:
    im = Image.open(ROOT / f'art/{folder}/{n}.png').convert('RGBA'); a = np.asarray(im).astype(float)
    if folder in RAW: ink = a[..., :3]
    else: k = ((a[..., None, :3] - pal[None, None]) ** 2).sum(-1).argmin(-1); ink = mix[k] * 255
    al = a[..., 3:4] / 255
    rgba = np.concatenate([ink * al, al * 255], -1)  # premultiplied so shrinking averages correctly
    s = (SCALE_OF.get(folder) or (scale if scale else hgt / im.height)) * FILE_SCALE.get(f'{folder}.{n}', 1); R = RES_OF.get(folder, RES)
    W, H = max(1, round(im.width * s * R)), max(1, round(im.height * s * R))
    out = Image.fromarray(rgba.clip(0, 255).astype(np.uint8), 'RGBA').resize((W, H), Image.BOX)
    o = np.asarray(out).astype(float); A = o[..., 3:4]; o[..., :3] = np.where(A > 0, o[..., :3] * 255 / np.maximum(A, 1), 0)  # un-premultiply
    buf = io.BytesIO(); Image.fromarray(o.clip(0, 255).astype(np.uint8), 'RGBA').save(buf, 'PNG', optimize=True)
    # anchor: the middle of the body (the centre of the lower half's ink), so flipping a pose mirrors around the body, not around a raised arm
    op = np.asarray(out)[..., 3] > 128; rows = op.shape[0]; low = op[:rows // 4] if folder in ANCHOR_TOP else op[rows // 2:]; xs = np.where(low)[1]
    ax = ((xs.mean() if len(xs) else W / 2) - W / 2) / R
    art[f'{folder}.{n}'] = {'w': round(W / R, 2), 'h': round(H / R, 2), 'ax': round(float(ax), 2), 'src': 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()}
js = '// ---------- art (generated by art/tools/inkpack.py: do not edit) ----------\n// ink images: R = pink, G = blue, B = yellow amounts; w/h in field pixels\nconst ART = ' + json.dumps(art, separators=(',', ':')) + ';\n'
(ROOT / 'game/src/js/02b-art.js').write_text(js)
print('art', len(art), 'images,', len(js) // 1024, 'KB')
