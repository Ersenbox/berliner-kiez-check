// Berliner Kiez-Check Service Worker – App-Shell offline, API network-first
const C = 'kiezcheck-v4';
const SHELL = ['/', '/manifest.json', '/icon.svg', '/vendor/leaflet/leaflet.js', '/vendor/leaflet/leaflet.css', '/vendor/fonts/archivo-latin-wdth-normal.woff2', '/quiz/', '/vendor/confetti/confetti.browser.js', '/vendor/fonts/plus-jakarta-sans-latin-wght-normal.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (u.pathname.startsWith('/api/admin') || u.pathname.startsWith('/k/') || u.pathname === '/admin.html' || u.pathname === '/sitemap.xml') return;
  if (u.pathname.startsWith('/api/')) {
    e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; })
      .catch(() => caches.match(e.request)));
    return;
  }
  // Seitenaufrufe: immer zuerst Netz (Weiterleitungen wie /werben.html -> /werben funktionieren so), offline aus dem Cache
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request).then(m => (m && !m.redirected) ? m : caches.match('/'))));
    return;
  }
  // Stale-while-revalidate für Dateien und Bilder
  e.respondWith(caches.match(e.request).then(m => {
    const net = fetch(e.request).then(r => { if (r.ok && !r.redirected) { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); } return r; }).catch(() => m);
    return (m && !m.redirected) ? m : net;
  }));
});
