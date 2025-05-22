const CACHE_NAME = 'my-accounting-time-manager-v1';
const urlsToCache = [
  './', // アプリケーションのルート (index.htmlなど)
  './index.html',
  // 注意: CSSやJavaScriptがindex.htmlに直接埋め込まれている場合、
  // ここに外部ファイルとして指定する必要はありません。
  // もし、将来的にCSSやJSを別のファイルとして分ける場合は、
  // './style.css', './script.js', のように追加してください。
  './icons/icon-192x192.png', // manifest.jsonで指定したアイコン
  './icons/icon-512x512.png'  // manifest.jsonで指定したアイコン
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにヒットしたら、キャッシュから応答を返す
        if (response) {
          return response;
        }
        // キャッシュになければ、ネットワークから取得する
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME]; // 現在のキャッシュ名
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // ホワイトリストにない古いキャッシュを削除する
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});