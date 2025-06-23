// 极简缓存脚本 - 保存为 sw.js  
const CACHE_NAME = 'sanxing-offline-v1';
const URLS_TO_CACHE = [
  '/w/index.html', 
  '/w/manifest.webmanifest', 
  'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\'  viewBox=\'0 0 100 100\'><text y=\'.9em\' font-size=\'90\' fill=\'%235a3921\'>📜</text></svg>'
];
 
self.addEventListener('install',  event => {
  event.waitUntil( 
    caches.open(CACHE_NAME) 
      .then(cache => cache.addAll(URLS_TO_CACHE)) 
  );
});
 
self.addEventListener('fetch',  event => {
  event.respondWith( 
    caches.match(event.request) 
      .then(response => response || fetch(event.request)) 
  );
});