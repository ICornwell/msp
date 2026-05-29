import { config } from 'dotenv';
import { setConfig, startMspServer, SERVICE_TYPE } from 'msp_svr_common';

import { createAwsManifest } from '../manifest/manifest.js';
import { resolveConfig } from './config.js';
import { getDataServiceActivities } from './services/awsDataActivities.js';

config();

console.log('\n🚀 AWS API server starting...');
const Config = resolveConfig();
setConfig(Config);
startMspServer(Config, createAwsManifest(Config), SERVICE_TYPE.DATA, getDataServiceActivities());
console.log('\n🚀 AWS API server running');
