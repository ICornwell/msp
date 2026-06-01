// Common API Server
import { createApp } from './api.js';

import { registerWithRetry } from './manifestRegistration.js';
import { ActivitySet, Manifest, Config, ServiceActivity } from 'msp_svr_common';
export type SERVICE = 'service';
export type DATA = 'data';
export enum SERVICE_TYPE { SERVICE = 'service', DATA = 'data' }

export function startMspServer(
  config: Partial<Config>,
  manifest: Partial<Manifest>,
  serviceType: SERVICE_TYPE = SERVICE_TYPE.SERVICE,
  serviceActivities: ActivitySet | ServiceActivity[] | ServiceActivity) {

  const PORT = config.myPort || 443

  // Start the server
  const app = createApp(config, serviceType, serviceActivities);
  const server = app.listen(PORT, () => {
    console.log(`\n🚀Service API server running on ${config.myUrl}`);
    console.log(`   - Health check: ${config.myUrl}/health`);
    console.log(`   - API endpoint: ${config.myUrl}/api/v1/service/run`);
    console.log(`   - ServiceHub:   ${config.serviceHubApiUrl}\n`);

    // Register with servicehub in the background (with retry)
    registerWithRetry(config, manifest).then(() => {
      console.log(`✓ ${config.product?.domain}-${config.product?.name} is fully operational and registered with servicehub`);
    });
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
