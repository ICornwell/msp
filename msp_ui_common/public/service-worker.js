// Service Worker for intercepting HTTP requests
// Adds X-Msp-Request header to outbound requests and checks for X-Msp-Response in responses

const CACHE_NAME = 'msp-fes-v1';
let currentIdToken = undefined

// Install event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'USER_INFO') {
    console.log('[Service Worker] Received user info:', event.data.userIdToken);
    currentIdToken = event.data.userIdToken;
    // You can store or use the user info as needed
  }
});

// Fetch event - intercept all HTTP requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Only intercept HTTP/HTTPS requests
  if (!request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Clone the request to modify headers
        const modifiedRequest = new Request(request, {
          headers: new Headers({
            ...Object.fromEntries(request.headers.entries()),
            'X-Msp-Request': 'true',
            'Authorization': currentIdToken ? `Bearer ${currentIdToken}` : ''
          })
        });

      //  console.log(`[Service Worker] Intercepted request to: ${request.url}`);
        
        // Fetch with modified headers
        const response = await fetch(modifiedRequest);
        
        // Check for X-Msp-Response header
        const hasMspResponse = response.headers.get('X-Msp-Response') === 'true';
        
      /*   if (hasMspResponse) {
          console.log(`[Service Worker] Received X-Msp-Response header from: ${request.url}`);
        } else {
          console.warn(`[Service Worker] Missing X-Msp-Response header from: ${request.url}`);
        } */
        
        return response;
      } catch (error) {
        console.error(`[Service Worker] Fetch failed for ${request.url}:`, error);
        throw error;
      }
    })()
  );
});
