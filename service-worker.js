/**
 * ════════════════════════════════════════════════════════════
 * service-worker.js — PWA 快取策略
 * 保險銷售視覺化培訓系統 v2.0
 *
 * 快取策略：
 *   App Shell (HTML/CSS/JS)  → Cache-First（離線優先）
 *   products.json             → Network-First（網路優先，失敗回退快取）
 *   Chart.js / Google Fonts   → Cache-First
 *   /brochures/*.pdf          → Stale-While-Revalidate
 * ════════════════════════════════════════════════════════════
 */

'use strict';

const CACHE_VERSION = 'it-v3.2.1';
const CACHE_SHELL   = `${CACHE_VERSION}-shell`;
const CACHE_DATA    = `${CACHE_VERSION}-data`;
const CACHE_PDF     = `${CACHE_VERSION}-pdf`;

/* App Shell 資源清單（離線必須可用） */
const SHELL_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './data.js',
  './sync.js',
  './data/products.default.json',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js'
];

/* ── INSTALL：預快取 App Shell ── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then(cache => {
      // 逐個加入，避免單個失敗導致全部回滾
      return Promise.allSettled(
        SHELL_ASSETS.map(url => cache.add(url).catch(err => {
          console.warn('SW: 無法預快取', url, err.message);
        }))
      );
    })
  );
  self.skipWaiting();
});

/* ── ACTIVATE：清除舊版快取 ── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => !key.startsWith(CACHE_VERSION))
          .map(key => {
            console.log('SW: 清除舊快取', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

/* ── FETCH：按資源類型分流策略 ── */
self.addEventListener('fetch', (event) => {
  const request = event.request;

  /* 只處理 GET 請求 */
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }

  /* 策略 1：products.json → Network-First，失敗回退快取 */
  if (url.pathname.endsWith('products.json') && !url.hostname.includes('cdn.jsdelivr')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_DATA).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          console.log('SW: products.json 網路失敗，使用快取');
          return caches.match(request).then(cached =>
            cached || caches.match('./data/products.default.json')
          );
        })
    );
    return;
  }

  /* 策略 2：Brochures PDF → Stale-While-Revalidate */
  if (url.pathname.includes('/brochures/') && url.pathname.endsWith('.pdf')) {
    event.respondWith(
      caches.open(CACHE_PDF).then(cache =>
        cache.match(request).then(cachedResponse => {
          const fetchPromise = fetch(request).then(response => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => cachedResponse);
          return cachedResponse || fetchPromise;
        })
      )
    );
    return;
  }

  /* 策略 3：App Shell + CDN → Cache-First */
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        /* 同源成功回應加入快取 */
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_SHELL).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        /* 離線且無快取時，導航請求回退到 index.html */
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

/* ── MESSAGE：接收主動更新指令 ── */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'CLEAR_DATA_CACHE') {
    caches.delete(CACHE_DATA).then(() => {
      console.log('SW: 數據快取已清除');
    });
  }
  if (event.data && event.data.type === 'CACHE_PDF') {
    /* 主動快取指定 PDF URL */
    const { pdfUrl } = event.data;
    if (pdfUrl) {
      fetch(pdfUrl).then(resp => {
        if (resp.ok) {
          caches.open(CACHE_PDF).then(cache => cache.put(pdfUrl, resp));
        }
      }).catch(err => console.warn('SW: PDF 快取失敗', pdfUrl, err.message));
    }
  }
});
