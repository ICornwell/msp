import { default as express } from "express";
import { pipeline } from "node:stream/promises";
import { getRegisteredFeaturesByAlias } from './services/uiFeatureRegistry.js';
import fetch from 'node-fetch';

const router = express.Router();

// Module Federation remote handler
// Receives: https://servicehub_hostname:443/ui/v1/:featureName/...
// Routes to actual MF remote based on manifest

router.get('/:alias/*route',  handleUiRequest);
  
async function handleUiRequest  (req: any, res: any)  {
  try {
    const alias = req.params.alias.toLowerCase();
    const route = req.params.route?.join('/') ?? '/';

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
    const targetUrl = `${targetBaseUrl}/${route}`;

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

    // const contentType = response.headers.get('content-type') || '';
    // if (shouldRewriteRemoteEntryResponse(req.url, contentType)) {
    //   console.log(`UI MF routing: rewriting remoteEntry virtual imports for route '${alias}'`);
    //   const responseText = await response.text();
    //   const rewrittenText = injectRouteTokenIntoVirtualImports(responseText, alias);
    //   res.end(rewrittenText);
    //   return;
    // }

    // if (shouldRewriteVirtualExposesResponse(req.url, contentType)) {
    //   console.log(`UI MF routing: rewriting virtual exposes source imports for route '${alias}'`);
    //   const responseText = await response.text();
    //   const rewrittenText = rewriteVirtualExposesSourceImports(responseText, alias);
    //   res.end(rewrittenText);
    //   return;
    // }

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



// function normalizePath(path: string): string {
//   return path.split('?')[0] || '/';
// }

// function shouldRewriteRemoteEntryResponse(requestPath: string, contentType: string): boolean {
//   const normalizedPath = normalizePath(requestPath);
//   return normalizedPath.endsWith('_remoteEntry.js') && contentType.toLowerCase().includes('javascript');
// }

// function shouldRewriteVirtualExposesResponse(requestPath: string, contentType: string): boolean {
//   const normalizedPath = normalizePath(requestPath);
//   return normalizedPath.includes('/@id/virtual:mf-exposes') && contentType.toLowerCase().includes('javascript');
// }

// function injectRouteTokenIntoVirtualImports(sourceText: string, alias: string): string {
//   const quotedPathRegex = /(["'])(\/(?:@id\/virtual:mf-[^"'?#]+|\.__mf__temp\/[^"'?#]+|node_modules\/(?:\.vite\/deps\/)?__mf__virtual[^"'?#]+))(\1)/g;

//   return sourceText.replace(quotedPathRegex, (_match, quote: string, path: string) => {
//     const proxyScopedPath = ensureUiProxyPrefix(path, alias);
//     return `${quote}${proxyScopedPath}${quote}`;
//   });
// }

// function rewriteVirtualExposesSourceImports(sourceText: string, alias: string): string {
//   return sourceText.replace(/(["'])(\/src\/[^"']+)(\1)/g, (_match, quote: string, sourcePath: string) => {
//     const proxyPath = ensureUiProxyPrefix(sourcePath, alias);
//     return `${quote}${proxyPath}${quote}`;
//   });
// }

// function ensureUiProxyPrefix(path: string, alias: string): string {
//   if (path.startsWith(`/ui/v1/${alias}/`)) {
//     return path;
//   }

//   if (path.startsWith('/ui/v1/')) {
//     return path;
//   }

//   return `/ui/v1/${encodeURIComponent(alias)}${path}`;
// }

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
