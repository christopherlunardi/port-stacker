# Port Stacker Deluxe

A container-stacking arcade game by Idle Looping Studios. One HTML page; plays in a browser, on a phone, and on Android handhelds through the
launcher in `android/` (it downloads the newest build from `dist/` and plays the last one it has when offline).

- Play on a Retroid / Android: install https://github.com/christopherlunardi/port-stacker/releases/download/launcher/PortStacker.apk once.
- Build: `python3 -I game/src/assemble.py` · test: `node game/tools/fasttest.js game/stack-style.html` · release: `python3 -I game/tools/release.py`
