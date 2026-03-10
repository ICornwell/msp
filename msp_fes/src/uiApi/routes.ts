import { default as express } from "express";
import { getConfig } from "msp_common";

const router = express.Router();

// DMZ Gateway - Simple pass-through to servicehub in protected zone
// All business logic, activity registration, and delegation happens in servicehub

const getServiceHubUrl = () => getConfig().serviceHubApiUrl || 'http://localhost:4001';

// Legacy POST endpoint for backward compatibility - proxy to servicehub
router.post("/:namespace/:activityName", async (req, res) => {
  try {
    const serviceHubUrl = getServiceHubUrl();
    const response = await fetch(`${serviceHubUrl}/api/v1/service/run`, {
      method: 'PUT',
      headers: { 
        'content-type': 'application/json',
        ...extractForwardHeaders(req)
      },
      body: JSON.stringify({
        namespace: req.params.namespace,
        activityName: req.params.activityName,
        version: '1.0.0',
        payload: req.body
      })
    });

    const result = await response.json();
    res.status(response.status).json({
      status: response.ok ? "ok" : "error",
      serviceResult: result
    });
  } catch (error: any) {
    console.error('DMZ gateway error:', error);
    res.status(500).json({
      status: "error",
      message: 'Gateway communication failed',
      error: error?.message
    });
  }
});

// Standard service execution endpoint - proxy to servicehub
router.put('/service/run', async (req, res) => {
  try {
    const serviceHubUrl = getServiceHubUrl();
    const response = await fetch(`${serviceHubUrl}/api/v1/service/run`, {
      method: 'PUT',
      headers: { 
        'content-type': 'application/json',
        ...extractForwardHeaders(req)
      },
      body: JSON.stringify(req.body)
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
  const headers: Record<string, string> = {};
  const forwardHeaders = ['authorization', 'x-correlation-id', 'x-request-id', 'user-agent'];
  
  for (const header of forwardHeaders) {
    const value = req.headers[header];
    if (value) {
      headers[header] = Array.isArray(value) ? value[0] : value;
    }
  }
  
  return headers;
}

export default router;