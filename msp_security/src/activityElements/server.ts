import { config } from 'dotenv';
import { setConfig, startMspServer } from 'msp_svr_common';

import { createAwsManifest } from '../manifest/manifest.js';
import { resolveConfig } from './config.js';
import { getServiceActivities } from './services/index.js';
import { getDiscoveryRouter } from './discovery/discoveryRoutes.js';
import { getDiscoveryProvider } from './discovery/discoveryProvider.js';

config();

console.log('\n🚀 Security API server starting...');
const Config = resolveConfig();
setConfig(Config);
const {app} = startMspServer(Config, createAwsManifest(Config), getServiceActivities());

const discoveryProvider = getDiscoveryProvider(Config);
const discoveryRouter = getDiscoveryRouter(discoveryProvider);

app.use('/discovery', discoveryRouter);
console.log('\n🚀 Security API server running');
