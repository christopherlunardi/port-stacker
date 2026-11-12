"""Split the harbor painting into layers so parts of it can move (Chris 2026-11-07: animate the crane hook and the clouds).
Writes art/bg/fore.png (the painting with the sky see-through, the hook, its cables and the big clouds taken out), and
art/bgparts/hook.png, cloud1.png, cloud2.png (cut from the painting, sky see-through). inkpack.py packs them at the backdrop's scale.
Positions in the painting (1659x948 px) that the game uses: cables at x 741 and 782 from the pulley at y 122; the hook block's top at y 222.
usage: python3 -I art/tools/bgsplit.py
"""
import pathlib, numpy as np
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parents[2]
src = np.asarray(Image.open(ROOT / 'art/bg/harbor.png').convert('RGBA')).copy()
SKY = np.array([79, 196, 245])
def skymask(a): return ((a[..., :3].astype(int) - SKY) ** 2).sum(-1) < 40 ** 2
fore = src.copy()
H = fore.shape[0]
from scipy import ndimage
# the sky: sky-blue pixels joined to the open sky at the top, so the strips of sky between the buildings go too (Chris 2026-11-07: a
# band of the painting's sky above the city didn't match the game's sky) but blue on the buildings and the water stays
m = skymask(fore); lab, n = ndimage.label(m); keep = set(np.unique(lab[:40])) - {0}; sky = np.isin(lab, list(keep)); sky[800:] = False; sky[:600] |= m[:600]  # and any sky-blue above the skyline (boxed in by the crane)
fore[sky, 3] = 0
fore[125:392, 718:808, 3] = 0           # the hook and its cables (the pulley above y 125 stays)
for (x0, y0, x1, y1) in [(895, 10, 1262, 158), (1252, 80, 1659, 292), (372, 258, 648, 368), (1055, 548, 1245, 612)]:  # the three big clouds, and the small one over the warehouses (the moving clouds slid behind it, so they looked like they overlapped: Chris 2026-11-08)
  fore[y0:y1, x0:x1, 3] = 0
Image.fromarray(fore).save(ROOT / 'art/bg/fore.png')
def cut(box, name):
  x0, y0, x1, y1 = box; a = src[y0:y1, x0:x1].copy(); a[skymask(a), 3] = 0; Image.fromarray(a).save(ROOT / f'art/bgparts/{name}.png')
# the hook's block is then painted clean yellow (2026-11-07: the game draws a spinning X on it); the painted original is art/incoming/hook-painted.png
# (the hook isn't re-cut: art/bgparts/hook.png is the hand-cleaned one; re-cutting it brought the painted line back, build 61)
cut((895, 10, 1262, 158), 'cloud1'); cut((372, 258, 648, 368), 'cloud2')
print('ok')
