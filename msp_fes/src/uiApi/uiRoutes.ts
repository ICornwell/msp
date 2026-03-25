import { default as express } from "express";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { getConfig } from "msp_common";

const router = express.Router();

// DMZ Gateway for Module Federation remote loads
// Client hits: https://site_hostname:443/ui/v1/...
// DMZ proxies to: https://servicehub_hostname:443/ui/v1/...
// Servicehub uses manifests to route to actual MF remotes

const getServiceHubUrl = () => getConfig().serviceHubMfUrl || getConfig().serviceHubApiUrl || 'http://localhost:4001';

// Module Federation remote proxy - keeps client proxy-blind
router.get('/*all', async (req, res) => {
  try {
    console.log(`UI MF proxy request: ${req.originalUrl}`);
    const serviceHubUrl = getServiceHubUrl();
    const remotePath = req.path; // Includes leading slash, but without the /ui/v1 prefix, since that is stripped by the route handler in uiRoutes.ts before proxying to servicehub.
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    
    const targetUrl = `${serviceHubUrl}/ui/v1${remotePath}${queryString}`;
    console.log(`UI MF proxy: ${req.originalUrl} → ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        ...extractForwardHeaders(req),
        'accept-encoding': 'identity',
      }
    });
    console.log(`UI MF proxy response: ${req.originalUrl} → ${targetUrl}: status ${response.status}`);
    // Forward status and headers for proper caching/304 handling
    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (shouldForwardResponseHeader(key)) {
        console.log (`fes-bff forwarding header ${key}: ${value}`);
        res.setHeader(key, value);
      }
    });

    // Handle 304 Not Modified
    if (response.status === 304) {
      res.end();
      return;
    }

    // Stream response body
    if (response.body) {
      await pipeline(Readable.fromWeb(response.body as any), res);
    } else {
      res.end();
    }
  } catch (error: any) {
    console.error('UI MF proxy error:', error);
    res.status(500).json({
      success: false,
      message: 'Module Federation proxy failed',
      error: error?.message
    });
  }
});

function extractForwardHeaders(req: express.Request): Record<string, string> {
  const headers: Record<string, string> = {};
  const forwardHeaders = ['authorization', 'x-correlation-id', 'x-request-id', 'user-agent', 'cache-control'];
  
  for (const header of forwardHeaders) {
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
