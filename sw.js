// sw.js - Service Worker для PWA
const CACHE_NAME = 'icq-chat-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json'
];

// Устанавливаем кеш
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('✅ Кеш создан');
                return cache.addAll(urlsToCache).catch(err => {
                    console.warn('⚠️ Ошибка кеширования:', err);
                });
            })
    );
    self.skipWaiting();
});

// Активация
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑 Удален старый кеш:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Обработка запросов - только для статики, не трогаем API
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Пропускаем Firebase запросы (не кешируем)
    if (url.hostname.includes('firebase') || 
        url.hostname.includes('googleapis') ||
        url.hostname.includes('gstatic.com')) {
        return event.respondWith(fetch(event.request));
    }
    
    // Пропускаем GoFile запросы (не кешируем)
    if (url.hostname.includes('gofile.io')) {
        return event.respondWith(fetch(event.request));
    }
    
    // Пропускаем WebSocket (не кешируем)
    if (url.protocol === 'wss:' || url.protocol === 'ws:') {
        return event.respondWith(fetch(event.request));
    }
    
    // Пропускаем API запросы
    if (url.pathname.includes('/api/') || url.pathname.includes('/v1/')) {
        return event.respondWith(fetch(event.request));
    }
    
    // Только для статических файлов - используем кеш
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request).catch(() => {
                    // Если нет интернета, возвращаем index.html
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                    // Возвращаем пустой ответ для других запросов
                    return new Response('', { status: 404, statusText: 'Not Found' });
                });
            })
    );
});
