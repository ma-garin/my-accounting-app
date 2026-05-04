// キャッシュのバージョン名を定義します。
// アプリを更新するたびにこのバージョン名を変更することで、
// Service Workerが新しいキャッシュをダウンロードするようにトリガーします。
const CACHE_NAME = 'my-accounting-app-v2.16'; // ラウンジダークと店舗別料金に合わせて更新

// キャッシュするファイルの一覧を定義します。
// ここに記載されたファイルは、初回アクセス時にキャッシュされます。
const urlsToCache = [
  '/', // トップページ
  'index.html', // メインのHTMLファイル (会計画面)
  'simulation.html', // シミュレーション画面
  'menu.html', // メニュー画面
  'settings.html', // 店舗設定画面
  'app-core.js?v=2.16', // 共通データ・料金ロジック
  'theme.css?v=2.16', // 共通テーマ
  'manifest.json', // PWAの設定ファイル
  'service-worker.js', // このService Worker自身もキャッシュ
  // アイコンファイルは、正しくパスが指定されているか確認してください
  'icons/icon-192x192.png',
  'icons/icon-512x512.png'
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
  const { request } = event;

  // GET 以外は Service Worker で扱わない
  if (request.method !== 'GET') {
    return;
  }

  // HTML ドキュメントはネットワーク優先にして、古い画面が残るのを防ぐ
  const isNavigationRequest = request.mode === 'navigate' || request.destination === 'document';
  if (isNavigationRequest) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => cachedResponse || caches.match('index.html'));
        })
    );
    return;
  }

  // 画像や JS/CSS はキャッシュ優先
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
      });
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
