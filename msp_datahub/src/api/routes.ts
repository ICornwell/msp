import { default as express } from "express";
import { serviceManager } from "msp_common";
import { discoveryActivitySet } from "./activities/discovery.js";
import { discoveryActivitySet as dgmActivitySet } from "./activities/dgmAccess.js";

const router = express.Router();

type ServiceRequestEnvelope = {
  namespace: string;
  activityName: string;
  version: string;
  payload: any;
  context?: string;
  correlationId?: string;
};

const services = serviceManager();
services.use(discoveryActivitySet);
services.use(dgmActivitySet);

router.get("/test", (_req, res) => {
  res.status(200).json({
    status: "ok"
  });
});

router.put('/service/run', async (req, res) => {
  const request = req.body as ServiceRequestEnvelope;

  if (!request?.namespace || !request?.activityName || !request?.version) {
    res.status(400).json({
      success: false,
      message: 'Invalid service request: namespace, activityName and version are required.'
    });
    return;
  }

  try {
    const result = await services.runAllMatches(
      request.namespace,
      request.activityName,
      request.version,
      request.payload,
    );

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Service execution failed.',
      error: error?.message ?? String(error),
    });
  }
});

export default router;