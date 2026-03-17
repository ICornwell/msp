import { default as express } from "express";
import { pipeline } from "node:stream/promises";
import { getRegisteredFeaturesByAlias } from './services/uiFeatureRegistry.js';
import fetch from 'node-fetch';

const router = express.Router();
const mfRouteHeader = 'x-msp-mf-route';
const mfRouteQueryParam = '__msp_mf_route';
const reservedMfRoutePrefixes = ['@', '.'];
const reservedMfRouteNames = new Set(['src', 'node_modules']);

// Module Federation remote handler
// Receives: https://servicehub_hostname:443/ui/v1/:featureName/...
// Routes to actual MF remote based on manifest

router.get('/:alias',  handleUiRequest);
router.get('/*any',  handleUiRequest); 
  
async function handleUiRequest  (req: any, res: any)  {
  try {
    let alias = sanitizeMfRoute(getSingleHeaderValue(req.headers[mfRouteHeader]))
      || sanitizeMfRoute(getSingleQueryValue(req.query?.[mfRouteQueryParam]));
    if (!alias) {
      alias = resolveAliasFromRequestPath(req.path);
    }
    if (!alias) {
      console.log(`No alias in path, checking referer header for routing info`);
      alias = resolveAliasFromReferer(req.headers['referer']);
    }

    if (!alias) {
      console.error(`Routing info not found for alias: ${alias} or referer: ${req.headers['referer']}`);
      res.status(404).json({
        success: false,
        message: `No routing info found for request: alias: ${alias} or referer: ${req.headers['referer']}`
      });
      return;
    }

    let feature = getRegisteredFeaturesByAlias()[alias]?.[1]
    if (feature) {
      console.log(`UI MF routing: found feature for alias ${alias} → ${feature.name}`);
    }


    if (!feature) {
      console.error(`Feature not found for alias: ${alias} or referer: ${req.headers['referer']}`);
      res.status(404).json({
        success: false,
        message: `Feature '${alias}' not found in registry`
      });
      return;
    }
    const targetBaseUrl = feature.serverMFUrl || feature.serverUrl;
    const targetUrl = joinTargetUrl(targetBaseUrl, req.url);

    console.log(`UI MF routing: ${feature.name}/${req.url} → ${targetUrl}`);
    console.log(`UI MF routing: proxying request for ${req.url} to ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        ...extractForwardHeaders(req),
        'accept-encoding': 'identity',
      }
    });
    console.log(`UI MF routing: received response for ${req.url} from ${targetUrl}`);
    // Forward status and headers
    res.status(response.status);
    res.setHeader(mfRouteHeader, alias);
    response.headers.forEach((value, key) => {
      if (shouldForwardResponseHeader(key)) {
        console.log(`servicehub forwarding header ${key}: ${value}`);
        res.setHeader(key, value);
      }
    });

    // Handle 304 Not Modified
    if (response.status === 304) {
      console.log(`UI MF routing: received 304 Not Modified for ${req.url} from ${targetUrl} - ending response without body`);
      res.status(304);
      res.end();
      return;
    }

    const contentType = response.headers.get('content-type') || '';
    if (shouldRewriteRemoteEntryResponse(req.url, contentType)) {
      console.log(`UI MF routing: rewriting remoteEntry virtual imports for route '${alias}'`);
      const responseText = await response.text();
      const rewrittenText = injectRouteTokenIntoVirtualImports(responseText);
      res.end(rewrittenText);
      return;
    }

    if (shouldRewriteVirtualExposesResponse(req.url, contentType)) {
      console.log(`UI MF routing: rewriting virtual exposes source imports for route '${alias}'`);
      const responseText = await response.text();
      const rewrittenText = rewriteVirtualExposesSourceImports(responseText, alias);
      res.end(rewrittenText);
      return;
    }

    // Stream response body
    if (response.body) {
      console.log(`UI MF routing: streaming response body for ${req.url} from ${targetUrl}`);
      await pipeline(response.body as any, res);
      console.log(`UI MF routing: finished streaming response body for ${req.url} from ${targetUrl}`);
    } else {
      console.log(`UI MF routing: no response body for ${req.url} from ${targetUrl} - ending response`);
      res.end();
    }
  } catch (error: any) {
    console.error('UI MF routing error:', error);
    res.status(500).json({
      success: false,
      message: 'Module Federation routing failed',
      error: error?.message
    });
  }
}

function joinTargetUrl(baseUrl: string | undefined, requestPath: string): string {
  const normalizedBaseUrl = (baseUrl || '').replace(/\/+$/, '');
  const upstreamRequestPath = stripMspQueryParams(stripUiProxyPrefix(requestPath));
  const normalizedRequestPath = upstreamRequestPath.startsWith('/') ? upstreamRequestPath : `/${upstreamRequestPath}`;

  return `${normalizedBaseUrl}${normalizedRequestPath}`;
}

function stripUiProxyPrefix(path: string): string {
  const strippedPath = path.replace(/^\/ui\/v1(?=\/|\?|$)/, '');
  return strippedPath || '/';
}

function stripMspQueryParams(pathWithQuery: string): string {
  const [pathOnly, queryString] = pathWithQuery.split('?');
  if (!queryString) {
    return pathOnly;
  }

  const params = new URLSearchParams(queryString);
  for (const key of [...params.keys()]) {
    if (key.toLowerCase().startsWith('__msp')) {
      params.delete(key);
    }
  }

  const sanitizedQuery = params.toString();
  return sanitizedQuery ? `${pathOnly}?${sanitizedQuery}` : pathOnly;
}

function resolveAliasFromReferer(refererHeader: string | string[] | undefined): string | undefined {
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

    const refererPath = normalizePath(refererUrl.pathname);
    const routeFromMfPath = inferMfRouteFromPath(refererPath);
    if (routeFromMfPath) {
      return routeFromMfPath;
    }

    const uiRouteAlias = sanitizeMfRoute(refererPath.split('/ui/v1/')[1]?.split('/')[0]);
    return uiRouteAlias;
  } catch (error) {
    console.log(`UI MF routing: invalid referer '${refererValue}'`);
    return undefined;
  }
}

function normalizePath(path: string): string {
  return path.split('?')[0] || '/';
}

function shouldRewriteRemoteEntryResponse(requestPath: string, contentType: string): boolean {
  const normalizedPath = normalizePath(requestPath);
  return normalizedPath.endsWith('_remoteEntry.js') && contentType.toLowerCase().includes('javascript');
}

function shouldRewriteVirtualExposesResponse(requestPath: string, contentType: string): boolean {
  const normalizedPath = normalizePath(requestPath);
  return normalizedPath.includes('/@id/virtual:mf-exposes') && contentType.toLowerCase().includes('javascript');
}

function injectRouteTokenIntoVirtualImports(sourceText: string): string {
  const quotedPathRegex = /(["'])(\/(?:@id\/virtual:mf-[^"'?#]+|\.__mf__temp\/[^"'?#]+|node_modules\/(?:\.vite\/deps\/)?__mf__virtual[^"'?#]+))(\1)/g;

  return sourceText.replace(quotedPathRegex, (_match, quote: string, path: string) => {
    const proxyScopedPath = ensureUiProxyPrefix(path);
    return `${quote}${proxyScopedPath}${quote}`;
  });
}

function rewriteVirtualExposesSourceImports(sourceText: string, alias: string): string {
  // Keep source module imports on the routed proxy path so they resolve against
  // the remote Vite server instead of host /src.
  const encodedAlias = encodeURIComponent(alias);
  return sourceText.replace(/(["'])(\/src\/[^"']+)(\1)/g, (_match, quote: string, sourcePath: string) => {
    const proxyPath = ensureUiProxyPrefix(sourcePath);
    const routeQuery = proxyPath.includes('?')
      ? `&${mfRouteQueryParam}=${encodedAlias}`
      : `?${mfRouteQueryParam}=${encodedAlias}`;

    return `${quote}${proxyPath}${routeQuery}${quote}`;
  });
}

function ensureUiProxyPrefix(path: string): string {
  if (path.startsWith('/ui/v1/')) {
    return path;
  }

  return `/ui/v1${path}`;
}

function resolveAliasFromRequestPath(path: string | undefined): string | undefined {
  const normalizedPath = normalizePath(path || '/');
  const segments = normalizedPath.split('/').filter(Boolean);

  // Treat only single-segment /ui/v1/<alias> paths as alias paths.
  // Multi-segment requests (for example /@id/virtual:mf-exposes) must use
  // route header/query/referer based resolution.
  if (segments.length === 1) {
    return segments[0];
  }

  return undefined;
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

function inferMfRouteFromPath(pathname: string): string | undefined {
  const normalizedPath = normalizePath(pathname);

  const tempMatch = normalizedPath.match(/(?:^|\/)(?:ui\/v1\/)?\.__mf__temp\/([^\/]+)\//);
  if (tempMatch?.[1] && tempMatch[1] !== 'host') {
    return `${tempMatch[1]}_remoteEntry.js`;
  }

  const virtualMatch = normalizedPath.match(/__mf__virtual_([^_\/]+)__mf_v__/);
  if (virtualMatch?.[1] && virtualMatch[1] !== 'host') {
    return `${virtualMatch[1]}_remoteEntry.js`;
  }

  const loadShareMatch = normalizedPath.match(/(?:^|\/)(?:ui\/v1\/)?node_modules\/(?:\.vite\/deps\/)?__mf__virtual\/([^_\/]+)__loadShare__/);
  if (loadShareMatch?.[1] && loadShareMatch[1] !== 'host') {
    return `${loadShareMatch[1]}_remoteEntry.js`;
  }

  return undefined;
}

function extractForwardHeaders(req: express.Request): Record<string, string> {
  const headers: Record<string, string> = {};
  const forwardHeaders = [
    'authorization',
    'x-correlation-id',
    'x-request-id',
    'user-agent',
    'cache-control',
    'accept',
    'referer',
    'origin',
  ];

  for (const header of forwardHeaders) {
    if (header.toLowerCase().startsWith('x-msp')) {
      continue;
    }

    const value = req.headers[header];
    if (value) {
      headers[header] = Array.isArray(value) ? value[0] : value;
    }
  }

  return headers;
}

function shouldForwardResponseHeader(headerName: string): boolean {
  const hopByHopHeaders = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    // fetch may transparently decompress upstream payloads. Do not forward
    // encoding/length validators that could describe the pre-decoded body.
    'content-encoding',
    'content-length',
    'etag',
  ]);

  return !hopByHopHeaders.has(headerName.toLowerCase());
}

export default router;
