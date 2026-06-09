import { config } from 'dotenv';
import { SERVICE_TYPE, setConfig, startMspServer } from 'msp_svr_common';

import { createSecurityManifest } from '../manifest/manifest.js';
import { resolveConfig } from './config.js';
import { PrivateKeysActivities } from './activities/privateKeys.js';
import { getDiscoveryRouter } from './discovery/discoveryRoutes.js';
import { getDiscoveryProvider } from './discovery/discoveryProvider.js';

config();

console.log('\n🚀 Security API server starting...');
const Config = resolveConfig();
setConfig(Config);
const {app} = startMspServer(Config, createSecurityManifest(Config), SERVICE_TYPE.SERVICE, PrivateKeysActivities);

const discoveryProvider = getDiscoveryProvider(Config);
const discoveryRouter = getDiscoveryRouter(discoveryProvider);

app.use('/discovery', discoveryRouter);
console.log('\n🚀 Security API server running');
