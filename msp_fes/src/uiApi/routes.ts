import { default as express } from "express";
import { getConfig } from "msp_svr_common";

const router = express.Router();

// DMZ Gateway - Simple pass-through to servicehub in protected zone
// All business logic, activity registration, and delegation happens in servicehub

const getServiceHubUrl = () => getConfig().serviceHubApiUrl || 'http://localhost:4001';
const getSecurityServiceUrl = () => process.env['MSP_SECURITY_API_URL'] || 'http://localhost:4005';

// Standard service execution endpoint - proxy to servicehub
router.put('/service/run', async (req, res) => {
  try {
    console.log('Received request to /service/run');
    const serviceHubUrl = getServiceHubUrl();
    const response = await fetch(`${serviceHubUrl}/api/v1/service/run`, {
      method: 'PUT',
      headers: { 
        'content-type': 'application/json',
        ...extractForwardHeaders(req)
      },
      body: JSON.stringify({
        namespace: req.body.namespace || 'default',
        activityName: req.body.activityName || 'default',
        version: req.body.version ||'1.0.0',
        payload: req.body.payload | req.body
      })
    });

    const result = await response.json();
    res.status(response.status).json(result);
  } catch (error: any) {
    console.error('DMZ gateway error:', error);
    res.status(500).json({
      success: false,
      message: 'Gateway communication failed',
      error: error?.message
    });
  }
});

function extractForwardHeaders(req: express.Request): Record<string, string> {
  console.log('Extracting headers from request');
  const headers: Record<string, string> = {};
  const forwardHeaders = ['authorization', 'x-correlation-id', 'x-request-id', 'user-agent'];
  
  for (const header of forwardHeaders) {
    console.log(`Checking for header: ${header}`);
    const value = req.headers[header];
    if (value) {
      console.log(`Forwarding header: ${header}=${value}`);
      headers[header] = Array.isArray(value) ? value[0] : value;
    }
  }
  
  return headers;
}

// Public endpoint — proxies encryption public key from msp_security to UI.
// No auth required: the public key is safe to expose by definition.
router.get('/security/encryption-key', async (_req, res) => {
  try {
    const secUrl = getSecurityServiceUrl();
    const response = await fetch(`${secUrl}/discovery/encryption-public-key`);
    const body = await response.json();
    res.status(response.status).json(body);
  } catch (error: any) {
    res.status(502).json({
      success: false,
      message: 'Could not fetch encryption public key from security service',
      error: error?.message,
    });
  }
});

export default router;