"""Cut the night harbor painting (World 2, Chris 2026-11-07) into layers, like bgsplit.py does for the day one. It lines up with the day
painting (same 1659x948, same crane, hook, skyline), so the game's hook and crane code works on both.
Writes art/night/harbor.png (as painted) and art/night/fore.png (the sky see-through, the hook and its cables taken out: the game draws
the clean day hook, art/bgparts/hook.png, on code-drawn cables). The water stays in the painting but the game covers it with its own
moving night water.
usage: python3 -I art/tools/nightsplit.py"""
import pathlib, numpy as np
from PIL import Image
from scipy import ndimage
ROOT = pathlib.Path(__file__).resolve().parents[2]
src = np.asarray(Image.open(ROOT / 'art/incoming/bg-night-r1.png').convert('RGBA')).copy()
(ROOT / 'art/night').mkdir(exist_ok=True); Image.fromarray(src).save(ROOT / 'art/night/harbor.png')
SKY = np.array([21, 24, 93])
m = ((src[..., :3].astype(int) - SKY) ** 2).sum(-1) < 22 ** 2
lab, n = ndimage.label(m); keep = set(np.unique(lab[:40])) - {0}; sky = np.isin(lab, list(keep)); sky[800:] = False
sky[:600] |= m[:600]  # sky boxed in by the crane
fore = src.copy(); fore[sky, 3] = 0
fore[125:392, 718:808, 3] = 0  # the hook and its cables (the pulley above y 125 stays)
Image.fromarray(fore).save(ROOT / 'art/night/fore.png'); print('ok')
# ---- the glow (Chris 2026-11-07: "marking lights as lights" with the Hereafter Man mist glow): only what gives off light, from the painting:
# lit windows and lamp bulbs (yellow and cream, in the town and the quay lamps, not the crane's yellow cab or the containers), the crane cab's
# lit windows, and the PIER 9 neon. Each becomes a soft glow, pre-blurred (a tight one plus a wide one, like Hereafter Man's haze) and stored
# in ink amounts (R pink, G blue, B yellow) with the glow's strength as alpha, so the game just lays it over the painting. The beacons, the
# lamps' flicker and the sign's flicker are done in the game.
a = src[..., :3].astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]; Y, X = np.mgrid[:a.shape[0], :a.shape[1]]
yellow = (r > 220) & (g > 170) & (b < 140) & (Y > 450) & (Y < 700) & (X > 380)
cream = (r > 235) & (g > 215) & (b > 150) & (Y < 700) & ~((X > 700) & (X < 830) & (Y < 420))
win = (yellow | cream).astype(float)
neon = ((r > 220) & (g > 50) & (g < 150) & (b > 130) & (X > 780) & (X < 945) & (Y > 560) & (Y < 632)).astype(float)
def glow(m, ink, k_tight, k_wide):
  al = np.clip(ndimage.gaussian_filter(m, 5) * k_tight + ndimage.gaussian_filter(m, 20) * k_wide, 0, 0.9)
  out = np.zeros(m.shape + (4,), np.uint8); out[..., 0], out[..., 1], out[..., 2] = ink; out[..., 3] = (al * 255).astype(np.uint8)
  return Image.fromarray(out, 'RGBA').resize((m.shape[1] // 4, m.shape[0] // 4), Image.BOX)
(ROOT / 'art/nightglow').mkdir(exist_ok=True)
glow(win, (40, 0, 255), 1.6, 3.2).save(ROOT / 'art/nightglow/windows.png')
glow(neon, (255, 0, 50), 0.55, 1.1).save(ROOT / 'art/nightglow/neon.png')
print('glow ok')
# ---- the lights themselves, crisp (2026-11-08, Chris: everything was as bright as day, so the lights didn't stand out): every pixel of the
# painting that gives off light, in its own colours: lit windows and lamp bulbs (yellow, cream), the lamps' light cones, the PIER 9 tubes,
# and the red beacons. The game dims the whole night scene toward navy and then lays these back on top at full strength.
red = (r > 200) & (g < 90) & (b < 110) & (((Y < 60) & (X < 820)) | ((Y > 480) & (Y < 560) & (X > 1350)))
cones = (r > 220) & (g > 170) & (b < 140) & (Y > 640) & (Y < 800) & (X > 380)
lit = (yellow | cream | cones | red | (neon > 0)) & (Y < 800)
# (Chris 2026-11-08) a yellow container is paint, not a light: below the warehouse windows only what's inside a lamp's cone counts, and the
# small cranes' yellow hooks aren't lights either
LAMPS = [425, 718, 991, 1247, 1534]  # the street lamps' x, from the cones' tips
incone = np.zeros_like(lit)
for lx in LAMPS: incone |= np.abs(X - lx) <= 18 + np.clip(Y - 690, 0, None) * 0.45
lit &= (Y < 710) | incone
lit &= ~((X > 1360) & (X < 1560) & (Y > 565) & (Y < 640))
la = src.copy(); la[~lit, 3] = 0
(ROOT / 'art/nightlights').mkdir(exist_ok=True); Image.fromarray(la).save(ROOT / 'art/nightlights/lit.png')
print('lights ok', int(lit.sum()), 'px')
