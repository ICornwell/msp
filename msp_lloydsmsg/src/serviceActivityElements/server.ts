import { config } from 'dotenv';
import { setConfig, startMspServer, SERVICE_TYPE } from 'msp_svr_common';

import { createLloydsMsgManifest } from '../manifest/manifest.js';
import { resolveConfig } from './config.js';
import { getServiceActivities } from './activities/lloydsMsgActivities.js';

config();

console.log('\n🚀 LloydsMsg API server starting...');
const Config = resolveConfig();
setConfig(Config);
startMspServer(Config, createLloydsMsgManifest(Config), SERVICE_TYPE.SERVICE, getServiceActivities());
console.log('\n🚀 LloydsMsg API server running');
