// Actorwork API Server
import app from './api.js';
import { Config } from './config.js';
import { registerWithRetry } from './manifestRegistration.js';
import { Ports } from 'msp_svr_common';
const PORT = Ports.core.actorWorkMainService;
// Start the server
const server = app.listen(PORT, () => {
    console.log(`\n🚀 Actorwork API server running on ${Config.myUrl}`);
    console.log(`   - Health check: ${Config.myUrl}/health`);
    console.log(`   - API endpoint: ${Config.myUrl}/api/v1/service/run`);
    console.log(`   - ServiceHub:   ${Config.serviceHubApiUrl}\n`);
    // Register with servicehub in the background (with retry)
    registerWithRetry().then(() => {
        console.log('Actorwork is fully operational and registered with servicehub');
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
//# sourceMappingURL=server.js.map