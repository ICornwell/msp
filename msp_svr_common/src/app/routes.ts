import { default as express } from "express";
import { ActivitySet, ServiceActivity, serviceManager } from "../service-manager/index.js";
import { DataRequestEnvelope } from "msp_common";
import { SERVICE_TYPE } from "./server.js";



export function getRoutes(serviceType: SERVICE_TYPE, serviceActivities: ActivitySet | ServiceActivity[] | ServiceActivity) {

  const router = express.Router();

  type ServiceRequestEnvelope = {
    namespace: string;
    activityName: string;
    version: string;
    payload: any;
    context?: string;
    correlationId?: string;
  };

  // Create service manager and register activities
  const services = serviceManager();
  services.use(serviceActivities);

  let activities = Array.isArray(serviceActivities) ? serviceActivities : (serviceActivities as ActivitySet).activities ?? [serviceActivities];
  console.log(`Handling ${activities.length} activities for service type ${serviceType}:`);
  activities.forEach(activity => {
    console.log(`Handling activity: ${activity.namespace}-${activity.activityName} v${activity.version} (context: ${activity.context})`);
   })


  router.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "actorwork"
    });
  });

  if (serviceType === 'service') {
    console.log('Registering service route: PUT /service/run');
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
  }

  if (serviceType === 'data') {
    console.log('Registering data route: PUT /data');
    router.put('/data', async (req, res) => {
      const request = req.body as DataRequestEnvelope;

      if (!request?.namespace || !request?.activityName || !request?.version) {
        res.status(400).json({
          success: false,
          message: 'Invalid data service request: namespace, activityName and version are required.'
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
          message: 'Data service execution failed.',
          error: error?.message ?? String(error),
        });
      }
    });
  }
  return router;
}

