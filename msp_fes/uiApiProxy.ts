import express, { json, urlencoded, static as staticEx } from 'express';

import cookieParser from 'cookie-parser';
import { join } from 'path';
import { fileURLToPath } from 'url';

import fileUpload from 'express-fileupload';
import cors from 'cors';
import fetch from 'node-fetch';
import { pipeline } from 'node:stream/promises';

import { Ports } from 'msp_common'
import { Config } from './src/config.js';

const _dirname = typeof __dirname !== 'undefined' ? __dirname : join(fileURLToPath(new URL('.', import.meta.url)), '..');
const mfRouteHeader = 'x-msp-mf-route';
const mfRouteQueryParam = '__msp_mf_route';
const reservedMfRoutePrefixes = ['@', '.'];
const reservedMfRouteNames = new Set(['src', 'node_modules']);

// Express 5 natively supports async route handlers.
const app = express();

app.use((_req: any, res: any, next: any) => {
  res.socket.setTimeout(0); // 5 minutes
  next();
})

// app.use(logger('tiny', { stream: ConsoleStream() }))
app.use(json({ limit: '500mb' }));
app.use(urlencoded({ limit: '500mb', extended: true }));
app.use(cookieParser());
app.use(staticEx(join(_dirname, 'public')));
app.use(fileUpload({
  limits: {
    // When the frontend calls us with a mix of JSON and file data (encoded as
    // a multipart form), the fields are first parsed by busboy (a dependency
    // of the express-fileupload lib). Busboy limits the size of multipart fie.
    // to a really low value by default, so here we unshackle it. The overall
    // request continues to have an upper limit imposed by NGINX and the ingre:
    // controller.
    fieldSize: Infinity
  }
}));
const corsoptions = {
  origin: '*',
  allowedHeaders: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) chol
};
app.use(cors(corsoptions));

app.use('/*any', refererHeaderProxy)

app.use('/api/v1', getProxyCall('/api/v1'))
app.use('/ui/v1', getProxyCall('/ui/v1'))

function refererHeaderProxy(req: any, res: any, next: any) {
  const mfRoute = sanitizeMfRoute(getSingleHeaderValue(req.headers[mfRouteHeader]));
  const mfRouteFromQuery = sanitizeMfRoute(getSingleQueryValue(req.query?.[mfRouteQueryParam]));
  const mfRouteFromReferer = resolveMfRouteFromReferer(req.headers['referer']);
  const resolvedMfRoute = mfRoute || mfRouteFromQuery || mfRouteFromReferer;
  const shouldProxyMfModuleSource = isMfModuleSourceRequest(req);

  if (resolvedMfRoute && (shouldProxyViaMfRoute(req) || shouldProxyMfModuleSource)) {
    req.headers[mfRouteHeader] = resolvedMfRoute;
    console.log(`MF route '${resolvedMfRoute}' detected, proxying request to servicehub UI route`);
    getProxyCall('/ui/v1')(req, res, next);
    return;
  }

  const referer = req.headers['referer'];
  if (!referer) {
    next()
    return
  }
  try {
    const refererUrl = new URL(referer);
    if (normalizePath(refererUrl.pathname).startsWith('/ui/v1') && (shouldProxyViaMfRoute(req) || shouldProxyMfModuleSource)) {
      const proxyCall = getProxyCall('/ui/v1');
      // req.originalUrl = req.url; // preserve original url for logging
      // this call will get us to the servicehub, where 'proper' routing
      // based on manifests matching will take us to the correct MF remote
      console.log(`Referer header indicates this is a MF UI request, proxying to servicehub MF url ${Config.serviceHubMfUrl}`);
      console.log(`req.host: ${req.host}`)
      console.log(`req.hostname: ${req.hostname}`)
      console.log(`req.originalUrl: ${req.originalUrl}`)
      console.log(`req.path: ${req.path}`)
      console.log(`req.baseUrl: ${req.baseUrl}`)
      proxyCall(req, res, next);
      return;
    }
  } catch (err) {
    console.log(`Invalid referer header for MF routing: ${referer}, falling back to vite`);
  }
  next();
}

function isMfModuleSourceRequest(req: any): boolean {
  const requestPath = normalizePath(req.originalUrl || req.url || req.path || '/');
  if (!requestPath.startsWith('/src/')) {
    return false;
  }

  if (!isLikelyModuleScriptPath(requestPath)) {
    return false;
  }

  const routeFromHeader = sanitizeMfRoute(getSingleHeaderValue(req.headers?.[mfRouteHeader]));
  if (routeFromHeader) {
    return true;
  }

  const routeFromQuery = sanitizeMfRoute(getSingleQueryValue(req.query?.[mfRouteQueryParam]));
  if (routeFromQuery) {
    return true;
  }

  return !!resolveMfRouteFromReferer(req.headers?.referer);
}

function isLikelyModuleScriptPath(pathname: string): boolean {
  return /\.(?:mjs|js|mts|ts|jsx|tsx)$/.test(pathname);
}

function getProxyCall(proxyUrl: string) {
  return async function proxyCall(req: any, res: any, next: any) {
    // depending on up stream routing from vite / express,
    //  the original url requested by the client may be in req.url or req.originalUrl / req.baseUrl.
    //  We want to preserve the original url for logging and downstream routing,
    //  so we will use req.baseUrl for the referer header route, otherwise req.url
    // nb. req.url incudes the query params, baseUrl does not.
    console.log(`req.url: ${req.url}, req.baseUrl: ${req.baseUrl}, req.originalUrl: ${req.originalUrl}  , req.path: ${req.path}`);
    const originalPath = normalizePath(req.originalUrl || req.url || '/');
    const reqUrl = originalPath;

    let url
    try {
      console.log(`received request for url:${reqUrl}`);
      url = new URL(`${req.protocol}://${req.host}${reqUrl}`);
      console.log(`host is ${req.host}`);
    } catch (err) {
      console.log(`not a valid url for bff, so back to vite: ${req.protocol}://`);
      next(); // not a valid url so not for us
      return;
    }
    try {
      // Rewrite the request to point to the internal core df service
      // TODO: replace the simple 'internalHost' logic with a obfuscation layer
      // that maps external non-revealing host refs to internal hostnames
      const internalHost = `${url.host.split(':')[0]}:${Ports.core.serviceHub}`;
      const originalQueryIndex = (req.originalUrl || '').indexOf('?');
      const originalQuery = originalQueryIndex >= 0 ? (req.originalUrl || '').slice(originalQueryIndex) : '';
      const upstreamPath = reqUrl.startsWith(`${proxyUrl}/`) || reqUrl === proxyUrl
        ? reqUrl
        : `${proxyUrl}${reqUrl.startsWith('/') ? reqUrl : `/${reqUrl}`}`;
      const urlText = `${url.protocol}//${internalHost}${upstreamPath}${originalQuery}`;
      const newUrl = new URL(urlText);
      console.log(`MSP UI request to ${req.originalUrl} redirected to ${newUrl}`);
      console.log(`body type is ${typeof req.body}`);
      const bodyContent = (typeof req.body === 'string') ? req.body : JSON.stringify(req.body);
      const controller = new AbortController();
      const simpleHeaders = Object.entries(req.headers || {}).reduce((acc, [key, value]) => {
        if (Array.isArray(value)) {
          acc[key] = value.join(', ');
        } else if (value !== undefined) {
          acc[key] = (value ?? '').toString();
        }
        return acc;
      }, {} as Record<string, string>);

      delete simpleHeaders['if-none-match'];
      delete simpleHeaders['if-modified-since'];

      const upstreamRes = await fetch(newUrl,
        {
          ...req,
          method: req.method,
          body: req.method === 'GET' ? null : bodyContent,
          headers: {
            ...simpleHeaders,
            host: newUrl.host,
            'accept-encoding': 'identity'
          },
          signal: controller.signal
        }
      );
      if (upstreamRes.status === 304) {
        res.status(304);
        const allowed304Headers = [
          'etag', 'last-modified', 'cache-control', 'expires', 'date', 'vary'
        ];
        for (const header of allowed304Headers) {
          const value = upstreamRes.headers.get(header);
          if (value) {
            res.setHeader(header, value);
          }
        }
        res.end();
        return;
      }
      res.status(upstreamRes.status);
      upstreamRes.headers.forEach((value, key) => {
        if (shouldForwardResponseHeader(key)) {
          res.setHeader(key, value);
        }
      });

      if (upstreamRes.body) {
        await pipeline(upstreamRes.body as any, res);
      } else {
        res.end();
      }

      req.socket.on('close', () => {
        if (!res.writableEnded) {
          console.log('Request socket closed prematurely, aborting upstream request');
          controller.abort();
        }
      })

      console.log(`Bff request to ${req.originalUrl} completed with status ${upstreamRes.status}`);
      return
    } catch (err) {
      console.error(`Error processing Bff request to ${req.originalUrl}:`, err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

function normalizePath(path: string): string {
  return path.split('?')[0] || '/';
}

function getSingleHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getSingleQueryValue(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : undefined;
  }

  return typeof value === 'string' ? value : undefined;
}

function sanitizeMfRoute(route: string | undefined): string | undefined {
  if (!route) {
    return undefined;
  }

  const trimmed = route.trim();
  if (!trimmed) {
    return undefined;
  }

  if (reservedMfRoutePrefixes.some((prefix) => trimmed.startsWith(prefix))) {
    return undefined;
  }

  if (reservedMfRouteNames.has(trimmed)) {
    return undefined;
  }

  return trimmed;
}

function resolveMfRouteFromReferer(refererHeader: string | string[] | undefined): string | undefined {
  const refererValue = Array.isArray(refererHeader) ? refererHeader[0] : refererHeader;
  if (!refererValue) {
    return undefined;
  }

  try {
    const refererUrl = new URL(refererValue);
    const routeFromQuery = sanitizeMfRoute(refererUrl.searchParams.get(mfRouteQueryParam) ?? undefined);
    if (routeFromQuery) {
      return routeFromQuery;
    }

    const normalizedPath = normalizePath(refererUrl.pathname);
    const routeFromMfPath = inferMfRouteFromPath(normalizedPath);
    if (routeFromMfPath) {
      return routeFromMfPath;
    }

    const uiPath = normalizedPath.split('/ui/v1/')[1];
    if (!uiPath) {
      return undefined;
    }

    const firstSegment = sanitizeMfRoute(uiPath.split('/')[0]);
    if (!firstSegment || firstSegment === 'node_modules') {
      return undefined;
    }

    return firstSegment;
  } catch (_error) {
    return undefined;
  }
}

function inferMfRouteFromPath(pathname: string): string | undefined {
  const normalizedPath = normalizePath(pathname);

  const tempMatch = normalizedPath.match(/(?:^|\/)(?:ui\/v1\/)?\.__mf__temp\/([^\/]+)\//);
  if (tempMatch?.[1]) {
    if (tempMatch[1] === 'host') {
      return undefined;
    }
    return `${tempMatch[1]}_remoteEntry.js`;
  }

  const virtualMatch = normalizedPath.match(/__mf__virtual_([^_\/]+)__mf_v__/);
  if (virtualMatch?.[1]) {
    if (virtualMatch[1] === 'host') {
      return undefined;
    }
    return `${virtualMatch[1]}_remoteEntry.js`;
  }

  const loadShareMatch = normalizedPath.match(/(?:^|\/)(?:ui\/v1\/)?node_modules\/(?:\.vite\/deps\/)?__mf__virtual\/([^_\/]+)__loadShare__/);
  if (loadShareMatch?.[1]) {
    if (loadShareMatch[1] === 'host') {
      return undefined;
    }
    return `${loadShareMatch[1]}_remoteEntry.js`;
  }

  return undefined;
}

function shouldProxyViaMfRoute(req: any): boolean {
  const requestPath = normalizePath(req.originalUrl || req.url || req.path || '/');

  if (requestPath.startsWith('/ui/v1/')) {
    return true;
  }

  if (requestPath.startsWith('/@id/virtual:mf-')) {
    return true;
  }

  if (requestPath.startsWith('/.__mf__temp/')) {
    return true;
  }

  if (
    requestPath.startsWith('/node_modules/.vite/deps/__mf__virtual')
    || requestPath.startsWith('/node_modules/__mf__virtual')
  ) {
    return true;
  }

  if (requestPath.startsWith('/@fs/') && requestPath.includes('/__mf__temp/')) {
    return true;
  }

  return false;
}

function shouldForwardResponseHeader(headerName: string): boolean {
  const blockedHeaders = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'content-encoding',
    'content-length',
    'etag',
  ]);

  return !blockedHeaders.has(headerName.toLowerCase());
}

app.use((req, _res, next) => {
  console.log(`Bff passing through request for url:${req.url} back to vite`);
  next();
});

export default app;
