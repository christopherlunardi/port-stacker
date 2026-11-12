'use strict';
// ---------- setup ----------
// Port Stacker Deluxe: a container-stacking arcade game. One HTML page; played in a browser, on a phone (the artifact link) and on the
// Retroid handhelds (the launcher app in android/ downloads the newest build and plays the last one it has when offline).
const BUILD = /*@BUILD*/ 0; // set by assemble.py; the launcher compares it with dist/version.json
const PW = 384,
  PH = 288,
  TK = PH / 240; // TK: screens laid out for the old 320x240 field (title, cards, menus, boards) draw at TK in their old coordinates           // the playfield in game pixels; the screen around it grows to fit any shape (10-render)
const T = 8,
  FY = 24,
  ROWS = 33,
  COLS = 48; // 8px tiles; the field starts under the 16px score band
const HEADLESS = typeof window === 'undefined' || !!window.__HEADLESS; // the fast tests run the game with no page
let _seed = 1234567;
function seed(s) {
  _seed = s | 0;
}
function rand() {
  _seed = (_seed + 0x6d2b79f5) | 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem('stackstyle.' + k);
      return v == null ? d : JSON.parse(v);
    } catch (e) {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem('stackstyle.' + k, JSON.stringify(v));
    } catch (e) {}
  }
};

// Older Android WebViews (the Retroid 2S, 2026-11-07) have no roundRect on canvases; the rope frames crashed starting a game. Draw it ourselves.
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    r = Array.isArray(r) ? r[0] : r || 0;
    r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.arcTo(x + w, y, x + w, y + r, r);
    this.lineTo(x + w, y + h - r);
    this.arcTo(x + w, y + h, x + w - r, y + h, r);
    this.lineTo(x + r, y + h);
    this.arcTo(x, y + h, x, y + h - r, r);
    this.lineTo(x, y + r);
    this.arcTo(x, y, x + r, y, r);
    this.closePath();
    return this;
  };
}
