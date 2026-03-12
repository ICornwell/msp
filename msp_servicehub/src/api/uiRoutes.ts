import { default as express } from "express";
import { getRegisteredFeatures } from './services/uiFeatureRegistry.js';
import fetch from 'node-fetch';
import { isMatch, bestVersionMatch } from 'msp_common'

const router = express.Router();

// Module Federation remote handler
// Receives: https://servicehub_hostname:443/ui/v1/:featureName/...
// Routes to actual MF remote based on manifest

router.get('/:featureNamespace/:featureName/:version', async (req, res) => {
  try {
    const featureNamespace = req.params.featureNamespace;
    const featureName = req.params.featureName;
    const version = req.params.version;
    
    
    // Look up feature in registry
    const features = getRegisteredFeatures();
    const candidateFeatures = features.filter(f => isMatch(f.featureName, featureName)
        && isMatch(f.namespace, featureNamespace));

    const bestFeatures = bestVersionMatch(candidateFeatures, version,
      (f) => `${f.featureName}-${f.namespace }`
      , (f) => f.version, (f) => (f.matchingVersionRange ?? 'none'));
    
    if (bestFeatures.length === 0) {
      console.error(`Feature not found: ${featureName}`);
      res.status(404).json({
        success: false,
        message: `Feature '${featureName}' not found in registry`
      });
      return;
    }
    const feature = bestFeatures[0]; // TODO: algorithm for multiple matches?
    
    // Build target URL from manifest
    // feature.serviceUrl is the base, remotePath is appended
    const targetUrl = `${feature.serviceUrl}/${feature.remotePath}`;
    console.log(`UI MF routing: ${featureName}/${feature.remotePath} → ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: extractForwardHeaders(req)
    });

    // Forward status and headers
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
      response.body.pipe(res);
    } else {
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
