/* 我的身體解剖圖譜 — offline shell.
   The page is one self-contained file, so caching it is enough to make the
   whole app work with no network. HTML goes network-first so a redeploy is
   picked up on the next online visit; assets go cache-first for speed. */
const V = 'anatomia-v3.0';
const SHELL = [
  './', './index.html', './guide.html', './start.html', './manifest.json',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png', './og-cover.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const sameOrigin = new URL(req.url).origin === location.origin;
  const isFont = /fonts\.(googleapis|gstatic)\.com/.test(req.url);
  // Google Fonts is the one cross-origin dependency the shell has. Everything
  // that actually runs the app (SVG plates, JS, data) is already inline in
  // index.html, so this only affects whether the branded typefaces render —
  // but it's still worth caching properly rather than leaving it to chance.
  if (!sameOrigin && !isFont) return;

  if (req.mode === 'navigate' || req.destination === 'document'){
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(V).then(c => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(V).then(c => c.put(req, copy));
      return res;
    }))
  );
});
