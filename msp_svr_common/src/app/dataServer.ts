// Common API Server
import { createApp } from './api.js';

import { ActivitySet, ServiceActivity } from '../service-manager/index.js';
import { Config } from '../sharedconfig.js';
import { SERVICE_TYPE } from './server.js';
import { InboundRequestAuthPolicy } from '../als/authMiddleware.js';


export function startMspDataServer(
  config: Partial<Config>,
  serviceType: SERVICE_TYPE = SERVICE_TYPE.DATA,
  serviceActivities: ActivitySet | ServiceActivity[] | ServiceActivity,
  inboundRequestAuthPolicy?: InboundRequestAuthPolicy,
) {

  const PORT = Number.parseInt(config.myDataPort || '443', 10);
  console.log(`Starting MSP Data Server on port ${PORT} with service type ${serviceType}`);


  // Start the server
  const app = createApp(config, serviceType, serviceActivities, inboundRequestAuthPolicy);
  const server = app.listen(PORT, () => {
    console.log(`\n🚀Data API server running on ${config.myDataUrl}`);
    console.log(`   - Health check: ${config.myDataUrl}/health`);
    console.log(`   - API endpoint: ${config.myDataUrl}/api/v1/data/run`);
    console.log(`   - ServiceHub:   ${config.serviceHubApiUrl}\n`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('\nSIGINT signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });

  return {server, app}
}


