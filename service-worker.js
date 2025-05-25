// キャッシュのバージョン名を定義します。
// アプリを更新するたびにこのバージョン名を変更することで、
// Service Workerが新しいキャッシュをダウンロードするようにトリガーします。
const CACHE_NAME = 'my-accounting-app-v2.9'; // バージョンを更新しました

// キャッシュするファイルの一覧を定義します。
// ここに記載されたファイルは、初回アクセス時にキャッシュされます。
const urlsToCache = [
  '/', // トップページ
  'index.html', // メインのHTMLファイル (会計画面)
  'simulation.html', // シミュレーション画面
  'manifest.json', // PWAの設定ファイル
  'service-worker.js', // このService Worker自身もキャッシュ
  // アイコンファイルは、正しくパスが指定されているか確認してください
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'menu.html' // メニュー画面もキャッシュ対象に追加
];

// インストールイベント: Service Workerがインストールされたときに実行されます。
// ここで、指定したファイルをキャッシュに保存します。
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // インストール後、すぐに待機状態をスキップしてアクティブ化
  );
});

// フェッチイベント: アプリがネットワークリクエストを行うたびに実行されます。
// ここで、キャッシュ優先の戦略を実装します。
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュにリソースがあれば、それを返す
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
// ここで、古いキャッシュを削除し、クライアントに制御を要求します。
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 現在のキャッシュ名と異なるキャッシュを削除
          if (cacheName !== CACHE_NAME && cacheName.startsWith('my-accounting-app-')) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // 新しいService Workerが既存のタブも制御する
  );
});

// Service Workerに更新をスキップするメッセージを送信するためのリスナー
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});