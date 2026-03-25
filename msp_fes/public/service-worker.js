// Service Worker for intercepting HTTP requests
// Adds X-Msp-Request header to outbound requests and checks for X-Msp-Response in responses


let currentIdToken = undefined

const DEBUG_SW_LOGS = true;

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
        const reqUrl = new URL(request.url);
        const { host, alias, path } = resolveHostAndPath(reqUrl);

        if (!alias) {
          return fetch(request);
        }

        if (DEBUG_SW_LOGS) {
          console.log('[Service Worker] alias fetch intercept', {
            url: request.url,
            alias,
            resolvedHost: host,
            resolvedPath: path,
          });
        }

        const outgoingHeaders = new Headers(request.headers);
        outgoingHeaders.set('X-Msp-Request', 'true');
        if (currentIdToken) {
          outgoingHeaders.set('Authorization', `Bearer ${currentIdToken}`);
        }

        const modifiedUrl = `${reqUrl.protocol}//${host}${path}${reqUrl.search}`;

        const modifiedRequest = new Request(modifiedUrl, {
          method: request.method,
          headers: outgoingHeaders,
          body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
          mode: request.mode,
          credentials: request.credentials,
          cache: request.cache,
          redirect: request.redirect,
          integrity: request.integrity,
          keepalive: request.keepalive,
          signal: request.signal,
          referrer: request.referrer || undefined,
          referrerPolicy: request.referrerPolicy || undefined,
        });

        const response = await fetch(modifiedRequest);

        if (DEBUG_SW_LOGS) {
          console.log('[Service Worker] response observed', {
            url: request.url,
            status: response.status,
          });
        }

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      } catch (error) {
        console.error(`[Service Worker] Fetch failed for ${request.url}:`, error);
        throw error;
      }
    })()
  );
});

function resolveHostAndPath(requestUrl) {
  const splitHostname = requestUrl.hostname.split('_');

  // if no remote alias is present, return original host and empty alias
  // fetch will go direct to the original host, which will handle ui routing
  // directly, or proxy /ap1/vx calls to the service hub
  if (splitHostname.length !== 2) {
    return {
      host: `${requestUrl.hostname}${requestUrl.port ? `:${requestUrl.port}` : ''}`,
      alias: '',
      path: requestUrl.pathname,
    };
  }

  const alias = splitHostname[1];
  // otherwise, return the modified host (stripped of the MF alias)
  // and add ui routing prefix to the path, so the bff can relay the request
  // to the service hub for proper routing to the MF remote based on the alias
  return {
    host: `${splitHostname[0]}${requestUrl.port ? `:${requestUrl.port}` : ''}`,
    alias,
    path: `/ui/v1/${alias}${requestUrl.pathname}`,
  };
}


