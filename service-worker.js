// キャッシュのバージョン名を定義します。
// アプリを更新するたびにこのバージョン名を変更することで、
// Service Workerが新しいキャッシュをダウンロードするようにトリガーします。
const CACHE_NAME = 'my-accounting-app-v1.9'; // 新しいバージョンに変更しました

// キャッシュするファイルの一覧を定義します。
// ここに記載されたファイルは、初回アクセス時にキャッシュされます。
const urlsToCache = [
  '/', // トップページ
  'index.html', // メインのHTMLファイル (会計画面)
  'simulation.html', // 新しく追加したシミュレーション画面
  'manifest.json', // PWAの設定ファイル
  'service-worker.js', // このService Worker自身もキャッシュ
  // アイコンファイルは、正しくパスが指定されているか確認してください
  'icons/icon-192x192.png',
  'icons/icon-512x512.png'
  // もし他にCSSファイルやJavaScriptファイルがあればここに追加
  // 'css/style.css',
  // 'js/script.js'
];

// インストールイベント: Service Workerがインストールされたときに実行されます。
// ここで、指定したファイルをキャッシュに保存します。
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// フェッチイベント: アプリがネットワークリクエストを行うたびに実行されます。
// ここで、キャッシュ優先の戦略を実装します。
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュにレスポンスがあればそれを返す
        if (response) {
          return response;
        }
        // なければネットワークから取得し、キャッシュに追加してから返す
        return fetch(event.request).then(
          (response) => {
            // レスポンスが不正な場合（例えば、HTTP 200でない、またはBasicタイプでない）はキャッシュしない
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // レスポンスをクローンしてキャッシュに保存
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        );
      })
  );
});

// アクティベートイベント: 新しいService Workerがアクティブになったときに実行されます。
// ここで、古いキャッシュを削除します。
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 現在のキャッシュ名と異なるキャッシュを削除
          if (cacheName !== CACHE_NAME && cacheName.startsWith('my-accounting-app-')) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});