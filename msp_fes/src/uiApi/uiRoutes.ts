import { default as express } from "express";
import { getConfig } from "msp_common";

const router = express.Router();

// DMZ Gateway for Module Federation remote loads
// Client hits: https://site_hostname:443/ui/v1/...
// DMZ proxies to: https://servicehub_hostname:443/ui/v1/...
// Servicehub uses manifests to route to actual MF remotes

const getServiceHubUrl = () => getConfig().serviceHubMfUrl || getConfig().serviceHubApiUrl || 'http://localhost:4001';

// Module Federation remote proxy - keeps client proxy-blind
router.get('/*', async (req, res) => {
  try {
    const serviceHubUrl = getServiceHubUrl();
    const remotePath = req.path; // Includes leading slash
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    
    const targetUrl = `${serviceHubUrl}/ui/v1${remotePath}${queryString}`;
    console.log(`UI MF proxy: ${req.originalUrl} → ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: extractForwardHeaders(req)
    });

    // Forward status and headers for proper caching/304 handling
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Handle 304 Not Modified
    if (response.status === 304) {
      res.end();
      return;
    }

    // Stream response body
    if (response.body) {
      const reader = response.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
        res.end();
      };
      await pump();
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
  const forwardHeaders = ['authorization', 'x-correlation-id', 'x-request-id', 'user-agent', 'if-none-match', 'if-modified-since', 'cache-control'];
  
  for (const header of forwardHeaders) {
    const value = req.headers[header];
    if (value) {
      headers[header] = Array.isArray(value) ? value[0] : value;
    }
  }
  
  return headers;
}

export default router;
