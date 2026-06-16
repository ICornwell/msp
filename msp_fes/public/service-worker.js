// Service Worker for intercepting HTTP requests
// Adds X-Msp-Request header to outbound requests and checks for X-Msp-Response in responses


let currentAccessToken = undefined;
let currentIdToken = undefined;
let tokenExpiresAtEpochMs = undefined;
let tokenExpiryClearTimeout = undefined;

const DEBUG_SW_LOGS = true;

// Install event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  clearTokens('install');
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
    currentAccessToken = event.data.userAccessToken;
    currentIdToken = event.data.userIdToken;
    tokenExpiresAtEpochMs = event.data.tokenExpiresAtEpochMs;
    scheduleExpiryBasedTokenClear(tokenExpiresAtEpochMs);
    console.log('[Service Worker] Received user info', {
      hasAccessToken: Boolean(currentAccessToken),
      hasIdToken: Boolean(currentIdToken),
      tokenExpiresAtEpochMs,
    });
    // You can store or use the user info as needed
    return;
  }

  if (event.data && event.data.type === 'CLEAR_TOKENS') {
    clearTokens(event.data.reason || 'explicit-clear');
  }
});

function clearTokens(reason) {
  currentAccessToken = undefined;
  currentIdToken = undefined;
  tokenExpiresAtEpochMs = undefined;
  if (tokenExpiryClearTimeout) {
    clearTimeout(tokenExpiryClearTimeout);
    tokenExpiryClearTimeout = undefined;
  }

  if (DEBUG_SW_LOGS) {
    console.log('[Service Worker] Cleared tokens', { reason });
  }
}

function scheduleExpiryBasedTokenClear(expiresAtEpochMs) {
  if (tokenExpiryClearTimeout) {
    clearTimeout(tokenExpiryClearTimeout);
    tokenExpiryClearTimeout = undefined;
  }

  if (!expiresAtEpochMs || Number.isNaN(Number(expiresAtEpochMs))) {
    return;
  }

  const clearAtMs = Number(expiresAtEpochMs) + 30_000;
  const delayMs = Math.max(clearAtMs - Date.now(), 0);
  tokenExpiryClearTimeout = setTimeout(() => {
    clearTokens('expiry+30s');
  }, delayMs);

  if (DEBUG_SW_LOGS) {
    console.log('[Service Worker] Scheduled token clear in ms', delayMs);
  }
}

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
        const isSameOrigin = reqUrl.origin === self.location.origin;
        const shouldInjectHeaders = Boolean(alias) || (isSameOrigin && reqUrl.pathname.startsWith('/api/v1/'));

        if (!shouldInjectHeaders) {
          if (DEBUG_SW_LOGS) {
            console.log('[Service Worker] bypass fetch', {
              url: request.url,
              alias,
              sameOrigin: isSameOrigin,
              pathname: reqUrl.pathname,
            });
          }
          return fetch(request);
        }

        if (DEBUG_SW_LOGS) {
          console.log('[Service Worker] fetch intercept', {
            url: request.url,
            alias,
            resolvedHost: host,
            resolvedPath: path,
            sameOrigin: isSameOrigin,
          });
        }

        const outgoingHeaders = new Headers(request.headers);
        outgoingHeaders.set('X-Msp-Request', 'true');
        if (currentAccessToken) {
          outgoingHeaders.set('Authorization', `Bearer ${currentAccessToken}`);
        }
        if (currentIdToken) {
          outgoingHeaders.set('MSP-USER-ID-ASSERTION', currentIdToken);
        }

        const modifiedUrl = alias
          ? `${reqUrl.protocol}//${host}${path}${reqUrl.search}`
          : request.url;

        if (DEBUG_SW_LOGS) {
          console.log('[Service Worker] calling with headers', outgoingHeaders);
        }

        // Read body to a concrete ArrayBuffer to avoid stream/duplex issues.
        // request.body is a ReadableStream even for plain JSON payloads;
        // passing it directly to new Request() requires duplex:'half' and
        // can trigger ALPN negotiation failures on some Chromium builds.
        const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
        const bodyBytes = hasBody ? await request.clone().arrayBuffer() : undefined;

        const modifiedRequest = new Request(modifiedUrl, {
          method: request.method,
          headers: outgoingHeaders,
          body: bodyBytes,
          credentials: request.credentials,
          redirect: request.redirect,
          signal: request.signal,
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


