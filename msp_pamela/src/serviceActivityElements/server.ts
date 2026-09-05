import { config } from 'dotenv';
import { setConfig, startMspServer, SERVICE_TYPE } from 'msp_svr_common';

import { createPamelaManifest } from '../manifest/manifest.js';
import { resolveConfig } from './config.js';
import { getServiceActivities } from './activities/pamelaActivities.js';

config();

console.log('\n🚀 PAMELA API server starting...');
const Config = resolveConfig();
setConfig(Config);
startMspServer(Config, createPamelaManifest(Config), SERVICE_TYPE.SERVICE, getServiceActivities());
console.log('\n🚀 PAMELA API server running');
