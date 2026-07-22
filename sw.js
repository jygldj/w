/*
 * 道玄文集 · Service Worker（sw.js）
 * 作用：离线缓存与访问加速。
 *   - 首次成功打开后，页面骨架与文章数据全部存入本地缓存；
 *   - 之后访问一律"缓存优先"：毫秒级打开，网络卡顿/断网也能阅读；
 *   - 后台静默拉取最新版本，内容有更新时通知页面提示读者刷新。
 * 兼容性：不支持 Service Worker 的浏览器自动静默跳过，不影响正常访问。
 */
var CACHE = 'dxwj-v1';

/* 预缓存清单：网站骨架与文章数据（相对 sw.js 所在目录） */
var CORE = [
    './',
    './index.html',
    './index1.html',
    './search.html',
    './jianjie.html',
    './build.html',
    './style.css',
    './cover.css',
    './render.js',
    './build-core.js',
    './articles.js',
    './wsf.jpg',
    './wsf.webp'
];

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE).then(function (c) {
            // 逐个添加，个别失败不阻断整体安装
            return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); }));
        }).then(function () { return self.skipWaiting(); })
    );
});

self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(keys.map(function (k) {
                if (k !== CACHE) return caches.delete(k);
            }));
        }).then(function () { return self.clients.claim(); })
    );
});

/* 内容有更新时，通知所有打开的页面 */
function notifyUpdate(req) {
    var p = new URL(req.url).pathname;
    if (!/articles\.js$|index1?\.html$|search\.html$/.test(p)) return;
    self.clients.matchAll().then(function (cs) {
        cs.forEach(function (c) { c.postMessage({ type: 'dx-update-available' }); });
    });
}

/* 缓存优先 + 后台更新（SWR）。
 * 有缓存：立即返回缓存，后台拉新——拉到的内容与缓存不一致才写入并通知；
 * 无缓存：走网络，成功后写入缓存；网络失败则尽力回退缓存。 */
function swr(req) {
    return caches.match(req).then(function (hit) {
        var fetched = fetch(req).then(function (res) {
            if (!res || res.status !== 200 || res.type === 'opaque') return res;
            var copy = res.clone();
            var done = hit
                ? Promise.all([hit.text(), copy.text()]).then(function (r) {
                    if (r[0] !== r[1]) {
                        return caches.open(CACHE).then(function (c) {
                            return c.put(req, new Response(r[1], {
                                headers: copy.headers, status: copy.status, statusText: copy.statusText
                            })).then(function () { notifyUpdate(req); });
                        });
                    }
                })
                : caches.open(CACHE).then(function (c) { return c.put(req, copy); });
            done.catch(function () {});
            return res;
        }).catch(function () {
            return hit;
        });
        return hit || fetched;
    });
}

self.addEventListener('fetch', function (e) {
    var req = e.request;
    if (req.method !== 'GET') return;
    // 只接管本站资源；百度统计等外部请求直接放行
    if (!req.url.startsWith(self.location.origin)) return;
    e.respondWith(swr(req));
});
