// Service Worker for intercepting HTTP requests
// Adds X-Msp-Request header to outbound requests and checks for X-Msp-Response in responses

const CACHE_NAME = 'msp-fes-v1';
let currentIdToken = undefined
const MF_ROUTE_HEADER = 'X-Msp-Mf-Route';
const MF_ROUTE_QUERY_PARAM = '__msp_mf_route';
const RESERVED_MF_ROUTE_PREFIXES = ['@', '.'];
const RESERVED_MF_ROUTE_NAMES = new Set(['src', 'node_modules']);
const mfRouteByPath = new Map();
const mfRouteTtlMs = 15 * 60 * 1000;
let lastKnownMfRoute = undefined;
let lastKnownMfRouteExpiresAt = 0;
const DEBUG_SW_BREAKPOINTS = false;
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

  if (DEBUG_SW_BREAKPOINTS && isMfVirtualAssetRequest(request.url)) {
    debugger;
  }

  if (DEBUG_SW_LOGS && isMfVirtualAssetRequest(request.url)) {
    console.log('[Service Worker] fetch intercept', {
      url: request.url,
      destination: request.destination,
      mode: request.mode,
      referrer: request.referrer,
      mapSize: mfRouteByPath.size,
      lastKnownMfRoute,
    });
  }

  const route = resolveMfRouteForRequest(request);

  event.respondWith(
    (async () => {
      try {
        const outgoingHeaders = new Headers(request.headers);
        const shouldAugmentRequest = route || isMfTargetRequest(request.url);

        if (shouldAugmentRequest) {
          outgoingHeaders.set('X-Msp-Request', 'true');
          if (currentIdToken) {
            outgoingHeaders.set('Authorization', `Bearer ${currentIdToken}`);
          }
          if (route) {
            outgoingHeaders.set(MF_ROUTE_HEADER, route);
          }
        }

        const requestUrl = new URL(request.url);
        if (route) {
          requestUrl.searchParams.set(MF_ROUTE_QUERY_PARAM, route);
        }

        if (DEBUG_SW_LOGS && isMfVirtualAssetRequest(request.url)) {
          console.log('[Service Worker] route decision', {
            url: request.url,
            route,
            shouldAugmentRequest,
            decoratedUrl: requestUrl.toString(),
          });
        }

        const modifiedRequest = shouldAugmentRequest ? new Request(requestUrl.toString(), {
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
        }) : request;

      //  console.log(`[Service Worker] Intercepted request to: ${request.url}`);
        
        // Fetch with modified headers
        const response = await fetch(modifiedRequest);
        const responseRoute = response.headers.get(MF_ROUTE_HEADER) || route;
        rememberMfRouteForRequest(request, response, responseRoute);

        if (DEBUG_SW_LOGS && isMfVirtualAssetRequest(request.url)) {
          console.log('[Service Worker] response observed', {
            url: request.url,
            status: response.status,
            responseRoute,
            responseHeaderRoute: response.headers.get(MF_ROUTE_HEADER),
          });
        }
        
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

function resolveMfRouteForRequest(request) {
  pruneMfRouteByPath();

  if (DEBUG_SW_BREAKPOINTS && isMfVirtualAssetRequest(request.url)) {
    debugger;
  }

  const requestUrl = new URL(request.url);
  if (!isMfTargetRequest(request.url) && !isMfModuleSourceRequestWithContext(request)) {
    return undefined;
  }
  const routeFromQuery = sanitizeMfRoute(requestUrl.searchParams.get(MF_ROUTE_QUERY_PARAM));
  if (routeFromQuery) {
    return routeFromQuery;
  }

  const knownRouteForRequestPath = mfRouteByPath.get(normalizePath(requestUrl.pathname))?.route;
  if (knownRouteForRequestPath) {
    return knownRouteForRequestPath;
  }

  const directRoute = getMfRouteFromUiPath(requestUrl.pathname);
  if (directRoute) {
    return directRoute;
  }

  const refererValue = getRequestReferer(request);
  if (!refererValue) {
    if (isMfVirtualAssetRequest(request.url)) {
      const fallbackRoute = getLastKnownMfRoute();
      if (fallbackRoute) {
        return fallbackRoute;
      }
    }

    return resolveSingleKnownRoute();
  }

  try {
    const referrerUrl = new URL(refererValue);
    const routeFromReferer = mfRouteByPath.get(normalizePath(referrerUrl.pathname))?.route;
    if (routeFromReferer) {
      return routeFromReferer;
    }
  } catch (_error) {
    // Continue to fallback route resolution.
  }

  if (isMfVirtualAssetRequest(request.url)) {
    const fallbackRoute = getLastKnownMfRoute();
    if (fallbackRoute) {
      return fallbackRoute;
    }
  }

  return resolveSingleKnownRoute();
}

function resolveSingleKnownRoute() {
  const knownRoutes = new Set();
  for (const value of mfRouteByPath.values()) {
    knownRoutes.add(value.route);
  }

  if (knownRoutes.size === 1) {
    return [...knownRoutes][0];
  }

  return undefined;
}

function getRequestReferer(request) {
  const refererHeader = request.headers.get('referer');
  return refererHeader || request.referrer || '';
}

function rememberMfRouteForRequest(request, response, route) {
  if (!route) {
    return;
  }

  rememberLastKnownMfRoute(route);

  pruneMfRouteByPath();
  const requestUrl = new URL(request.url);
  mfRouteByPath.set(normalizePath(requestUrl.pathname), {
    route,
    expiresAt: Date.now() + mfRouteTtlMs,
  });

  const responseUrl = new URL(response.url || request.url);
  mfRouteByPath.set(normalizePath(responseUrl.pathname), {
    route,
    expiresAt: Date.now() + mfRouteTtlMs,
  });

  const refererValue = getRequestReferer(request);
  if (!refererValue) {
    return;
  }

  try {
    const referrerUrl = new URL(refererValue);
    mfRouteByPath.set(normalizePath(referrerUrl.pathname), {
      route,
      expiresAt: Date.now() + mfRouteTtlMs,
    });
  } catch (_error) {
    // Ignore malformed referrer values.
  }
}

function getMfRouteFromUiPath(pathname) {
  const normalizedPath = normalizePath(pathname);
  const uiPath = normalizedPath.split('/ui/v1/')[1];
  if (!uiPath) {
    return undefined;
  }

  return sanitizeMfRoute(uiPath.split('/')[0]);
}

function sanitizeMfRoute(route) {
  if (typeof route !== 'string') {
    return undefined;
  }

  const trimmed = route.trim();
  if (!trimmed) {
    return undefined;
  }

  if (RESERVED_MF_ROUTE_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) {
    return undefined;
  }

  if (RESERVED_MF_ROUTE_NAMES.has(trimmed)) {
    return undefined;
  }

  return trimmed;
}

function rememberLastKnownMfRoute(route) {
  if (!route) {
    return;
  }

  lastKnownMfRoute = route;
  lastKnownMfRouteExpiresAt = Date.now() + mfRouteTtlMs;
}

function getLastKnownMfRoute() {
  if (!lastKnownMfRoute || lastKnownMfRouteExpiresAt <= Date.now()) {
    lastKnownMfRoute = undefined;
    lastKnownMfRouteExpiresAt = 0;
    return undefined;
  }

  return lastKnownMfRoute;
}

function isMfVirtualAssetRequest(urlText) {
  try {
    const url = new URL(urlText);
    const pathname = normalizePath(url.pathname);
    return pathname.startsWith('/node_modules/.vite/deps/__mf__virtual')
      || pathname.startsWith('/node_modules/__mf__virtual')
      || pathname.startsWith('/@id/virtual:mf-')
      || pathname.startsWith('/.__mf__temp/')
      || pathname.startsWith('/@fs/') && pathname.includes('/__mf__temp/');
  } catch (_error) {
    return false;
  }
}

function isMfTargetRequest(urlText) {
  try {
    const url = new URL(urlText);
    const pathname = normalizePath(url.pathname);
    return pathname.startsWith('/ui/v1/') || isMfVirtualAssetRequest(urlText);
  } catch (_error) {
    return false;
  }
}

function isMfModuleSourceRequestWithContext(request) {
  try {
    const requestUrl = new URL(request.url);
    const pathname = normalizePath(requestUrl.pathname);
    if (!pathname.startsWith('/src/') || !isLikelyModuleScriptPath(pathname)) {
      return false;
    }

    const routeFromQuery = sanitizeMfRoute(requestUrl.searchParams.get(MF_ROUTE_QUERY_PARAM));
    if (routeFromQuery) {
      return true;
    }

    const refererValue = getRequestReferer(request);
    if (!refererValue) {
      return false;
    }

    const refererUrl = new URL(refererValue);
    const refererPath = normalizePath(refererUrl.pathname);
    if (refererPath.startsWith('/ui/v1/')) {
      return true;
    }

    return isMfVirtualAssetRequest(refererUrl.toString());
  } catch (_error) {
    return false;
  }
}

function isLikelyModuleScriptPath(pathname) {
  return /\.(?:mjs|js|mts|ts|jsx|tsx)$/.test(pathname);
}

function normalizePath(pathname) {
  return pathname.split('?')[0] || '/';
}

function pruneMfRouteByPath() {
  const now = Date.now();
  for (const [path, value] of mfRouteByPath.entries()) {
    if (value.expiresAt <= now) {
      mfRouteByPath.delete(path);
    }
  }
}
