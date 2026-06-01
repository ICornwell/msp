import { startMspServer, setConfig, SERVICE_TYPE } from 'msp_svr_common';
import { config } from 'dotenv';
import { createActorworkManifest } from '../manifest/manifest.js';
import { getServiceActivities } from './services/actorWorkActivities.js';
import { resolveConfig } from './config.js';

config();

console.log(`\n🚀 Actorwork API server starting...`);
const Config = resolveConfig();
setConfig(Config);
startMspServer(Config, createActorworkManifest(Config), SERVICE_TYPE.SERVICE, getServiceActivities());

console.log(`\n🚀 Actorwork API server running`);
