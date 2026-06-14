import { default as express } from "express";
import { routeDataActivity, routeServiceActivity } from "./services/activityRouter.js";
import { DataRequestEnvelope, DataViewIdQueryEnvelope, DataViewIdUpsertEnvelope } from "msp_common";
import { tryDirectReadViews, tryDirectWriteViews, tryViewActivities } from "./services/dataRouter.js";

const router = express.Router();

type ServiceRequestEnvelope = {
  namespace: string;
  activityName: string;
  version: string;
  variantName?: string;
  payload: any;
  context?: string;
  correlationId?: string;
};

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
      request.payload,);

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
  const request = req.body as DataViewIdUpsertEnvelope;

  if (!request?.payload?.viewId || !request?.payload?.data) {
    res.status(400).json({
      success: false,
      message: 'Invalid data upsert request: viewId and data are required.'
    });
    return;
  }
  try {
    const result = await tryViewActivities(true, request);

    if (result) {
      res.status(200).json(result);
      return
    }

    const directResult = await tryDirectWriteViews(request);
    if (directResult) {
      res.status(200).json(directResult);
      return
    }

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Data upsert execution failed.',
      error: error?.message ?? String(error),
    });
  }
});

router.put('/view/read', async (req, res) => {
  const request = req.body as DataViewIdQueryEnvelope;

  if (!request?.payload?.viewId || !request?.payload?.id) {
    res.status(400).json({
      success: false,
      message: 'Invalid data query request: viewId and id are required.'
    });
    return;
  }

  try {
    const result = await tryViewActivities(false, request);
    if (result) {
      res.status(200).json(result);
      return
    }
    const directResult = await tryDirectReadViews(request);
    if (directResult) {
      res.status(200).json(directResult);
      return
    }

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Data query execution failed.',
      error: error?.message ?? String(error),
    });
  }
});





export default router;