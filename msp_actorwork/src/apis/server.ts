// Actorwork API Server
import app from './api.js';
import { config } from './config.js';
import { registerWithRetry, registerUiFeatures } from './manifestRegistration.js';

const PORT = config.port;

// Start the server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Actorwork API server running on ${config.myUrl}`);
  console.log(`   - Health check: ${config.myUrl}/health`);
  console.log(`   - API endpoint: ${config.myUrl}/api/v1/service/run`);
  console.log(`   - ServiceHub:   ${config.serviceHubUrl}\n`);

  // Register with servicehub in the background (with retry)
  registerWithRetry().then(() => {
    // Once registered, also register UI features
    registerUiFeatures();
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

export default server;
