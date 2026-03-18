const CACHE_NAME = 'kgf-baseball-planner-v1';
const ASSETS = [
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&family=Bebas+Neue&family=Black+Ops+One&display=swap'
];

// インストール時にキャッシュ
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('キャッシュ開始');
      return cache.addAll(ASSETS).catch(function(err) {
        console.log('一部キャッシュ失敗（フォント等）:', err);
      });
    })
  );
  self.skipWaiting();
});

// 古いキャッシュを削除
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// フェッチ：キャッシュ優先、なければネットワーク
self.addEventListener('fetch', function(event) {
  // Google Fonts等の外部リソースはネットワーク優先
  if (event.request.url.includes('fonts.googleapis') ||
      event.request.url.includes('fonts.gstatic')) {
    event.respondWith(
      fetch(event.request).then(function(response) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
        return response;
      }).catch(function() {
        return caches.match(event.request);
      })
    );
    return;
  }

  // index.html等はキャッシュ優先（オフライン対応）
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
        return response;
      });
    })
  );
});
