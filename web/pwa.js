// Port Stacker Deluxe as an installed web app (made by game/tools/web.py). Two jobs:
// 1. Installed (full screen or standalone, or added to an iPhone's home screen): add body.pwa, which hides the on-screen controller
//    and lets the game fill the display. Opened as a normal web page, nothing changes.
// 2. Run the service worker: everything plays from the cache offline; with a network it fetches a newer build in the background,
//    and when one is ready the page switches to it the next time the title screen is up (never during a game).
(function () {
  const mq = ['(display-mode: fullscreen)', '(display-mode: standalone)'].map(q => matchMedia(q));
  function mark() {
    const on = mq.some(m => m.matches) || navigator.standalone === true;
    if (on !== document.body.classList.contains('pwa')) {
      document.body.classList.toggle('pwa', on);
      dispatchEvent(new Event('resize'));
    }
  }
  mark();
  mq.forEach(m => m.addEventListener && m.addEventListener("change", mark));

  if (!('serviceWorker' in navigator)) return;
  let swapping = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (swapping) location.reload();
  });
  // the game's own state (its global G): a new build only takes over on the title screen
  const atTitle = () => {
    try {
      return typeof G !== 'undefined' && G.state === 'title';
    } catch (e) {
      return false;
    }
  };
  navigator.serviceWorker
    .register('sw.js')
    .then(reg => {
      const ready = w => {
        const t = setInterval(() => {
          if (!atTitle()) return;
          clearInterval(t);
          swapping = true;
          w.postMessage('skip');
        }, 1000);
      };
      const watch = w => {
        if (w)
          w.addEventListener('statechange', () => {
            if (w.state === 'installed' && navigator.serviceWorker.controller) ready(w);
          });
      };
      if (reg.waiting && navigator.serviceWorker.controller) ready(reg.waiting);
      reg.addEventListener('updatefound', () => watch(reg.installing));
      const check = () => {
        if (navigator.onLine !== false) reg.update().catch(() => {});
      };
      check();
      setInterval(check, 15 * 60 * 1000); // and every 15 minutes while it's open
    })
    .catch(() => {});
})();
