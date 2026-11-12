"""Print cut-out poses the way the game will: shrink to game size, turn palette colours into pink/blue/yellow ink amounts, halftone each
ink on its own rotated screen, offset a little, multiply over paper. A preview only (the game does the same on the graphics chip).
usage: python3 -I art/tools/riso_preview.py OUT.png HEIGHT_PX SCALE pose1.png pose2.png ...
Each image is shrunk by the factor that makes the first image of its folder HEIGHT_PX tall, so poses keep their relative sizes; feet line up.
"""
import sys, numpy as np
from PIL import Image
INKMIX = {  # palette colour -> ink amounts (pink, blue, yellow)
  (0x2A, 0x1B, 0x7A): (1, 1, 0), (0xF7, 0xEC, 0xDE): (0, 0, 0), (0xFF, 0x48, 0xB0): (1, 0, 0), (0xFF, 0xB3, 0xDA): (.38, 0, .12),
  (0x26, 0x56, 0xC4): (0, 1, 0), (0x5E, 0xC3, 0xEC): (0, .5, 0), (0xFF, 0xE2, 0x00): (0, 0, 1), (0xB5, 0x56, 0x2E): (.75, .4, 1), (0xFF, 0x7A, 0x1A): (.55, 0, 1)}
INK = {0: (255, 72, 176), 1: (38, 86, 196), 2: (255, 226, 0)}; PAPER = np.array([247, 236, 222], float)
out, H, S, poses = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4:]
pal = np.array(list(INKMIX.keys()), float); mix = np.array(list(INKMIX.values()), float)
import pathlib
first = {}
for p in poses: first.setdefault(str(pathlib.Path(p).parent), Image.open(p).height)
K = {p: H / first[str(pathlib.Path(p).parent)] for p in poses}
sz = {p: (int(Image.open(p).width * K[p]), int(Image.open(p).height * K[p])) for p in poses}
W = 40 + sum(w + 24 for w, h in sz.values()); TOP = max(h for w, h in sz.values()) - H; LH = H + 40 + TOP
plates = np.zeros((LH, W, 3)); plates[..., 1] = .42  # sky
G0 = TOP + H + 20; plates[G0:G0 + 8, :, :] = (0, 0, 1); plates[G0, :, :] = (1, 1, 0); plates[G0 + 7, :, :] = (1, 1, 0)  # a yellow catwalk with indigo edges
x = 30
for p in poses:
  im = Image.open(p).convert('RGBA'); w, h = sz[p]; im = im.resize((w, h), Image.LANCZOS)
  a = np.asarray(im).astype(float); rgb, al = a[..., :3], a[..., 3:] / 255
  k = ((rgb[:, :, None, :] - pal[None, None]) ** 2).sum(-1).argmin(-1); ink = mix[k]
  y0 = G0 - h; reg = plates[y0:y0 + h, x:x + w]; plates[y0:y0 + h, x:x + w] = reg * (1 - al) + ink * al; x += w + 24
OW, OH = W * S, LH * S; yy, xx = np.mgrid[0:OH, 0:OW].astype(float); per = max(S * 1.25, 2.6)
rng = np.random.default_rng(3); img = np.tile(PAPER, (OH, OW, 1)); img[rng.random((OH, OW)) < .04] -= (14, 16, 18)
for ch, ang, off in [(2, .79, (-.4, .6)), (0, .26, (.7, .3)), (1, 1.31, (0, 0))]:
  gx = np.clip(((xx - off[0] * S) // S).astype(int), 0, W - 1); gy = np.clip(((yy - off[1] * S) // S).astype(int), 0, LH - 1)
  t = plates[gy, gx, ch]; c, s = np.cos(ang), np.sin(ang); u = (xx * c + yy * s) / per; v = (-xx * s + yy * c) / per
  spot = (np.cos(2 * np.pi * u) + np.cos(2 * np.pi * v)) / 4 + .5
  on = (t * 1.04 - .02 > spot + (rng.random((OH, OW)) - .5) * .12) & (rng.random((OH, OW)) > .015)
  img[on] *= np.array(INK[ch]) / 255
Image.fromarray(img.clip(0, 255).astype(np.uint8)).save(out); print(out, OW, OH)
