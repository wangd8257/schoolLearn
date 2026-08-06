const CACHE_NAME = 'growth-desk-v3';
const CORE = ['./','./index.html','./styles.css','./manifest.webmanifest','./assets/icon.svg','./src/app.js','./src/db.js','./src/drawing.js','./src/papers.js','./src/templates.js','./src/reading.js','./src/worksheet-render.js','./src/games.js','./src/data/readings.js','./src/data/word-lists.js','./src/games/chinese-word-game.js','./src/games/english-match-game.js','./src/games/game-session.js','./src/games/random.js','./src/math/index.mjs','./src/math/constants.mjs','./src/math/generators.mjs','./src/math/random.mjs','./src/math/validator.mjs','./src/math/worksheet.mjs'];
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match('./index.html'))));
});
