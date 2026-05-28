import { config } from 'dotenv';
import { setConfig, startMspServer } from 'msp_svr_common';

import { createAwsManifest } from '../manifest/manifest.js';
import { resolveConfig } from './config.js';
import { getServiceActivities } from './services/awsActivities.js';

config();

console.log('\n🚀 AWS API server starting...');
const Config = resolveConfig();
setConfig(Config);
startMspServer(Config, createAwsManifest(Config), getServiceActivities());
console.log('\n🚀 AWS API server running');
