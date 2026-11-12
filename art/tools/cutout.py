"""Cut a ChatGPT model sheet into poses: key out the #00FF00 background, snap every pixel to the game palette, split the figures
apart (by empty columns), crop each, save as PNGs with transparency.
usage: python3 -I art/tools/cutout.py SHEET.png OUTDIR name1,name2,...   (names left to right)
"""
import sys, pathlib, numpy as np
from PIL import Image
PALETTE = {  # the colours the prompts allow (art/STYLE.md); each maps to ink amounts in the game
  'indigo': (0x2A, 0x1B, 0x7A), 'cream': (0xF7, 0xEC, 0xDE), 'pink': (0xFF, 0x48, 0xB0), 'pinkL': (0xFF, 0xB3, 0xDA), 'blue': (0x26, 0x56, 0xC4),
  'sky': (0x5E, 0xC3, 0xEC), 'yel': (0xFF, 0xE2, 0x00), 'brown': (0xB5, 0x56, 0x2E), 'orange': (0xFF, 0x7A, 0x1A), 'red': (0xF2, 0x3A, 0x2A)}  # red: pink + yellow ink (the captain crab, 2026-11-08)
src, out, names = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]), sys.argv[3].split(',')
out.mkdir(parents=True, exist_ok=True)
a = np.asarray(Image.open(src).convert('RGB')).astype(np.int32)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
green = (g > 150) & (g > r + 60) & (g > b + 60)          # the background
mask = ~green
pal = np.array(list(PALETTE.values())); keys = list(PALETTE)
d = ((a[:, :, None, :] - pal[None, None]) ** 2).sum(-1); idx = d.argmin(-1)
snapped = pal[idx].astype(np.uint8)
# split into figures: connected blobs; the biggest len(names) are the figures, every small bit (motion lines, a stray mark)
# joins the figure whose box centre is nearest
from scipy import ndimage
lab, n = ndimage.label(ndimage.binary_dilation(mask, iterations=2))
sizes = ndimage.sum(mask, lab, range(1, n + 1)); order = np.argsort(sizes)[::-1]
objs = ndimage.find_objects(lab)
big = sorted(order[:len(names)] + 1, key=lambda k: (objs[k - 1][0].start // 150, objs[k - 1][1].start))  # rows top to bottom, then left to right
boxes = [objs[k - 1] for k in big]
owner = {k: i for i, k in enumerate(big)}
for k in order[len(names):] + 1:
  sl = objs[k - 1]; cx = (sl[1].start + sl[1].stop) / 2
  owner[k] = min(range(len(boxes)), key=lambda i: abs((boxes[i][1].start + boxes[i][1].stop) / 2 - cx))
groups = []
for i in range(len(names)):
  sel = np.isin(lab, [k for k, o in owner.items() if o == i]) & mask
  ys, xs = np.where(sel); groups.append((sel, xs.min(), xs.max(), ys.min(), ys.max()))
for (sel, x0, x1, y0, y1), name in zip(groups, names):
  rgba = np.zeros((y1 - y0 + 1, x1 - x0 + 1, 4), np.uint8)
  rgba[..., :3] = snapped[y0:y1 + 1, x0:x1 + 1]; rgba[..., 3] = sel[y0:y1 + 1, x0:x1 + 1] * 255
  Image.fromarray(rgba).save(out / f'{name}.png'); print(name, rgba.shape[1], 'x', rgba.shape[0], 'feet at', y1)
