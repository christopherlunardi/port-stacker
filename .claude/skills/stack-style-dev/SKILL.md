---
name: stack-style-dev
description: Work on Port Stacker Deluxe (repo port-stacker, formerly stack-style), Chris's container-stacking arcade game: change it, test it on every screen, release it to the phone link and the Retroid launcher, sync the PC folder. Not for Hereafter Man.
---

# Port Stacker Deluxe dev loop (repo: port-stacker)

Chris's container-stacking arcade game (Idle Looping Studios). One HTML page, played from the artifact
link on his phone and through the launcher app on his Retroid Pocket 2S and Pocket 6. This is the workflow as it runs today: when we change
how something gets done, change this skill (propose it again as an improvement) and the copy in the repo (`.claude/skills/stack-style-dev/SKILL.md`) in the same batch.

Never touch Hereafter Man (christopherlunardi/Hereafter-Man-Claude-1) while doing this. It's only a reference for how things were done there.

Everything is our own: never copy another game's levels, art, sounds, characters or names, and never name other games in the code,
docs, Workshop text, store text or commit messages (the repo is public). release.py refuses a build that does.

## Where things live
- Repo: github.com/christopherlunardi/port-stacker (public), cloned at `/home/claude/port-stacker`. If it's missing, attach it with add_repo
  (owner `christopherlunardi`, repo `port-stacker`, access push) and clone. The old repo christopherlunardi/stack-style is retired: never work there. Read `CLAUDE.md` and `docs/project-notes.md` first.
- Game source: `game/src/js/` one file per area, joined in name order by `game/src/assemble.py`: `00-setup`, `02-audio`, `02b-art`
  (generated), `02c-music`, `03-input`, `04-levels`, `05-world` (moving on floors and ladders), `06-pieces`, `07-enemies`, `08-player`,
  `09-game` (states, scoring, pause menu, title timing), `10-render` (inks, drawing helpers, the frame), `10a-stage` (catwalks, ladders,
  doors, backdrop, mist, water, containers and lamps), `10b-ship`, `10c-harbor` (backdrop layers, crane hook, clouds), `10d-ui` (font
  helpers, rope frames, ribbons), `10d1-font-data` (Bungee, data only), `10e-menus` (cards, menus, boards), `10f-night` (World 2's night),
  `10g-actors` (crab, Pratt, Buck, death, horn blast), `10h-hud` (score bar, side panels, info), `10i-title` (title scene, logo, splash),
  `12-dev`, `13-main` (screen fitting, loop), `14-telemetry`. New areas get their own numbered file. Page and controls: `game/src/shell.html`.
- Code style (cleanup 2026-11-08): formatted with Prettier (`.prettierrc.json`: width 140, single quotes; `.prettierignore` skips the
  generated art and font data). After editing, format: `npx prettier@3.3.3 --write "game/src/js/*.js"`. Functions are plain definitions
  (no `name = function` overrides; Workshop option scripts are the only place that reassigns). Comments: put `//` comments on their own
  line or at the very end of a statement; a `//` in the middle of a long line has swallowed code more than once (use `/* */` there).
- HOW TO PLAY (title menu, game/src/js/09b-howto.js; Chris 2026-11-08): whenever a mechanic, a number (points, timings, counts), a
  control or an enemy changes or is added, update its topic's text (and its scripted demo, which runs the real engine) in the same
  build, and add a topic for anything new. The fast test 'howto' runs every demo and checks it shows what its card says (expect); run
  screens.py to see the card fits. Never ship a mechanic change with How to Play describing the old one.
- Refactors must not change the game: before, record `screens.py` at 640x480 960x540 390x293 and the fast-test output; after, they must
  match pixel for pixel and line for line (both are deterministic; the music's drums use random noise, so compare songs with a tolerance).
- Published game (phone link): https://claude.ai/artifact/LeptoCL8SHYE71QHPVt2kG, built from `dist/stack-style.html`. It has `capabilities` `{user:{}}`
  (dev mode asks claude.ai who the owner is); leave `capabilities` out on republish so it keeps it.
- Retroid launcher: `android/` (Java, no libraries). GitHub builds it (`.github/workflows/android.yml`) onto the `launcher` release:
  https://github.com/christopherlunardi/port-stacker/releases/download/launcher/PortStacker.apk. Game updates reach the handhelds through
  `dist/` on main, not through a new APK.
- Owner's PC: `C:\Users\Chris\Desktop\Claude\Gameslop\Stack-Style\` mirrors the repo. Write changed files back with device_commit_files
  (SendUserFile first, pass its fileUuid) when the computer is reachable.

## Every change
1. Edit the right file in `game/src/js/` with small exact replacements. Never put a `//` comment mid-line with code after it; use `/* */`.
   Run `node --check` on the file after every edit.
2. Build: `python3 -I game/src/assemble.py`.
3. Fast tests, every time (seconds): `node game/tools/fasttest.js game/stack-style.html`. levels (every stage's lists make sense, every floor
   reachable), bot (a bot walks the real movement code and clears every stage), soak (5 minutes of random play per stage with enemies),
   death (lives, game over, back to title), text (no undefined/NaN in popups or menus). A new stage must pass levels and bot.
4. Look at it on every target screen: `python3 -I game/tools/shots.py game/stack-style.html <scratch>/shots ["js to set up the shot"]`
   (rp2s 640x480, rp6 1080p, tv4k, phone, phoneland, desktop; fails on any page error). Read the pictures; check at game size.
4b. Old-WebView check, every release: `python3 -I game/tools/oldwebview.py game/stack-style.html` (the Retroid 2S's WebView lacks newer canvas
   features such as roundRect; it plays title, start, stage card, pause, INFO, board, initials with them removed and fails on any error).
   New canvas features need a fallback in 00-setup.js.
5. Release: `python3 -I game/tools/release.py` (bumps the build, builds, and writes a squashed copy to `dist/` with `version.json`: comments stripped, code minified, nothing mentioning Chris; it fails if anything does). Run the fast tests and oldwebview.py on `dist/stack-style.html`.
6. Publish the artifact (`file_path` `dist/stack-style.html`), commit (with `web/`) with the attribution lines, `git push`. The push is what the Retroids
   pick up: the launcher app on next launch (or pause menu → CHECK FOR UPDATE), the web app at its next title screen once Pages has deployed.
7. If `android/` changed: check the Actions run (`curl -s https://api.github.com/repos/christopherlunardi/port-stacker/actions/runs?per_page=3`),
   and tell Chris to reinstall the APK from the link above. Otherwise he doesn't need to touch anything.
8. Copy changed files to the PC folder when the computer is connected.
9. Reply with a short summary of what changed and the build number. Leave out the link and the steps you took.

## Web app for the Retroids (2026-11-12)
- The Retroids are moving from the Android launcher to an installed web app: https://christopherlunardi.github.io/port-stacker/
  (GitHub Pages, source "GitHub Actions"). It's for the Retroids only; the phone link stays the main game. Keep the Android app and
  `android/` working until Chris says to retire it.
- `release.py` ends by running `game/tools/web.py`, which builds `web/` from `dist/stack-style.html`: index.html (adds the manifest
  link, icons and the `body.pwa` CSS), manifest.webmanifest (fullscreen, landscape), pwa.js, sw.js (cache `portstacker-<build>`),
  icons/, version.json, .nojekyll. Commit `web/` with the release; the push to main runs `.github/workflows/pages.yml`, which deploys it.
- PWA code lives only in `game/tools/web.py` and `game/tools/web/` (pwa.js, sw.js). The page gets the `pwa` class only when it runs
  installed (display-mode fullscreen/standalone): no on-screen pad, the screen fills the window. In a normal tab nothing changes.
- Test it before pushing: `python3 -I game/tools/webtest.py` (manifest, service worker, offline boot with sound, update swap, screenshots
  as installed app and as a normal tab).
- Updates: the installed app checks at start and every 15 minutes; a new build downloads in the background and swaps in (page reload)
  only when the game is on the title screen, never mid-game.
- Retroid install (with adb from Chris's PC: `%LOCALAPPDATA%\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe`):
  1. Ask Chris to set Settings > Apps > Default apps > Home app to Quickstep (never change device settings yourself).
  2. Force-stop Chrome, open the site in Chrome.
  3. ⋮ menu > "Install and create shortcut" > Install > Install.
  4. Check `adb shell pm list packages | grep webapk` shows a new org.chromium.webapk... package.
  5. Ask Chris to set Home back to Daijisho.
- On the device: never press Esc/Back over adb to pause (Android closes the app); use Start or the game's buttons. Frame check:
  `dumpsys gfxinfo <package> reset`, play ~15 s, `dumpsys gfxinfo <package>`. Chris tests offline himself.

## Engine facts that matter
- The field is 384x288 game pixels (48x33 tiles of 8px under a 22px score bar; zoomed out from 320x240 on 2026-11-07). Screens laid out
  for the old 320x240 field (title, cards, menus, boards) draw through `oldField()` / TK = PH/240. `fitLayout()` scales to fit; leftover room
  becomes side panels (`drawPanels`).
- Game time runs in `update()` at a fixed 60 steps a second; `render()` once per screen refresh (the Pocket 6 is 120Hz). Anything that
  moves or counts belongs in update, never in drawing code.
- Everyone moves one whole pixel at a time (`.acc` collects speed). y is the feet, x the middle; a ladder's x is its column's middle.
  `canStep`, `ladderAt`, `stepPlayer` (the 5px snap) live in 05-world. Floor rows are at `FY + r*8`.
- Stages are lists in `04-levels` (floors, ladders, pieces, plates, start, spawns, enemies). Pieces sit on floors covering all 4 columns,
  every piece column has a plate on row 26, ladders end on floors and never run through a piece. The fast tests enforce all of it.
- Input: `keys`/`pressed` for up down left right a b start select, from keys, Gamepad API, the on-screen pad, and `ssKey()` from the launcher.
  Every menu must work with buttons only (the Retroid has no touch use in-game).
- Audio is all synthesized (`tone`, `noise` in 02-audio), unlocked on the first press.
- Dev mode (12-dev): owner check, file://, the code, or DOWN DOWN UP UP RIGHT LEFT RIGHT LEFT B A. Add new cheats to `DEV_ACTIONS` (they
  show in the DEV panel and in the pause menu). Keep it hidden from anyone else.
- The launcher talks to the page through `window.StackNative` (status, checkUpdate, reload, quit) and calls `ssInApp()`, `ssKey()`,
  `ssUpdateReady(n)`. Keep those names.

## Drawn art (2026-11-06): ChatGPT draws, the game prints
- Style: flat cartoon art like Chris's "Port Stacker Deluxe" concept (riso pink/blue/yellow look). ChatGPT makes model sheets and walk
  cycles; prompts always carry the strict rules block (flat colours, ~10px indigo #2A1B7A outline, the 9-colour palette, pure #00FF00
  background, 1792x1024, no text). Give Chris the WHOLE prompt every time, never "change this line". He attaches the concept image (style)
  and, for new poses, the character's own model sheet (identity).
- No copies of known characters: if a result reads as a famous character, don't use it; write a new original design prompt.
- Cast so far: Buck (hero: bearded, hard hat with pink stripe, orange hi-vis jacket, tool belt), Inspector Pratt (chaser: captain's hat,
  handlebar mustache, monocle, pink coat, clipboard), Pinch (crab, catwalk guard that winds up and charges: one giant claw, barnacles,
  yellow rope bandana), 4 containers, the harbor backdrop. Walk cycles: Buck and Pratt 4 frames; Pinch mirrors one pose.
- Pipeline: save the upload to art/incoming/, then `python3 -I art/tools/cutout.py SHEET art/<set> name1,name2,...` (keys out green,
  snaps to the palette, splits figures), add the set to SETS in art/tools/inkpack.py (field height, reference pose; ANCHOR_TOP for walk
  cycles so frames line up on the head), run `python3 -I art/tools/inkpack.py` (writes game/src/js/02b-art.js), build, test, shoot.
  Check a walk with a looping GIF lined up the same way before releasing.
- Rendering: 10-render draws on a smooth plate canvas in field units (384x288 logic, art at 6x); 13-main's shader prints it (halftone,
  misregistration, grain). The backdrop is printed at half ink (BG_INK) with drifting mist (MIST) between it and the stage layer.

## Workshop (options Chris looks at, hears and plays) (2026-11-07)
- When Chris asks for options for anything, they go on the Workshop: https://claude.ai/artifact/SSrsFgjxpFWsgw7cxDZZAC, built from
  game/workshop/ (index.html + workshop.json + img/<topic>-<round>/ + play/<topic>-<round>-<id>.html). Never Hereafter Man's workshop.
  Rounds from before the move to port-stacker (2026-11-11) keep their img/ and play/ files only on the published artifact.
- A round in workshop.json: question, found, status open|decided (+chosen), options with any of: images [{src,label}] (several labels
  = view tabs, e.g. Retroid 2S / Pocket 6 / Close-up), audio (mp3), play (a playable copy of the game with that option).
- Make them: art in the game -> option JS (replaces draw functions) + `python3 -I game/workshop/render_option.py OPT.js img/<t>-<r>/<id>`;
  music -> option JS setting `RAG = {...}` (02c-music.js explains the song format, voices, bass styles, drums, ' !' stop-time) +
  `python3 -I game/tools/render_music.py img/<t>-<r>/<id>.mp3 OPT.js`; logo/style sketches -> game/workshop/logo-r1 (mock.html +
  render.py with @fontsource OFL fonts installed by npm). Playable copy: the built game with the option JS injected after the first
  </script>, wrapped in <!doctype html><html><head>charset+viewport</head><body>...</body></html> (supporting pages aren't wrapped).
- Layout check: `python3 -I game/tools/screens.py PAGE OUT 640x480 960x540` (every screen, contact sheet per size). Screens laid out
  for 320x240 draw through oldField()/TK; the field is 384x288.
- Moving options (animations): record with `python3 -I game/tools/capture_clip.py PAGE.html OUT.mp4 "setup js" [secs] [x y w h] [fps]`
  (steps the game frame by frame, so clips play at true speed; live capture came out sped up). The Workshop shows .mp4 like images.
- Recording songs: the recorders mute the game's SFX (the title intro plays its own).
- Publish index.html with `root` game/workshop and a files map of everything new (unchanged files are kept). Capabilities: db rule
  feedback read/write owner, plus user; omit on republish.
- Read his answers: ArtifactData list on the Workshop, collection `feedback`, doc `<topic>-<round>` {pick, notes{id:text}, general,
  submitted}. Act on submitted ones; then mark the round decided (chosen) in workshop.json and republish.

## Play log
- Before tuning difficulty or chasing a bug, read the play log: ArtifactData list on the phone link, collection `telemetry`
  (errors with device/build, deaths by enemy and stage, stage times, game overs). The Retroid app posts its log to issue #1 on port-stacker
  once the PLAYLOG_TOKEN secret exists; until then it keeps it on the device.
- Publishing the phone link: keep its capabilities (user + db with the telemetry rule); omit `capabilities` on republish.

## Working with Chris
- He sends quick notes while you work. Fold them into the current batch, and don't publish a half-done batch.
- Keep replies short and plain: what changed, then one question if one is needed.
- He tests on the phone link and on the Retroids; when a fix is about the handheld, say whether it needs the APK reinstalled (almost never).
- Never type his passwords, never use OneDrive.
