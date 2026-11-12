package com.ghostjail.stackstyle;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.view.Display;
import android.os.Handler;
import android.os.Looper;
import android.view.InputDevice;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

// The Port Stacker Deluxe launcher for the Retroids. On start it asks GitHub for dist/version.json; if that build is newer than the one it has,
// it downloads dist/stack-style.html and keeps it. Then it plays the newest build it has: the downloaded one, or the one that came inside
// the app. Offline it just plays what it has. Coming back to the app checks again and tells the game a new build is ready (pause menu).
// Android's WebView doesn't hand game controllers to the page, so the buttons go straight to the game's ssKey() (03-input), as in Hereafter Man.
public class MainActivity extends Activity {
  static final String REPO = "christopherlunardi/port-stacker";
  static final String[] VERSION_URLS = { "https://api.github.com/repos/" + REPO + "/contents/dist/version.json?ref=main", "https://raw.githubusercontent.com/" + REPO + "/main/dist/version.json" };
  static final String APP_URL = "https://github.com/" + REPO + "/releases/download/launcher/"; // PortStacker.apk and launcher.json (its versionCode)
  volatile int appUpdate = 0;
  // the play log: the game hands events here (StackNative.log); they're posted in batches as a comment on the repo's "Play log" issue,
  // where Claude reads them. The key is put in by GitHub's build from a repo secret (PLAYLOG_TOKEN).
  // Offline (Chris 2026-11-08): every event is also kept in a file on the device (playlog.txt), so nothing is lost when there's no
  // network or the app is closed; whatever is waiting is posted the next time the app starts or comes back, oldest first.
  static final int LOG_MAX = 5000, POST_LINES = 250, POST_CHARS = 60000;
  final java.util.ArrayList<String> playlog = new java.util.ArrayList<>(); volatile boolean posting = false; volatile String logLast = "NOT SENT YET"; // shown in the pause menu's INFO
  File logFile() { return new File(getFilesDir(), "playlog.txt"); }
  void saveLog() { // called with playlog locked
    try (java.io.FileOutputStream o = new java.io.FileOutputStream(logFile())) { StringBuilder b = new StringBuilder(); for (String l : playlog) b.append(l).append('\n'); o.write(b.toString().getBytes(StandardCharsets.UTF_8)); } catch (Exception e) { }
  }
  void loadLog() {
    try { if (!logFile().exists()) return; String all = new String(readAll(new java.io.FileInputStream(logFile())), StandardCharsets.UTF_8);
      synchronized (playlog) { for (String l : all.split("\n")) if (!l.isEmpty()) playlog.add(l); while (playlog.size() > LOG_MAX) playlog.remove(0); } } catch (Exception e) { }
  }
  void flushLog(boolean now) {
    String key = getString(R.string.playlog_key), issue = getString(R.string.playlog_issue);
    if (key.isEmpty() || posting) return; final java.util.ArrayList<String> batch;
    synchronized (playlog) { if (playlog.isEmpty() || (!now && playlog.size() < 12)) return; batch = new java.util.ArrayList<>(); int chars = 0; for (String l : playlog) { if (batch.size() >= POST_LINES || (chars + l.length() > POST_CHARS && !batch.isEmpty())) break; batch.add(l.length() > POST_CHARS ? l.substring(0, POST_CHARS) : l); chars += l.length() + 1; } } // (2026-11-09) under GitHub's 65,536-character comment limit, or a long offline stretch would never send
    posting = true;
    new Thread(() -> {
      boolean ok = false;
      try {
        StringBuilder b = new StringBuilder("```\n"); for (String l : batch) b.append(l).append('\n'); b.append("```");
        String body = "{\"body\":" + jsonString(b.toString()) + "}";
        HttpURLConnection c = (HttpURLConnection) new URL("https://api.github.com/repos/" + REPO + "/issues/" + issue + "/comments").openConnection();
        c.setRequestMethod("POST"); c.setDoOutput(true); c.setConnectTimeout(10000); c.setReadTimeout(15000);
        c.setRequestProperty("Authorization", "Bearer " + key); c.setRequestProperty("Accept", "application/vnd.github+json"); c.setRequestProperty("User-Agent", "PortStackerApp");
        try (java.io.OutputStream o = c.getOutputStream()) { o.write(body.getBytes(StandardCharsets.UTF_8)); }
        int code = c.getResponseCode(); c.disconnect(); if (code >= 300) throw new Exception("HTTP " + code);
        ok = true; logLast = "SENT " + new java.text.SimpleDateFormat("HH:mm").format(new java.util.Date());
        synchronized (playlog) { for (int k = 0; k < batch.size() && !playlog.isEmpty(); k++) playlog.remove(0); saveLog(); } // posted: drop just those, keep anything newer
      } catch (Exception e) { logLast = String.valueOf(e.getMessage()).startsWith("HTTP") ? "REFUSED " + e.getMessage() : "OFFLINE"; } // offline or refused: they stay in the file for next time
      posting = false;
      if (ok) synchronized (playlog) { if (playlog.size() >= POST_LINES) ui.post(() -> flushLog(true)); } // more waiting from a long offline stretch
    }).start();
  }
  static String jsonString(String s) { StringBuilder o = new StringBuilder("\""); for (char ch : s.toCharArray()) { if (ch == '"' || ch == '\\') o.append('\\').append(ch); else if (ch == '\n') o.append("\\n"); else if (ch < 32) o.append(' '); else o.append(ch); } return o.append('"').toString(); }
  // sleep (Chris 2026-11-08): when the Retroid sleeps or you leave the app, freeze the page like a native game. The page sees itself
  // hidden (so the game drops into its pause menu), its sound is suspended, and every timer and frame stops until you come back. All of
  // it lives here in the launcher; the game itself doesn't know.
  static final String WATCH_AUDIO = "(function(){var A=window.AudioContext||window.webkitAudioContext;if(!A||A.__ss)return;window.__ssAC=[];"
    + "var W=function(o){var c=o?new A(o):new A();window.__ssAC.push(c);return c};W.prototype=A.prototype;W.__ss=1;window.AudioContext=W;window.webkitAudioContext=W})()";
  boolean asleep = false;
  void sleepPage() {
    if (asleep || web == null) return; asleep = true;
    web.evaluateJavascript("(window.__ssAC||[]).forEach(function(c){try{c.suspend()}catch(e){}})", r -> { if (asleep) { web.onPause(); web.pauseTimers(); } });
  }
  void wakePage() {
    if (!asleep || web == null) return; asleep = false;
    web.resumeTimers(); web.onResume();
    web.evaluateJavascript("(window.__ssAC||[]).forEach(function(c){try{c.resume()}catch(e){}})", null);
  }
  @Override protected void onPause() { super.onPause(); flushLog(true); sleepPage(); }
  static final String[] GAME_URLS = { "https://api.github.com/repos/" + REPO + "/contents/dist/stack-style.html?ref=main", "https://raw.githubusercontent.com/" + REPO + "/main/dist/stack-style.html" };
  WebView web; final Handler ui = new Handler(Looper.getMainLooper()); final boolean[] stick = new boolean[4];
  volatile String status = ""; volatile int playing = 0; volatile boolean checking = false;

  File cachedHtml() { return new File(getFilesDir(), "game.html"); }
  File cachedVer() { return new File(getFilesDir(), "build.txt"); }
  int bundledBuild() { try { return parseBuild(new String(readAll(getAssets().open("version.json")), StandardCharsets.UTF_8)); } catch (Exception e) { return 0; } }
  int cachedBuild() { try { if (!cachedHtml().exists()) return 0; return Integer.parseInt(new String(readAll(new java.io.FileInputStream(cachedVer())), StandardCharsets.UTF_8).trim()); } catch (Exception e) { return 0; } }
  int bestBuild() { return Math.max(bundledBuild(), cachedBuild()); }

  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    WindowManager.LayoutParams lp = getWindow().getAttributes();
    if (Build.VERSION.SDK_INT >= 28) lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES; // fill the whole panel, notch area too
    if (Build.VERSION.SDK_INT >= 23) { try { // ask for the screen's fastest refresh rate at full resolution (the Pocket 6 can do 120Hz)
      Display d = getWindowManager().getDefaultDisplay(); Display.Mode best = d.getMode();
      for (Display.Mode m : d.getSupportedModes()) if (m.getPhysicalWidth() == best.getPhysicalWidth() && m.getPhysicalHeight() == best.getPhysicalHeight() && m.getRefreshRate() > best.getRefreshRate()) best = m;
      lp.preferredDisplayModeId = best.getModeId(); } catch (Exception e) { } }
    getWindow().setAttributes(lp);
    web = new WebView(this);
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setDatabaseEnabled(true); s.setMediaPlaybackRequiresUserGesture(false);
    s.setAllowFileAccess(true); s.setCacheMode(WebSettings.LOAD_NO_CACHE); s.setUseWideViewPort(true); s.setLoadWithOverviewMode(true); s.setTextZoom(100); // the page's own viewport, no font scaling
    web.addJavascriptInterface(new Bridge(), "StackNative");
    web.setWebChromeClient(new WebChromeClient() { int shown = 0; // page errors pop up as a message, so a photo tells us what broke
      @Override public boolean onConsoleMessage(android.webkit.ConsoleMessage m) {
        if (m.messageLevel() == android.webkit.ConsoleMessage.MessageLevel.ERROR && shown++ < 4) android.widget.Toast.makeText(MainActivity.this, "Game error: " + m.message() + " @" + m.lineNumber(), android.widget.Toast.LENGTH_LONG).show();
        return true; } });
    web.setWebViewClient(new WebViewClient() { @Override public void onPageFinished(WebView v, String u) { v.evaluateJavascript(WATCH_AUDIO, null); v.evaluateJavascript("window.ssInApp&&ssInApp()", null); } });
    web.setBackgroundColor(0xff000000); web.setFocusable(false); web.setFocusableInTouchMode(false); // no focus to hop around: the buttons go straight to the game
    setContentView(web);
    web.loadData("<body style='background:#191315;color:#b19c88;font:16px monospace;display:flex;align-items:center;justify-content:center;height:90vh'>Checking for a new build...</body>", "text/html", "utf-8");
    immersive();
    loadLog(); // anything left from offline play goes up once the app is running
    new Thread(() -> { update(4000); ui.post(this::play); checkApp(); ui.postDelayed(() -> flushLog(true), 5000); }).start();
  }
  @Override protected void onResume() { super.onResume(); immersive(); wakePage(); flushLog(true);
    if (playing > 0) new Thread(this::checkApp).start(); // coming back also looks for a newer app, not only a fresh start (Chris 2026-11-08)
    if (playing > 0) new Thread(() -> { int got = update(6000); if (got > playing) ui.post(() -> web.evaluateJavascript("window.ssUpdateReady&&ssUpdateReady(" + got + ")", null)); }).start(); }
  @Override public void onWindowFocusChanged(boolean f) { super.onWindowFocusChanged(f); if (f) immersive(); }
  void immersive() { web.setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN); }

  void play() { // the newest build on the device
    if (cachedBuild() > bundledBuild()) { playing = cachedBuild(); web.loadUrl("file://" + cachedHtml().getAbsolutePath()); }
    else { playing = bundledBuild(); web.loadUrl("file:///android_asset/game.html"); }
  }
  // asks GitHub for the newest build and downloads it if it's newer than what we have; returns the best build now on the device
  synchronized int update(int timeout) {
    checking = true;
    try {
      int have = bestBuild(); String vj = null;
      for (String u : VERSION_URLS) { try { vj = new String(get(u, timeout), StandardCharsets.UTF_8); break; } catch (Exception e) { vj = null; } }
      if (vj == null) { status = "OFFLINE"; return have; }
      int remote = parseBuild(vj); String sha = field(vj, "sha256");
      if (remote <= have) { status = "UP TO DATE"; return have; }
      for (String u : GAME_URLS) {
        try {
          byte[] html = get(u, Math.max(timeout, 20000));
          if (sha != null && !sha.equals(hex(MessageDigest.getInstance("SHA-256").digest(html)))) continue; // half a download, or the wrong file
          File tmp = new File(getFilesDir(), "game.tmp"); try (FileOutputStream o = new FileOutputStream(tmp)) { o.write(html); }
          if (!tmp.renameTo(cachedHtml())) continue;
          try (FileOutputStream o = new FileOutputStream(cachedVer())) { o.write(String.valueOf(remote).getBytes(StandardCharsets.UTF_8)); }
          status = "UPDATED"; return remote;
        } catch (Exception e) { /* try the next address */ }
      }
      status = "UPDATE FAILED"; return have;
    } finally { checking = false; }
  }
  static byte[] get(String url, int timeout) throws Exception {
    HttpURLConnection c = (HttpURLConnection) new URL(url + (url.contains("?") ? "&" : "?") + "t=" + System.currentTimeMillis()).openConnection();
    c.setConnectTimeout(timeout); c.setReadTimeout(timeout); c.setUseCaches(false);
    c.setRequestProperty("User-Agent", "StackStyleLauncher"); c.setRequestProperty("Accept", "application/vnd.github.raw"); c.setRequestProperty("Cache-Control", "no-cache");
    try { if (c.getResponseCode() != 200) throw new Exception("HTTP " + c.getResponseCode()); return readAll(c.getInputStream()); } finally { c.disconnect(); }
  }
  static byte[] readAll(InputStream in) throws Exception { try (InputStream i = in) { ByteArrayOutputStream o = new ByteArrayOutputStream(); byte[] buf = new byte[16384]; int n; while ((n = i.read(buf)) > 0) o.write(buf, 0, n); return o.toByteArray(); } }
  static int parseBuild(String json) { String v = field(json, "build"); return v == null ? 0 : Integer.parseInt(v); }
  static String field(String json, String key) { // tiny reader for {"build": 12, "sha256": "..."}
    int i = json.indexOf("\"" + key + "\""); if (i < 0) return null; i = json.indexOf(':', i) + 1;
    while (i < json.length() && (json.charAt(i) == ' ' || json.charAt(i) == '"')) i++;
    int j = i; while (j < json.length() && "\",} \n\r".indexOf(json.charAt(j)) < 0) j++; return json.substring(i, j);
  }
  static String deviceName() { // a friendly name for the Retroids we know, else the maker and model Android reports
    String m = (Build.MANUFACTURER + " " + Build.MODEL).trim(), u = m.toUpperCase().replace(" ", "");
    if (u.contains("POCKET6") || u.contains("RP6")) return "RETROID POCKET 6";
    if (u.contains("POCKET2S") || u.contains("RP2S")) return "RETROID POCKET 2S";
    if (u.contains("RETROID")) return m.toUpperCase();
    return m.toUpperCase();
  }
  static String hex(byte[] b) { StringBuilder s = new StringBuilder(); for (byte x : b) s.append(String.format("%02x", x)); return s.toString(); }

  // the app updates itself: launcher.json on the release says the newest app's versionCode; if it's newer than ours, the game offers
  // UPDATE APP in the pause menu, which downloads PortStacker.apk and opens Android's installer (Android always asks for one tap)
  int myVersion() { try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode; } catch (Exception e) { return 0; } }
  void checkApp() {
    try { String j = new String(get(APP_URL + "launcher.json", 8000), StandardCharsets.UTF_8); String v = field(j, "versionCode");
      int n = v == null ? 0 : Integer.parseInt(v); if (n > myVersion()) { appUpdate = n; ui.postDelayed(() -> web.evaluateJavascript("window.ssAppUpdate&&ssAppUpdate(" + n + ")", null), 2500); }
    } catch (Exception e) { }
  }
  void installApp() {
    new Thread(() -> {
      try {
        ui.post(() -> android.widget.Toast.makeText(this, "Downloading the new app...", android.widget.Toast.LENGTH_SHORT).show());
        byte[] apk = get(APP_URL + "PortStacker.apk", 60000); File f = new File(getCacheDir(), "update.apk");
        try (FileOutputStream o = new FileOutputStream(f)) { o.write(apk); }
        ui.post(() -> {
          if (Build.VERSION.SDK_INT >= 26 && !getPackageManager().canRequestPackageInstalls()) { // first time: Android needs permission to install from this app
            android.widget.Toast.makeText(this, "Allow Port Stacker to install updates, then pick UPDATE APP again", android.widget.Toast.LENGTH_LONG).show();
            startActivity(new android.content.Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, android.net.Uri.parse("package:" + getPackageName()))); return; }
          android.content.Intent i = new android.content.Intent(android.content.Intent.ACTION_VIEW);
          i.setDataAndType(ApkProvider.uri(), "application/vnd.android.package-archive");
          i.addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION | android.content.Intent.FLAG_ACTIVITY_NEW_TASK); startActivity(i); });
      } catch (Exception e) { ui.post(() -> android.widget.Toast.makeText(this, "App update failed: " + e.getMessage(), android.widget.Toast.LENGTH_LONG).show()); }
    }).start();
  }

  // the game's pause menu and title screen talk to the launcher through this (09-game, 10-render)
  class Bridge {
    @JavascriptInterface public String logStatus() { int n; synchronized (playlog) { n = playlog.size(); } return (getString(R.string.playlog_key).isEmpty() ? "NO KEY" : logLast) + "  " + n + " WAITING"; }
    @JavascriptInterface public String status() { return "LAUNCHER " + (checking ? "CHECKING" : status); }
    @JavascriptInterface public String device() { return deviceName(); }
    @JavascriptInterface public String webview() { try { if (Build.VERSION.SDK_INT >= 26) { android.content.pm.PackageInfo p = WebView.getCurrentWebViewPackage(); if (p != null) return "WV" + p.versionName.split("\\.")[0]; } } catch (Exception e) { } return "WV?"; } // which handheld this is, for the title screen and per-device tweaks
    @JavascriptInterface public float refresh() { try { return getWindowManager().getDefaultDisplay().getRefreshRate(); } catch (Exception e) { return 60; } }
    @JavascriptInterface public void checkUpdate() { new Thread(() -> { int got = update(8000); ui.post(() -> web.evaluateJavascript(got > playing ? "window.ssUpdateReady&&ssUpdateReady(" + got + ")" : "G.banner={text:'NO NEWER BUILD (" + status + ")',t:180}", null)); }).start(); }
    @JavascriptInterface public void reload() { ui.post(MainActivity.this::play); }
    @JavascriptInterface public void quit() { ui.post(MainActivity.this::finish); }
    @JavascriptInterface public int appUpdate() { return appUpdate; }
    @JavascriptInterface public int appVersion() { return myVersion(); }
    @JavascriptInterface public void installApp() { MainActivity.this.installApp(); }
    @JavascriptInterface public void log(String json) { synchronized (playlog) { playlog.add(json.replace('\n', ' ')); while (playlog.size() > LOG_MAX) playlog.remove(0); saveLog(); } flushLog(json.contains("\"gameover\"") || json.contains("\"error\"")); }
  }

  // the buttons, straight into the game
  static String map(int code) {
    switch (code) {
      case KeyEvent.KEYCODE_DPAD_UP: return "up"; case KeyEvent.KEYCODE_DPAD_DOWN: return "down"; case KeyEvent.KEYCODE_DPAD_LEFT: return "left"; case KeyEvent.KEYCODE_DPAD_RIGHT: return "right";
      case KeyEvent.KEYCODE_BUTTON_A: case KeyEvent.KEYCODE_BUTTON_Y: case KeyEvent.KEYCODE_DPAD_CENTER: case KeyEvent.KEYCODE_ENTER: case KeyEvent.KEYCODE_Z: return "a";
      case KeyEvent.KEYCODE_BUTTON_B: case KeyEvent.KEYCODE_BUTTON_X: case KeyEvent.KEYCODE_BUTTON_L1: case KeyEvent.KEYCODE_BUTTON_R1: case KeyEvent.KEYCODE_BUTTON_L2: case KeyEvent.KEYCODE_BUTTON_R2: case KeyEvent.KEYCODE_X: return "b";
      case KeyEvent.KEYCODE_BUTTON_START: case KeyEvent.KEYCODE_BACK: case KeyEvent.KEYCODE_ESCAPE: case KeyEvent.KEYCODE_MENU: return "start";
      case KeyEvent.KEYCODE_BUTTON_SELECT: return "select";
      default: return null;
    }
  }
  void send(String k, boolean down) { web.evaluateJavascript("window.ssKey&&ssKey('" + k + "'," + down + ")", null); }
  int shown = 0;
  @Override public boolean dispatchKeyEvent(KeyEvent e) {
    int c = e.getKeyCode(); if (c == KeyEvent.KEYCODE_VOLUME_UP || c == KeyEvent.KEYCODE_VOLUME_DOWN || c == KeyEvent.KEYCODE_VOLUME_MUTE || c == KeyEvent.KEYCODE_HOME) return super.dispatchKeyEvent(e);
    String k = map(c);
    if (k == null) { if (e.getAction() == KeyEvent.ACTION_DOWN && shown++ < 6) android.widget.Toast.makeText(this, "Button not used yet: " + KeyEvent.keyCodeToString(c), android.widget.Toast.LENGTH_SHORT).show(); return true; } // so we learn what the Retroid sends
    if (e.getRepeatCount() == 0 && e.getAction() != KeyEvent.ACTION_MULTIPLE) send(k, e.getAction() == KeyEvent.ACTION_DOWN); return true;
  }
  void stickTo(int i, boolean on, String k) { if (stick[i] == on) return; stick[i] = on; send(k, on); }
  @Override public boolean dispatchGenericMotionEvent(MotionEvent e) { // the left stick, or a d-pad that reports itself as a hat
    if ((e.getSource() & InputDevice.SOURCE_JOYSTICK) == InputDevice.SOURCE_JOYSTICK && e.getAction() == MotionEvent.ACTION_MOVE) {
      float x = e.getAxisValue(MotionEvent.AXIS_X), y = e.getAxisValue(MotionEvent.AXIS_Y), hx = e.getAxisValue(MotionEvent.AXIS_HAT_X), hy = e.getAxisValue(MotionEvent.AXIS_HAT_Y);
      if (Math.abs(hx) > Math.abs(x)) x = hx; if (Math.abs(hy) > Math.abs(y)) y = hy;
      stickTo(0, y < -0.5f, "up"); stickTo(1, y > 0.5f, "down"); stickTo(2, x < -0.5f, "left"); stickTo(3, x > 0.5f, "right");
      return true; }
    return super.dispatchGenericMotionEvent(e);
  }
}
