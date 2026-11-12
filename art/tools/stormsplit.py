"""Cut the storm harbor painting (shift 3, STORM SHIFT, ChatGPT 2026-11-09) into layers, like nightsplit.py. It lines up with the day and
night paintings (same 1659x948, same crane and hook), so the crane and hook code is shared.
The painted sky (flat stripes: Chris found them lame) is cut out: the game draws its own smooth stormy dusk sky, drifting storm clouds, rain
and lightning behind the painting. The hook and its cables are cut too (the game draws the hook). The lights (lit windows, the lamps' cones,
the red beacons) go in their own layer, picked by colour AND place (Chris 2026-11-08: a yellow container is paint, not a light).
Writes art/storm/fore.png and art/stormlights/lit.png.
usage: python3 -I art/tools/stormsplit.py"""
import pathlib, numpy as np
from PIL import Image
from scipy import ndimage
ROOT = pathlib.Path(__file__).resolve().parents[2]
src = np.asarray(Image.open(ROOT / 'art/incoming/bg-storm-r2.png').convert('RGBA')).copy()
a = src[..., :3].astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]; Y, X = np.mgrid[:a.shape[0], :a.shape[1]]
# the sky: the painted stripes, sampled from the open sky on the right
BANDS = np.array([[55, 28, 115], [109, 46, 153], [237, 45, 146], [247, 68, 112], [252, 86, 78], [254, 142, 1], [254, 211, 2]])
d = ((a[..., None, :] - BANDS[None, None]) ** 2).sum(-1).min(-1)
m = (d < 38 ** 2) & ((Y < 672) | ((Y < 702) & (X > 1150)))  # on the right the yellow stripe runs down behind the containers
# the crane is the same pink and yellow as two of the stripes, so it can't go by colour there: left of x 840 (the crane) the sky is wherever
# the night painting's sky is (they line up exactly); right of it, the stripe colours that connect to the top edge
night_sky = np.asarray(Image.open(ROOT / 'art/night/fore.png'))[..., 3] == 0
open_sky = (X >= 840) | ((X >= 360) & (Y >= 430))  # clear of the crane
# each row of the sky is one stripe colour; the skyline's buildings and the sign board share some of those colours but not their row's
expect = np.zeros((a.shape[0], 3))
for y in range(a.shape[0]):
  row = a[y, 840:][m[y, 840:]]
  expect[y] = np.median(row, 0) if len(row) else [255, 255, 255]
rowmatch = (((a - expect[:, None, :]) ** 2).sum(-1) < 45 ** 2) & m & open_sky
lab, n = ndimage.label(rowmatch)
sizes = ndimage.sum(rowmatch, lab, range(1, n + 1))
small_ok = ((X > 1250) & (X < 1570) & (Y > 470) & (Y < 705)) | ((X > 760) & (X < 950) & (Y > 595) & (Y < 645))  # sky seen through the small cranes' lattice and under the sign
keep = [i + 1 for i, s in enumerate(sizes) if s > 600]
small = [i + 1 for i, s in enumerate(sizes) if 8 < s <= 600]
# between the crane's legs (Chris 2026-11-09: something weird left of the right leg): the storm painting's skyline and containers there
# don't match the night painting's, so go by the row's stripe colour there too, tightly (the crane's pink is close to the salmon stripe)
legs = (X < 360) & (Y >= 470) & (Y < 700)  # below the pink stripe, which is the crane's own pink
lm = (((a - expect[:, None, :]) ** 2).sum(-1) < 26 ** 2) & m & legs
ll, ln = ndimage.label(lm)
ls = ndimage.sum(lm, ll, range(1, ln + 1))
sky = np.isin(lab, keep) | (np.isin(lab, small) & small_ok) | (night_sky & ~open_sky & ~legs & (Y < 700)) | np.isin(ll, [i + 1 for i, s in enumerate(ls) if s > 40])
# the soft seams between stripes (in between two stripe colours) go with the sky too
seam = ndimage.binary_dilation(sky, iterations=3) & open_sky & (d < 95 ** 2) & (Y < 640)
sky |= seam
fore = src.copy(); fore[sky, 3] = 0
fore[125:392, 718:808, 3] = 0  # the hook and its cables (the pulley above y 125 stays)
(ROOT / 'art/storm').mkdir(exist_ok=True); Image.fromarray(fore).save(ROOT / 'art/storm/fore.png')
print('fore ok, sky px', int(sky.sum()))
# the lights
yellow = (r > 220) & (g > 170) & (b < 140)
LAMPS = [435, 714, 1240]  # the quay lamps' cones (they lean right), from the cone tips at y 690
incone = np.zeros_like(yellow)
for lx in LAMPS: incone |= (Y >= 680) & (Y <= 800) & (X >= lx - 18 - (Y - 690).clip(0) * 0.3) & (X <= lx + 18 + (Y - 690).clip(0) * 0.7)
wy = yellow & (Y > 520) & (Y < 712) & (X > 300) & ~incone & ~sky
wl, wn = ndimage.label(wy)
ws = ndimage.sum(wy, wl, range(1, wn + 1))
windows = np.isin(wl, [i + 1 for i, s in enumerate(ws) if s < 1200])  # windows are small; a leftover bit of the yellow stripe isn't
red = (r > 200) & (g < 90) & (b < 110) & ~sky & (d > 30 ** 2) & (((Y < 60) & (X < 820)) | ((Y > 480) & (Y < 560) & (X > 1300)))
lit = (windows | (yellow & incone) | red) & ~((X > 1300) & (X < 1560) & (Y > 565) & (Y < 650))  # not the small cranes' yellow hooks
la = src.copy(); la[~lit, 3] = 0
(ROOT / 'art/stormlights').mkdir(exist_ok=True); Image.fromarray(la).save(ROOT / 'art/stormlights/lit.png')
print('lights ok', int(lit.sum()), 'px')
# ---- the storm clouds (Chris 2026-11-09: use the shapes from the first storm painting, in other colours): the first painting's clouds,
# cut out of its sky (the crane and buildings stay out: the night painting's sky mask, which lines up) and recoloured to slate greys by how
# dark each part was (navy outlines stay navy). Stored as ink amounts (inkpack RAW), full width, for the game to drift across the sky.
r1 = np.asarray(Image.open(ROOT / 'art/incoming/bg-storm-r1.png').convert('RGB')).astype(int)
q = r1.sum(-1)
cl = night_sky & (Y < 560) & (r1[..., 0] < 135) & (r1[..., 2] > 60)
cl &= ~((X > 700) & (X < 830) & (Y < 420))  # the hook and its cables
cl = ndimage.binary_opening(cl, iterations=3)  # thin lines (the crane's outlines, which don't quite line up) go
lab, n = ndimage.label(cl)
sz = ndimage.sum(cl, lab, range(1, n + 1))
cl = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s > 400])
ink = np.zeros(r1.shape[:2] + (4,), np.uint8)
dark, mid = q < 175, (q >= 175) & (q < 235)
for msk, val in [(dark, (255, 255, 0)), (mid, (125, 165, 85)), (~dark & ~mid, (80, 115, 60))]:
  ink[msk & cl, :3] = val
ink[cl, 3] = 255
ink = ink[:560, 840:]  # just the open sky right of the crane: the game tiles it (mirrored, so the seams match) as it drifts
(ROOT / 'art/stormclouds').mkdir(exist_ok=True); Image.fromarray(ink, 'RGBA').save(ROOT / 'art/stormclouds/band.png')
print('clouds ok', int(cl.sum()), 'px')
