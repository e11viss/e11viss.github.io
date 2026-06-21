// sw.js - Service Worker для PWA
const CACHE_NAME = 'icq-chat-v4';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json'
];

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
    self.skipWaiting();
});

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

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Пропускаем все Firebase/Google запросы
    if (url.hostname.includes('firebase') || 
        url.hostname.includes('googleapis') ||
        url.hostname.includes('gstatic.com') ||
        url.hostname.includes('firebasestorage') ||
        url.hostname.includes('identitytoolkit') ||
        url.hostname.includes('securetoken') ||
        url.hostname.includes('firebaseio.com')) {
        return;
    }
    
    // Пропускаем GoFile
    if (url.hostname.includes('gofile.io') || 
        url.hostname.includes('store1.gofile.io')) {
        return;
    }
    
    // Пропускаем WebSocket
    if (url.protocol === 'wss:' || url.protocol === 'ws:') {
        return;
    }
    
    // Пропускаем API запросы
    if (url.pathname.includes('/api/') || 
        url.pathname.includes('/v1/') || 
        url.pathname.includes('/token') ||
        url.pathname.includes('/accounts')) {
        return;
    }
    
    // Только статика
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request).catch((err) => {
                    console.warn('⚠️ Ошибка загрузки:', err.message);
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                    return new Response('', { status: 404 });
                });
            })
    );
});
