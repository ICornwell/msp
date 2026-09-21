import { config } from 'dotenv';
import { setConfig, startMspServer, SERVICE_TYPE } from 'msp_svr_common';

import { createModule_TemplateManifest } from '../manifest/manifest.js';
import { resolveConfig } from './config.js';
import { getServiceActivities } from './activities/moduleTemplateActivities.js';

config();

console.log('\n🚀 Module_Template API server starting...');
const Config = resolveConfig();
setConfig(Config);
startMspServer(Config, createModule_TemplateManifest(Config), SERVICE_TYPE.SERVICE, getServiceActivities());
console.log('\n🚀 Module_Template API server running');
