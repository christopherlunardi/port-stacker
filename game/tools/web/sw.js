// Port Stacker Deluxe's service worker (made by game/tools/web.py): keeps every file of one build in its own cache so the game plays
// offline. A newer build installs in the background and waits; the page tells it to take over on the next title screen (message
// "skip"), then the old build's cache is deleted.
const BUILD = __BUILD__,
  CACHE = 'portstacker-' + BUILD,
  FILES = __FILES__;
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))));
});
self.addEventListener('message', e => {
  if (e.data === 'skip') self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches
      .keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith('portstacker-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/version.json')) return; // always from the network
  e.respondWith(
    caches.open(CACHE).then(c =>
      c
        .match(req, { ignoreSearch: true })
        .then(r => r || (req.mode === 'navigate' ? c.match('./') : undefined))
        .then(r => r || fetch(req))
    )
  );
});
