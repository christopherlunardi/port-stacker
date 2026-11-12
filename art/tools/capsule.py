"""Lay the game's logo (art/logo/main.png, its white background cut away) onto Steam capsule art at an exact size.
usage: python3 -I art/tools/capsule.py ART.png OUT.png W H LOGO_W CX CY
(CX, CY: the logo's centre as fractions of the width and height). Crops the art to W:H around its centre first."""
import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
src, out, W, H, lw, cx, cy = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]), float(sys.argv[6]), float(sys.argv[7])
art = Image.open(src).convert('RGB'); w, h = art.size
if w / h > W / H: tw = round(h * W / H); art = art.crop(((w - tw) // 2, 0, (w - tw) // 2 + tw, h))
else: th = round(w * H / W); art = art.crop((0, (h - th) // 2, w, (h - th) // 2 + th))
art = art.resize((W, H), Image.LANCZOS).convert('RGBA')
a = np.asarray(Image.open('art/logo/main.png').convert('RGBA')).copy()
lab, n = ndimage.label(a[..., :3].min(-1) > 235)
edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
a[np.isin(lab, list(edge)), 3] = 0
logo = Image.fromarray(a); logo = logo.crop(logo.getbbox())
logo = logo.resize((lw, round(logo.height * lw / logo.width)), Image.LANCZOS)
# (Chris 2026-11-09: printed into the riso art, not pasted on) the logo printed the way the art is: its ink layers a hair out of register,
# the fills in fine halftone dots, the paper grain over it all
L = np.asarray(logo).astype(float); A = L[..., 3] / 255; rgb = L[..., :3]
dark = (rgb.max(-1) < 90) & (A > 0.5)  # the indigo outline: the key layer
rng = np.random.default_rng(7)
Y, X = np.mgrid[:L.shape[0], :L.shape[1]]
k = max(2.6, lw / 170)  # dot pitch in px
u, v = (X + Y) / (k * 1.414), (X - Y) / (k * 1.414)
dots = (np.cos(u * 2 * np.pi) + np.cos(v * 2 * np.pi)) / 4 + 0.5  # 45-degree screen
# (Chris 2026-11-09: "colour palette not really colour paletting") reprint it in the art's own inks, sampled from the capsule art:
# each logo colour goes to its ink; its light pink becomes pink dots on cream paper, the way a riso makes a tint
INK = {'yellow': [253, 197, 5], 'pink': [250, 66, 151], 'indigo': [38, 39, 122], 'cream': [252, 231, 193]}
SRC = np.array([[240, 208, 0], [240, 32, 144], [240, 160, 192], [240, 224, 208], [0, 0, 64]], float)  # the logo's yellow, pink, light pink, cream, navy
cls = ((rgb[..., None, :] - SRC[None, None]) ** 2).sum(-1).argmin(-1)
fill = np.zeros_like(rgb)
fill[cls == 0] = INK['yellow']; fill[cls == 1] = INK['pink']; fill[cls == 3] = INK['cream']; fill[cls == 4] = INK['indigo']
tint = dots > 0.55  # light pink: pink ink where the screen's dots are, paper between
fill[(cls == 2) & tint] = INK['pink']; fill[(cls == 2) & ~tint] = INK['cream']
rgb = fill.copy()
# paper showing through the fills in a dot pattern, stronger where the ink is light (cream, light pink)
light = rgb.mean(-1) / 255
show = np.clip((dots - 0.62 - (1 - light) * 0.35) * 3, 0, 1)[..., None] * 0.55
paper = np.array(INK['cream'], float)
fill = fill * (1 - show) + paper * show
grain = rng.normal(0, 9, L.shape[:2])[..., None]
fill = np.clip(fill + grain, 0, 255)
off = max(1, round(lw / 260))  # misregistration: fills shifted down-right of the outline
col = np.zeros_like(L); col[..., :3] = fill; col[..., 3] = L[..., 3] * (~dark)
col = np.roll(np.roll(col, off, 0), off, 1)
key = np.zeros_like(L); key[..., :3] = np.clip(np.array(INK['indigo'], float) + grain * 0.6, 0, 255); key[..., 3] = L[..., 3] * dark * (0.93 + 0.07 * rng.random(L.shape[:2]))
base = Image.fromarray(np.uint8(np.clip(col, 0, 255)), 'RGBA')
base.alpha_composite(Image.fromarray(np.uint8(np.clip(key, 0, 255)), 'RGBA'))
logo = base
sh = Image.new('RGBA', logo.size, (38, 39, 122, 0)); sh.putalpha(logo.getchannel('A').filter(ImageFilter.GaussianBlur(max(2, lw // 90))).point(lambda v: int(v * 0.55)))
x, y = round(cx * W - logo.width / 2), round(cy * H - logo.height / 2)
art.alpha_composite(sh, (x + lw // 90, y + lw // 70)); art.alpha_composite(logo, (x, y))
art.convert('RGB').save(out); print(out, (x, y), logo.size)
