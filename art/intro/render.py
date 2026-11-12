# Renders the Idle Looping Studios intro options: frames from intro.js in Chromium, a synthesized sound for each, muxed to mp4.
# usage: python3 -I render.py OUTDIR LOGODIR [A B C D.pop ...]   (LOGODIR: wave.json, text.png, and optionally logo.json + art.png;
#   D.<style> sets D's text entrance: still, wipe, pop, rubber, spread. Frames go to OUTDIR/frames-<spec>; D's sounds come from sounds_d.py)
import asyncio, base64, json, math, pathlib, subprocess, sys, wave
import numpy as np
from playwright.async_api import async_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = pathlib.Path(sys.argv[1]).resolve()
LOGO = pathlib.Path(sys.argv[2]).resolve()
OPTS = sys.argv[3:] or list('ABCDE')
FPS, SR = 30, 44100
OUT.mkdir(parents=True, exist_ok=True)


def env(n, a, d):
    e = np.ones(n)
    na, nd = int(a * SR), int(d * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nd: e[-nd:] *= np.linspace(1, 0, nd)
    return e


def tone(f, dur, kind='sine', vol=0.3, f1=None, a=0.005, d=None):
    n = int(dur * SR)
    t = np.arange(n) / SR
    fr = np.full(n, f) if f1 is None else f * (f1 / f) ** (t / dur)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    w = {'sine': np.sin(ph), 'tri': 2 / np.pi * np.arcsin(np.sin(ph)), 'sq': np.sign(np.sin(ph)) * 0.6}[kind]
    return w * vol * env(n, a, d if d is not None else dur * 0.9) * np.exp(-t * 1.5)


def pluck(f, dur, vol=0.4):
    n, p = int(dur * SR), int(SR / f)
    buf = np.random.default_rng(1).uniform(-1, 1, p)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    return out * vol


def noise(dur, vol=0.2, lp=0.2, seed=2):
    n = int(dur * SR)
    x = np.random.default_rng(seed).uniform(-1, 1, n)
    y = np.zeros(n)
    acc = 0
    for i in range(n):
        acc += lp * (x[i] - acc)
        y[i] = acc
    return y * vol


def mix(track, at, sig):
    i = int(at * SR)
    j = min(len(track), i + len(sig))
    track[i:j] += sig[: j - i]


def chord(at, track, notes, dur=2.2, vol=0.08, kind='tri'):
    for f in notes: mix(track, at, tone(f, dur, kind, vol, a=0.08, d=1.4))


E2, A2, C3, E3, G3, A3, B3, C4, D4, E4, G4, A4, B4, C5, E5, G5, A5 = 82.4, 110, 130.8, 164.8, 196, 220, 246.9, 261.6, 293.7, 329.6, 392, 440, 493.9, 523.3, 659.3, 784, 880
Am9 = [A2, E3, G3, B3, C4, E4]


def sound(opt, length):
    tr = np.zeros(int((length + 0.5) * SR))
    if opt == 'A':  # a plucked bass string, ringing, then the chord swells in; a bell with the name
        mix(tr, 0.35, pluck(A2, 3.0, 0.55))
        mix(tr, 0.36, pluck(A3, 2.5, 0.25))
        chord(2.5, tr, Am9, 2.6, 0.05)
        mix(tr, 3.3, tone(E5, 1.6, 'sine', 0.12, a=0.002)); mix(tr, 3.3, tone(A5 * 2, 1.0, 'sine', 0.03, a=0.002))
    elif opt == 'B':  # a jittery voice-like bleep that tunes in to one clean note; clicks as the letters type
        t = np.arange(int(2.1 * SR)) / SR
        f = 300 + 180 * np.sin(t * 19) + 120 * np.sin(t * 31 + 1) + 90 * np.sin(t * 7.3)
        v = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.08 * env(len(t), 0.2, 0.15)
        mix(tr, 0.0, v + noise(2.1, 0.06, 0.5) * env(len(t), 0.2, 0.1))
        mix(tr, 2.0, tone(380, 0.5, 'sine', 0.14, f1=A4, a=0.01, d=0.2))
        mix(tr, 2.45, tone(A4, 1.8, 'sine', 0.1, a=0.01, d=1.2))
        for k in range(12): mix(tr, 3.0 + k * 0.1, noise(0.02, 0.35, 0.9, seed=k) * env(int(0.02 * SR), 0, 0.015))
        chord(4.3, tr, [A3, C4, E4, G4], 1.5, 0.05, 'sine')
    elif opt == 'C':  # a rubbery boing that stretches up as it stretches out, a snap, wobbles; a soft thud as the name drops
        mix(tr, 0.2, tone(90, 1.4, 'sine', 0.22, f1=420, a=0.02, d=0.3))
        t = np.arange(int(1.2 * SR)) / SR
        f = 330 * (1 + 0.12 * np.sin(t * 2 * np.pi * 9) * np.exp(-t * 2.5)) * (220 / 330) ** t
        mix(tr, 1.9, np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.2 * np.exp(-t * 2.2))
        mix(tr, 1.9, noise(0.04, 0.5, 0.9, 5))
        mix(tr, 3.25, tone(70, 0.4, 'sine', 0.4, f1=45, a=0.002, d=0.3))
        chord(3.3, tr, [A3, C4, E4, G4, B4], 1.8, 0.04, 'sine')
    elif opt == 'D':  # a little looping arpeggio at 84 BPM that lands on a held chord; a shimmer with studios
        beat = 60 / 84 / 2
        seq = [A3, E4, G4, C5, B4, G4, E4, B3]
        for k in range(7): mix(tr, 0.2 + k * beat, tone(seq[k % 8], 0.5, 'tri', 0.09, a=0.004, d=0.4))
        chord(3.0, tr, Am9, 2.4, 0.05)
        for k in range(6): mix(tr, 3.5 + k * 0.07, tone([E5, G5, A5, C5 * 2, E5 * 2, G5 * 2][k], 0.6, 'sine', 0.03, a=0.002, d=0.5))
    elif opt == 'E':  # a pen scratching on, a rising whoop as it inflates, a jelly wobble, a chime
        mix(tr, 0.15, noise(1.6, 0.12, 0.35, 7) * (0.6 + 0.4 * np.sin(np.arange(int(1.6 * SR)) / SR * 2 * np.pi * 6)))
        mix(tr, 2.0, tone(200, 0.6, 'sine', 0.18, f1=600, a=0.02, d=0.2))
        t = np.arange(int(0.9 * SR)) / SR
        mix(tr, 2.55, np.sin(2 * np.pi * np.cumsum(330 * (1 + 0.05 * np.sin(t * 2 * np.pi * 12))) / SR) * 0.1 * np.exp(-t * 3))
        mix(tr, 3.1, tone(C5, 1.4, 'sine', 0.1, a=0.002)); mix(tr, 3.1, tone(G5, 1.2, 'sine', 0.06, a=0.002))
        chord(3.15, tr, [C3, G3, E4, A4], 1.8, 0.04, 'sine')
    tr = np.tanh(tr * 1.4) * 0.8
    return tr


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        await pg.set_content('<canvas id=c width=1280 height=720></canvas>')
        await pg.add_script_tag(path=str(HERE / 'intro.js'))
        wave_json = (LOGO / 'wave.json').read_text()
        cfg = (LOGO / 'logo.json').read_text() if (LOGO / 'logo.json').exists() else 'null'
        img = lambda n: base64.b64encode((LOGO / n).read_bytes()).decode() if (LOGO / n).exists() else ''
        await pg.evaluate("""([w, c, b, a, rl]) => new Promise(r => { WAVE = JSON.parse(w); useLogo(JSON.parse(c)); ROLL = JSON.parse(rl); TEXT = new Image();
          TEXT.onload = () => { if (!a) return r(); ART = new Image(); ART.onload = r; ART.src = 'data:image/png;base64,' + a; };
          TEXT.src = 'data:image/png;base64,' + b; })""", [wave_json, cfg, img('text.png'), img('art.png'), (LOGO / 'roll.json').read_text() if (LOGO / 'roll.json').exists() else 'null'])
        for spec in OPTS:
            opt, _, style = spec.partition('.')
            await pg.evaluate(f"DSTYLE = '{style or 'still'}'")
            length = await pg.evaluate(f"OPTS['{opt}'].len") + 1.0  # plus a held second
            fd = OUT / f'frames-{spec}'
            fd.mkdir(exist_ok=True)
            for i in range(int(length * FPS)):
                data = await pg.evaluate(f"(() => {{ const c = document.getElementById('c'); draw(c.getContext('2d'), '{opt}', {i / FPS}); return c.toDataURL('image/png'); }})()")
                (fd / f'{i:04d}.png').write_bytes(base64.b64decode(data.split(',')[1]))
            if opt == 'D':
                print(spec, 'frames done'); continue
            snd = sound(opt, length)
            with wave.open(str(OUT / f'{opt}.wav'), 'wb') as wv:
                wv.setnchannels(1); wv.setsampwidth(2); wv.setframerate(SR)
                wv.writeframes((np.clip(snd, -1, 1) * 32767).astype(np.int16).tobytes())
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(OUT / f'{opt}.wav'), '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11', '-ar', '44100', str(OUT / f'{opt}-n.wav')], check=True)
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-framerate', str(FPS), '-i', str(fd / '%04d.png'), '-i', str(OUT / f'{opt}-n.wav'), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-shortest', str(OUT / f'{opt}.mp4')], check=True)
            print(opt, 'done')
        await b.close()

asyncio.run(main())
