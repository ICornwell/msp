import { config } from 'dotenv';
import { setConfig, startMspDataServer, SERVICE_TYPE } from 'msp_svr_common';

import { resolveConfig } from './config.js';
import { AwsResourceDataActivities } from './activities/awsResourceDataActivities.js';

process.on('unhandledRejection', err => {
  console.error('UNHANDLED REJECTION:', err);
});

process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('beforeExit', code => {
  console.log('BEFORE EXIT', code);
  console.log((process as any)._getActiveHandles().map((h: any) => h.constructor.name));
});

config();

console.log('\n🚀 AWS API Data server starting...');
const Config = resolveConfig();
setConfig(Config);
startMspDataServer(Config, SERVICE_TYPE.DATA, AwsResourceDataActivities);
console.log('\n🚀 AWS API Data server running');
