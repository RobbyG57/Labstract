const CACHE_NAME = 'labstract-data-v1';
const urlsToCache = [
    // Only cache data files
    '/data/Lapeer_Plating_Plastic.lbst',
    '/data/test-results.json'
];

// Install Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opening data cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    // Only handle data file requests
    if (event.request.url.includes('/data/')) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        console.log('Serving from cache:', event.request.url);
                        return response;
                    }

                    console.log('Fetching new data:', event.request.url);
                    return fetch(event.request);
                })
        );
    }
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
}); 