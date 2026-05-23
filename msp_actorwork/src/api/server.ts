import { startMspServer, setConfig } from 'msp_svr_common';
import { createActorworkManifest } from '../manifest/manifest.js';
import { getServiceActivities } from '../services/actorWorkActivities.js';
import { Config } from './config.js';

console.log(`\n🚀 Actorwork API server starting...`);

setConfig(Config);
startMspServer(Config, createActorworkManifest(Config), getServiceActivities());

console.log(`\n🚀 Actorwork API server running`);
