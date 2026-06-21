// sw.js - Service Worker для PWA
const CACHE_NAME = 'icq-chat-v3';
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
                console.log('✅ Кеш создан, версия:', CACHE_NAME);
                return cache.addAll(urlsToCache).catch(err => {
                    console.warn('⚠️ Ошибка кеширования:', err);
                });
            })
    );
    // Заставляем SW активироваться сразу
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
    // Перехватываем управление сразу
    self.clients.claim();
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // ПРОПУСКАЕМ ВСЕ API ЗАПРОСЫ - НЕ КЕШИРУЕМ
    // Firebase
    if (url.hostname.includes('firebase') || 
        url.hostname.includes('googleapis') ||
        url.hostname.includes('gstatic.com') ||
        url.hostname.includes('firebasestorage') ||
        url.hostname.includes('identitytoolkit') ||
        url.hostname.includes('securetoken')) {
        return; // Просто пропускаем
    }
    
    // GoFile
    if (url.hostname.includes('gofile.io') || 
        url.hostname.includes('store1.gofile.io')) {
        return;
    }
    
    // WebSocket
    if (url.protocol === 'wss:' || url.protocol === 'ws:') {
        return;
    }
    
    // Любые API запросы
    if (url.pathname.includes('/api/') || 
        url.pathname.includes('/v1/') || 
        url.pathname.includes('/token') ||
        url.pathname.includes('/accounts')) {
        return;
    }
    
    // Только для статических файлов
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request).catch((err) => {
                    console.warn('⚠️ Ошибка загрузки:', err);
                    // Если запрос на страницу и нет интернета - показываем index.html
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                    // Возвращаем пустой ответ
                    return new Response('', { 
                        status: 404, 
                        statusText: 'Not Found' 
                    });
                });
            })
    );
});
