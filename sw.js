// 給快取一個版本號，未來如果你修改了 CSS 或 JS，記得把 v1 改成 v2，才能讓使用者更新畫面
const CACHE_NAME = 'unipocket-cache-v2';

// 根據你的 index.html 與 manifest，列出需要離線存取的靜態檔案
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './themes.css',
  './app.js',
  './manifest.json',
  './icon.svg',
  './UniPocket_png192.png',
  'https://uni-pocket.pages.dev/UniPocket_png512.png',
];

// 1. 安裝階段：將指定的檔案寫入快取
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('已開啟快取');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. 啟動階段：清除舊版本的快取，避免佔用空間
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 3. 攔截請求階段：當網頁發出請求時，先找快取，找不到再去網路抓
self.addEventListener('fetch', event => {
  // 排除 Supabase API 請求
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // 1. 快取優先：如果有存過，直接回傳
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // 2. 網路備援：去網路抓，如果失敗 (斷線) 就觸發 catch
      return fetch(event.request).catch(() => {
        // 【關鍵修正】PWABuilder 掃描器認的是 mode === 'navigate'
        if (event.request.mode === 'navigate') {
          // SPA 架構下，離線時強制回傳首頁
          return caches.match('./index.html');
        }
      });
    })
  );
});