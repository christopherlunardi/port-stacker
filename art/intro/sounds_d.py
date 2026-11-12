# Sound options for intro D (the idle loop), muxed over D's frames. 84 BPM. Stereo, loudness-normalised so they play at a normal level.
# usage: python3 -I sounds_d.py FRAMES_DIR OUT_PREFIX [D1 D2 ...]   -> OUT_PREFIX-D1.mp4 ...
# D's timeline (round 2: round 1's D from the moment it turns right): the wave eases in and runs right, fastest around 0.5s, slowing to
# a stop on the logo at 1.26s; it swells to full thickness from 0.46s with a springy overshoot; the name comes in 0.7-1.8s; held to 4.0s.
import pathlib, subprocess, sys, wave
import numpy as np
from scipy.signal import lfilter, butter

FR, PRE = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
OUT = PRE.parent
WANT = sys.argv[3:] or ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7']
SR, LEN = 44100, 5.4  # (5.4 from build 179: the intro now fades to black until about 4.9s, and the chime rings out under it)
LAND = 1.26
SWELL = 0.46
BEAT = 60 / 84
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(4)


def T(d): return np.arange(int(d * SR)) / SR
def adsr(n, a, d, s, r):
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel = int(r * SR)
    if rel and rel < n: e[-rel:] *= np.linspace(1, 0, rel)
    return e
def osc(freq, kind='sine'):
    ph = 2 * np.pi * np.cumsum(freq) / SR
    if kind == 'sine': return np.sin(ph)
    if kind == 'tri': return 2 / np.pi * np.arcsin(np.sin(ph))
    if kind == 'saw': return 2 * ((ph / (2 * np.pi)) % 1) - 1
def lp(x, fc, order=2):
    b, a = butter(order, min(fc, SR / 2.2) / (SR / 2)); return lfilter(b, a, x)
def lpv(x, fc):  # a two-pole low pass whose cutoff moves over time (fc: an array as long as x)
    g = 1 - np.exp(-2 * np.pi * np.asarray(fc) / SR); y1 = y2 = 0.0; out = np.empty_like(x)
    for i in range(len(x)):
        y1 += g[i] * (x[i] - y1); y2 += g[i] * (y1 - y2); out[i] = y2
    return out
def hp(x, fc):
    b, a = butter(2, fc / (SR / 2), 'high'); return lfilter(b, a, x)
def note(f, d, kind='sine', a=0.005, dec=0.4, s=0.3, r=0.2, vib=0, wow=None):
    t = T(d)
    fr = f * (1 + vib * np.sin(2 * np.pi * 5.5 * t))
    if wow is not None: fr = fr * wow[: len(t)]
    return osc(fr, kind) * adsr(len(t), a, dec, s, r)
def epiano(f, d, wow=None):  # a soft Rhodes-ish tone: sine plus a bell partial that dies fast
    t = T(d)
    w = 1 if wow is None else wow[: len(t)]
    return (osc(f * w + 0 * t) * adsr(len(t), 0.004, 0.9, 0.25, 0.3) + 0.35 * osc(f * 7.0 * w + 0 * t) * np.exp(-t * 14)) * 0.5
def kick(): t = T(0.35); return np.sin(2 * np.pi * np.cumsum(50 + 110 * np.exp(-t * 30)) / SR) * np.exp(-t * 9)
def rim(): t = T(0.06); return hp(rng.uniform(-1, 1, len(t)), 1800) * np.exp(-t * 70) * 0.7 + np.sin(2 * np.pi * 1700 * t) * np.exp(-t * 90) * 0.4
def hat(): t = T(0.05); return hp(rng.uniform(-1, 1, len(t)), 7000) * np.exp(-t * 90) * 0.5
def crackle(d, dens=30):
    x = np.zeros(int(d * SR)); idx = rng.integers(0, len(x), int(d * dens)); x[idx] = rng.uniform(-1, 1, len(idx))
    return lp(x, 4000) * 2 + lp(rng.uniform(-1, 1, len(x)), 600) * 0.01

N = lambda m: 440 * 2 ** ((m - 69) / 12)  # midi to Hz
Am9 = [45, 52, 55, 59, 60, 64]
def verb(x, secs=1.6, mix=0.3, seed=9):  # a small reverb: the sound smeared by a burst of decaying noise
    n = int(secs * SR); r = np.random.default_rng(seed).uniform(-1, 1, n) * np.exp(-np.arange(n) / SR * 4.5 / secs)
    r = lp(r, 5000) / np.sqrt((r ** 2).sum())
    from scipy.signal import fftconvolve
    return x * (1 - mix) + fftconvolve(x, r)[: len(x)] * mix * 3
def roll_pan(n):  # follows the wave: it runs left to right and stops in the middle as it lands
    t = np.arange(n) / SR; k = np.clip(t / LAND, 0, 1)
    return -0.8 + 0.8 * (1 - (1 - k) ** 2)            # A2 E3 G3 B3 C4 E4


class Mix:
    def __init__(s): s.L = np.zeros(int((LEN + 1) * SR)); s.R = np.zeros_like(s.L)
    def add(s, at, sig, vol=1.0, pan=0.0):
        i = int(at * SR); j = min(len(s.L), i + len(sig)); sig = sig[: j - i] * vol
        s.L[i:j] += sig * np.sqrt((1 - pan) / 2) * 1.41; s.R[i:j] += sig * np.sqrt((1 + pan) / 2) * 1.41
    def addp(s, at, sig, vol, pan):  # pan: an array as long as sig, -1 left .. 1 right
        i = int(at * SR); j = min(len(s.L), i + len(sig)); sig = sig[: j - i] * vol; pan = pan[: j - i]
        s.L[i:j] += sig * np.sqrt((1 - pan) / 2) * 1.41; s.R[i:j] += sig * np.sqrt((1 + pan) / 2) * 1.41
    def out(s):
        x = np.stack([s.L, s.R])[:, : int(LEN * SR)]
        fade = int(0.8 * SR); x[:, -fade:] *= np.cos(np.linspace(0, np.pi / 2, fade)) ** 2  # a gentle curve out (a short straight fade cut the chime off)
        return np.tanh(x * 1.2) / 1.2


def D1():  # music box: the arpeggio runs fast and slows down with the wave (a ritardando), landing on a warm chord and a sparkle
    m = Mix()
    seq = [57, 64, 67, 72, 71, 67, 64, 59]
    times = [LAND * (1 - (1 - k / 8) ** 0.6) for k in range(8)]  # bunched up at the start, spreading out as it slows
    for k, at in enumerate(times):
        m.add(0.05 + at, note(N(seq[k] + 12), 0.5, 'tri', dec=0.2, s=0.1, r=0.15), 0.22, pan=(-0.4, 0.4)[k % 2])
        m.add(0.05 + at, note(N(seq[k] + 24), 0.25, 'sine', dec=0.08, s=0, r=0.1), 0.06, pan=(0.4, -0.4)[k % 2])
    m.add(0.05, note(N(45), LAND, 'tri', a=0.1, dec=2, s=0.6, r=0.3), 0.2)
    for f in Am9: m.add(LAND, note(N(f), 2.5, 'tri', a=0.03, dec=1.2, s=0.4, r=1.1), 0.1, pan=(f % 3 - 1) * 0.4)
    m.add(LAND, note(N(45), 2.3, 'sine', a=0.01, dec=1.0, s=0.3, r=1.0), 0.4)
    for k, f in enumerate([76, 79, 81, 84, 88, 91]): m.add(LAND + 0.05 + k * 0.07, note(N(f), 0.8, 'sine', dec=0.3, s=0, r=0.4), 0.08, pan=-0.6 + k * 0.24)
    return m.out()


def D2():  # tape loop: a soft electric piano on worn tape, warbling while the wave rolls and going steady as it lands, vinyl crackle
    m = Mix(); t = T(LEN + 1)
    settle = np.clip(t / LAND, 0, 1)
    wow = 1 + (0.014 * np.sin(2 * np.pi * 1.6 * t) + 0.004 * np.sin(2 * np.pi * 7 * t)) * (1 - settle)
    for k, c in enumerate([[57, 60, 64, 67], [55, 59, 62, 65], [57, 60, 64, 67]]):
        at = 0.03 + k * LAND / 3
        w = wow[int(at * SR):]
        for f in c: m.add(at, epiano(N(f), LAND / 3 + 0.1, w), 0.18, pan=(f % 4 - 1.5) * 0.25)
        m.add(at, note(N(c[0] - 12), LAND / 3, 'sine', dec=0.4, s=0.3, r=0.1, wow=w), 0.3)
    for f in [57, 60, 64, 67, 71, 74]: m.add(LAND, epiano(N(f), 2.5), 0.17, pan=(f % 4 - 1.5) * 0.3)
    m.add(LAND, note(N(45), 2.3, 'sine', a=0.01, dec=1.2, s=0.35, r=1.0), 0.4)
    m.add(0, lp(crackle(LEN), 5000), 0.25, pan=-0.2); m.add(0, crackle(LEN), 0.15, pan=0.3)
    m.add(LAND + 0.5, note(N(88), 1.0, 'sine', dec=0.4, s=0, r=0.5), 0.07, pan=0.4)
    return lp(m.out(), 9000)


def D3():  # rubber synth: one gooey synth voice bending with the wave, sliding up into the landing note; a bwomp as it puffs up
    m = Mix(); t = T(LEN + 1)
    settle = np.clip(t / LAND, 0, 1); settle = settle * settle * (3 - 2 * settle)
    f = N(45) * 2 ** ((7 * settle) / 12) * 2 ** ((2.2 * np.sin(t * 7) + 1.1 * np.sin(t * 13 + 1)) * (1 - settle) / 12)
    v = lpv(osc(f, 'saw') + 0.6 * osc(f * 1.005, 'saw'), 600 + 1500 * (0.5 + 0.5 * np.sin(t * 7)) * (1 - settle) + 900 * settle)
    env = np.clip(t / 0.25, 0, 1) * np.where(t < 1.8, 1, np.exp(-(t - 1.8) * 1.8))
    m.add(0, v * env, 0.3); m.add(0, osc(f / 2) * env, 0.35)
    t2 = T(0.6)
    m.add(SWELL, lpv(osc(N(40) * 2 ** (np.exp(-t2 * 8) * 1.2), 'saw'), 300 + 2500 * np.exp(-t2 * 6)) * np.exp(-t2 * 4), 0.5)
    for f2 in [52, 59, 64, 67, 71]: m.add(LAND, note(N(f2), 2.4, 'sine', a=0.15, dec=1.2, s=0.5, r=1.0, vib=0.003), 0.08, pan=(f2 % 3 - 1) * 0.5)
    return m.out()


def D4():  # beat drop: a quick 84 BPM groove while it rolls, a short riser, then a kick, a deep bass hit and one chord as it lands
    m = Mix(); s16 = BEAT / 4
    for k in range(7):
        at = 0.03 + k * s16
        if k % 8 == 0: m.add(at, kick(), 0.8)
        if k % 8 == 4: m.add(at, rim(), 0.45, pan=0.15)
        if k % 2 == 1: m.add(at, hat(), 0.25 + 0.1 * (k % 4 == 3), pan=-0.3)
    t = T(LAND - 0.05)
    bass = lpv(osc(N(33) + 0 * t, 'saw'), 200 + 900 * t / LAND) * np.clip(t / 0.05, 0, 1) * (0.6 + 0.4 * (np.sin(2 * np.pi * t / (BEAT / 2)) > 0))
    m.add(0.05, bass, 0.3)
    n = int(0.3 * SR); m.add(LAND - 0.3, lp(rng.uniform(-1, 1, n), 3000) * np.linspace(0, 1, n) ** 2, 0.15)
    m.add(LAND, kick(), 0.9); m.add(LAND, note(N(33), 2.4, 'sine', a=0.005, dec=1.2, s=0.3, r=1.0), 0.6)
    for f in Am9: m.add(LAND, epiano(N(f + 12), 2.5), 0.16, pan=(f % 3 - 1) * 0.4)
    m.add(LAND + 0.43, rim(), 0.3, pan=0.3)
    return m.out()


def D5():  # sub glide: a deep 808-style bass sliding up as the wave runs right, a snap as it lands, a warm chord with a reverb tail
    m = Mix(); t = T(LEN + 1); k = np.clip(t / LAND, 0, 1)
    f = N(33) * 2 ** ((12 * (1 - (1 - k) ** 2)) / 12)
    sub = np.tanh(osc(f) * 1.8) * np.clip(t / 0.2, 0, 1) * np.where(t < LAND, 1, np.exp(-(t - LAND) * 1.4))
    m.add(0, sub, 0.42)
    hiss = lpv(rng.uniform(-1, 1, len(t)), 400 + 3000 * k) * np.clip(t / 0.3, 0, 1) * np.where(t < LAND, 1, 0) * k
    m.addp(0, hiss, 0.07, roll_pan(len(t)))
    m.add(LAND, rim(), 0.5); m.add(LAND, lp(rng.uniform(-1, 1, int(0.12 * SR)), 2500) * np.exp(-T(0.12) * 30), 0.3)
    # the chord rings and dies away by itself (Chris: the chime faded out abruptly), and its echo gets room to finish
    ring = LEN - LAND
    ch = np.zeros(int((ring + 0.5) * SR))
    for f2 in [57, 60, 64, 67, 71]:
        tt = T(ring); e = np.exp(-tt * 0.8) * np.clip(tt / 0.004, 0, 1)
        ch[: len(tt)] += (osc(N(f2) + 0 * tt) * e * 0.5 + 0.35 * osc(N(f2) * 7.0 + 0 * tt) * np.exp(-tt * 14) * 0.5)
    m.add(LAND, verb(lp(ch, 2500), 2.4, 0.45), 0.2)
    return m.out()


def D6():  # stutter: the landing chord is already playing but chopped up, its chops slowing with the wave and sweeping right; then whole
    m = Mix(); t = T(LAND)
    ch = sum(epiano(N(f), LAND + 0.1)[: len(t)] for f in [57, 60, 64, 67, 71])
    rate = 16 - 11 * np.clip(t / LAND, 0, 1)  # chops per second
    gate = (np.sin(2 * np.pi * np.cumsum(rate) / SR) > 0.1).astype(float)
    gate = lp(gate, 300)
    m.addp(0, hp(ch, 200) * gate * np.clip(t / 0.15, 0, 1), 0.28, roll_pan(len(t)))
    for k in range(6): m.add(0.03 + k * LAND / 6, hat(), 0.18, pan=-0.8 + k * 0.28)
    full = np.zeros(int(2.8 * SR))
    for f in [57, 60, 64, 67, 71, 74]: full[: int(2.6 * SR)] += epiano(N(f), 2.6)
    m.add(LAND, verb(full, 1.6, 0.3), 0.2)
    m.add(LAND, note(N(45), 2.3, 'sine', a=0.005, dec=1.0, s=0.3, r=1.0), 0.45); m.add(LAND, kick(), 0.5)
    return m.out()


def D7():  # air: a breathy whoosh that travels left to right with the wave, a deep plucked bass note as it lands, a soft pad
    m = Mix(); t = T(LAND + 0.4); k = np.clip(t / LAND, 0, 1)
    whoosh = lpv(hp(rng.uniform(-1, 1, len(t)), 300), 500 + 4000 * np.sin(np.pi * k) ** 1.5) * np.sin(np.pi * np.clip(t / (LAND + 0.4), 0, 1)) ** 1.2
    m.addp(0, whoosh, 0.35, roll_pan(len(t)))
    pl = pluck_ks(N(33), 3.0)
    m.add(LAND, lp(pl, 1500), 0.8)
    pad = np.zeros(int(2.8 * SR))
    for f in [57, 64, 67, 71, 76]: pad[: int(2.7 * SR)] += note(N(f), 2.7, 'sine', a=0.3, dec=1.5, s=0.6, r=1.2, vib=0.003)
    m.add(LAND - 0.1, verb(pad, 2.0, 0.4), 0.09)
    m.add(LAND + 0.15, note(N(88), 1.2, 'sine', dec=0.5, s=0, r=0.6), 0.06, pan=0.3)
    return m.out()


def pluck_ks(f, d):  # a plucked string (Karplus-Strong)
    n, per = int(d * SR), int(SR / f)
    buf = np.random.default_rng(3).uniform(-1, 1, per); out = np.empty(n)
    for i in range(n):
        out[i] = buf[i % per]; buf[i % per] = 0.5 * (buf[i % per] + buf[(i + 1) % per]) * 0.998
    return out


for name in WANT:
    x = globals()[name]()
    raw = OUT / f'{PRE.name}-{name}-raw.wav'
    wav = OUT / f'{PRE.name}-{name}.wav'
    with wave.open(str(raw), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x.T, -1, 1) * 32767).astype(np.int16).tobytes())
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(raw), '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11', '-ar', '44100', str(wav)], check=True)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-framerate', '30', '-i', str(FR / '%04d.png'), '-i', str(wav),
                    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', f'{PRE}-{name}.mp4'], check=True)
    print(PRE.name, name, 'done')
