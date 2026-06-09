import { startMspServer, setConfig, SERVICE_TYPE } from 'msp_svr_common';
import { config } from 'dotenv';
import { createActorworkManifest } from '../manifest/manifest.js';
import { actorWorkActivities } from './activities/actorWorkActivities.js';
import { resolveConfig } from './config.js';

config();

console.log(`\n🚀 Actorwork API server starting...`);
const Config = resolveConfig();
setConfig(Config);
startMspServer(Config, createActorworkManifest(Config), SERVICE_TYPE.SERVICE, actorWorkActivities);

console.log(`\n🚀 Actorwork API server running`);
