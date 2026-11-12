# Port Stacker Deluxe (repo: port-stacker)

Chris's container-stacking arcade game (Idle Looping Studios): Buck loads shipping containers onto a ship while the dock's troublemakers
chase him. One HTML page. Played three ways, all from the same build:
- the artifact link on his phone (on-screen d-pad, A/B, Select/Start, like Hereafter Man),
- in a browser with keys or any controller,
- on his Retroid Pocket 2S (640x480) and Pocket 6 (1920x1080, and 4K out over USB-C) through the launcher app in `android/`.

Hereafter Man is a separate project (christopherlunardi/Hereafter-Man-Claude-1). Never change anything in it while working on this game.

Read first: `docs/project-notes.md` (rules, decisions and what Chris asked for) and the workflow in `.claude/skills/stack-style-dev/SKILL.md`.

Originality: the game's names, characters, art, music, stages and code are all our own. Never copy another game's levels, art, sounds,
characters or names, and never name other games in the code, docs, store text or commit messages. The repo is public.

## Layout
- `game/src/js/NN-area.js` joined in name order by `game/src/assemble.py` into `game/stack-style.html`; `game/src/shell.html` is the page and controls.
- `game/src/build.txt` the build number; `game/tools/release.py` bumps it and copies the build to `dist/` with `dist/version.json`.
- `dist/` is what the Retroid launcher downloads from GitHub (main). Only release.py writes it.
- `game/tools/fasttest.js` fast tests; `game/tools/shots.py` screenshots on every target screen.
- `android/` the launcher (Java, no libraries); `.github/workflows/android.yml` builds it onto the `launcher` release.
- `game/workshop/`: the Workshop's source, with every round's pictures in img/ (copied over from the old repo on 2026-11-11, minus the
  clips' .cues.json files). Play copies (play/) aren't kept in git: the old rounds' copies are only on the published Workshop artifact
  (they were old builds), and a republish keeps them there.

- How to Play and the Encyclopedia (title menu, `game/src/js/09b-howto.js`) must always match the game: any change to a mechanic, number, control or enemy updates its Encyclopedia topic (HOWTO) text and demo in the same build, and How to Play's short cards (BASICS) when it touches the basics; How to Play stays short and simple, the detail goes in the Encyclopedia (Chris 2026-11-11) (see the skill).
