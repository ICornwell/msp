import { default as express } from "express";
import { serviceManager } from "msp_svr_common";
import { simpleViewActivitySet} from "./activities/dgmAccess.js"
import { DataRequestEnvelope, DataViewQueryEnvelope, DataViewUpsertEnvelope, ServiceRequestEnvelope } from "msp_common";
import { routeServiceActivity } from "./services/serviceActivityRouter.js";
import { routeDataActivity } from "./services/dataActivityRouter.js";

const router = express.Router();
const dataServices = serviceManager();
dataServices.use(simpleViewActivitySet);

router.get("/test", (_req, res) => {
  res.status(200).json({
    status: "ok"
  });
});

router.put('/data', async (req, res) => {
  const request = req.body as DataRequestEnvelope;

  if (!request?.namespace || !request?.activityName || !request?.version) {
    res.status(400).json({
      success: false,
      message: 'Invalid service request: namespace, activityName and version are required.'
    });
    return;
  }

  try {
    const result = await routeDataActivity(
      request.namespace,
      request.activityName,
      request.version,
      request.variantName || 'default',
      request.payload,
      request.context
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


router.put('/view/write', async (req, res) => {
  const request = req.body as DataViewUpsertEnvelope;

  if (!request?.payload?.view || !request?.payload?.data) {
    res.status(400).json({
      success: false,
      message: 'Invalid data upsert request: view and data are required.'
    });
    return;
  }
  try {
    const result = await dataServices.runAllMatches(
      'datahub_dgm',
      'writeDataView',
      '1.0.0',
      'default',
      request.payload,
    );

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Data upsert execution failed.',
      error: error?.message ?? String(error),
    });
  }
});

router.put('/view/read', async (req, res) => {
  const request = req.body as DataViewQueryEnvelope;

  if (!request?.payload?.view ) {
    res.status(400).json({
      success: false,
      message: 'Invalid data query request: view is required.'
    });
    return;
  }

  try {
    const result = await dataServices.runAllMatches(
      'datahub_dgm',
      'readDataView',
      '1.0.0',
      'default',
      request.payload,
    );

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Data query execution failed.',
      error: error?.message ?? String(error),
    });
  }
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
    const result = await routeServiceActivity(
      request.namespace,
      request.activityName,
      request.version,
      request.variantName || 'default',
      request.payload,
      request.context
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