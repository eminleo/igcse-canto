/**
 * IGCSE 粵語 PWA - Service Worker v2.25
 * 優化點：修復查詢字串匹配陷阱、強化離線識別能力
 */

const CACHE_NAME = 'igcse-canto-cache-v2.25';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './words.js',
  './manifest.json',
  './icon.png',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js'
];

// 1. 安裝階段 (Install)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] 正在執行 CORS 優化安裝');
      
      const cachePromises = ASSETS_TO_CACHE.map((url) => {
        const requestMode = url.startsWith('http') ? 'cors' : 'same-origin';
        const request = new Request(url, { mode: requestMode });

        return fetch(request)
          .then((response) => {
            if (!response.ok) throw new Error(`Fetch failed: ${url}`);
            return cache.put(url, response);
          })
          .catch((err) => console.error(`[Service Worker] 資源加載失敗: ${url}`, err));
      });

      return Promise.all(cachePromises);
    })
  );
});

// 2. 激活階段 (Activate)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] 移除過時快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 攔截請求 (Fetch)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // [修復] 使用 ignoreSearch: true，防止 index.html?xxx 導致匹配失敗
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        // 離線備援
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html', { ignoreSearch: true });
        }
      });
    })
  );
});