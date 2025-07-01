// 封面专用强缓存脚本
const COVER_CACHE = 'daoxuan-cover-cache-v1';
const COVER_URLS = [
  'https://jygldj.github.io/w/index.html', // 封面HTML
  'https://jygldj.github.io/w/manifest.webmanifest', // manifest文件
  'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><text y=\'.9em\' font-size=\'90\' fill=\'%235a3921\'>📜</text></svg>' // 封面图标
];

// 安装时缓存封面资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(COVER_CACHE)
      .then(cache => cache.addAll(COVER_URLS))
      .then(() => self.skipWaiting()) // 立即激活ServiceWorker
  );
});

// 激活时清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== COVER_CACHE)
          .map(name => caches.delete(name))
      );
    })
  );
});

// 请求时优先使用缓存（封面资源强制缓存）
self.addEventListener('fetch', event => {
  const requestUrl = event.request.url;
  
  // 仅处理封面相关资源
  if (COVER_URLS.includes(requestUrl) || requestUrl.startsWith('https://jygldj.github.io/w/')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        // 缓存存在则直接返回（不请求网络）
        if (response) return response;
        
        // 缓存不存在时才从网络获取并更新缓存
        return fetch(event.request).then(networkRes => {
          const cacheCopy = networkRes.clone();
          caches.open(COVER_CACHE).then(cache => cache.put(event.request, cacheCopy));
          return networkRes;
        });
      })
    );
    return;
  }
  
  // 其他资源正常处理（不缓存扉页）
  event.respondWith(fetch(event.request));
});