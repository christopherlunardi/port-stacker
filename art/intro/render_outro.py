# Workshop videos of ways of finishing the intro (Chris 2026-11-10: it never went to black before the title): the end of the intro,
# the finish, a moment of black, then the game's real title screen coming up, at 640x480 (a 4:3 game screen, the intro letterboxed in
# it as the game shows it). usage: python3 -I render_outro.py OUTDIR TITLE.mp4 SOUND.wav [fade tv scatter roll]
#   TITLE.mp4: the title's first seconds, from game/tools/capture_clip.py (with its .cues.json); SOUND.wav: the intro's sound (sub glide)
import asyncio, base64, pathlib, subprocess, sys
from playwright.async_api import async_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT, TITLE, SND = pathlib.Path(sys.argv[1]).resolve(), pathlib.Path(sys.argv[2]).resolve(), pathlib.Path(sys.argv[3]).resolve()
NAMES = sys.argv[4:] or ['fade', 'tv', 'scatter', 'roll']
FPS, FROM, BLACK = 30, 2.6, 0.3
OUT.mkdir(parents=True, exist_ok=True)
LOGO = HERE / 'logo2'


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        await pg.set_content('<canvas id=c width=1280 height=720></canvas>')
        await pg.add_script_tag(path=str(HERE / 'intro.js'))
        img = lambda n: base64.b64encode((LOGO / n).read_bytes()).decode()
        await pg.evaluate("""([w, c, b, a, rl]) => new Promise(r => { WAVE = JSON.parse(w); useLogo(JSON.parse(c)); ROLL = JSON.parse(rl); DSTYLE = 'scatter';
          TEXT = new Image(); TEXT.onload = () => { ART = new Image(); ART.onload = r; ART.src = 'data:image/png;base64,' + a; }; TEXT.src = 'data:image/png;base64,' + b; })""",
                          [(LOGO / 'wave.json').read_text(), (LOGO / 'logo.json').read_text(), img('text.png'), img('art.png'), (LOGO / 'roll.json').read_text()])
        end = await pg.evaluate("OPTS.D.len + 1.0")
        for name in NAMES:
            fd = OUT / f'frames-{name}'
            fd.mkdir(exist_ok=True)
            dur = await pg.evaluate(f"OUTROS['{name}'].dur")
            n0, n1, n2 = round((end - FROM) * FPS), round(dur * FPS), round(BLACK * FPS)
            for i in range(n0 + n1 + n2):
                js = (f"draw(c.getContext('2d'), 'D', {FROM + i / FPS})" if i < n0 else
                      f"drawOutro(c.getContext('2d'), '{name}', {(i - n0) / FPS})" if i < n0 + n1 else
                      "(() => { const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 1280, 720); })()")
                data = await pg.evaluate(f"(() => {{ const c = document.getElementById('c'); {js}; return c.toDataURL('image/png'); }})()")
                (fd / f'{i:04d}.png').write_bytes(base64.b64decode(data.split(',')[1]))
            secs = (n0 + n1 + n2) / FPS
            part = OUT / f'{name}-intro.mp4'
            # the intro part: letterboxed into a 4:3 screen, with its sound from FROM on
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-framerate', str(FPS), '-i', str(fd / '%04d.png'), '-ss', str(FROM), '-i', str(SND),
                            '-filter_complex', f'[0:v]scale=640:360,pad=640:480:0:60:black,format=yuv420p[v];[1:a]apad,atrim=0:{secs},aresample=44100,aformat=channel_layouts=stereo[a]',
                            '-map', '[v]', '-map', '[a]', '-r', str(FPS), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-c:a', 'aac', '-b:a', '160k', '-t', str(secs), str(part)], check=True)
            # then the title, coming up from black as the game shows it (the intro's layer fades away over it)
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(part), '-i', str(TITLE),
                            '-filter_complex', f'[1:v]scale=640:480,fps={FPS},fade=t=in:st=0:d=0.35,format=yuv420p[tv];[1:a]aresample=44100,aformat=channel_layouts=stereo[ta];[0:v][0:a][tv][ta]concat=n=2:v=1:a=1[v][a]',
                            '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', str(OUT / f'{name}.mp4')], check=True)
            print(name, 'done')
        await b.close()

asyncio.run(main())
