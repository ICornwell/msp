import { config } from 'dotenv';
import { setConfig, startMspServer, SERVICE_TYPE } from 'msp_svr_common';

import { createModuleXManifest } from '../manifest/manifest.js';
import { resolveConfig } from './config.js';
import { getServiceActivities } from './activities/moduleXActivities.js';

config();

console.log('\n🚀 ModuleX API server starting...');
const Config = resolveConfig();
setConfig(Config);
startMspServer(Config, createModuleXManifest(Config), SERVICE_TYPE.SERVICE, getServiceActivities());
console.log('\n🚀 ModuleX API server running');
