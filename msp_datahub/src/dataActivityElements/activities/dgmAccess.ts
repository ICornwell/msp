import { activitySet, ServiceActivityResultBuilder } from 'msp_svr_common'
import type { ActivitySet } from 'msp_svr_common'
import { ReadData } from '../services/dgmRead.js';
import { WriteData } from '../services/dgmWrite.js';

const simpleViewActivitySet: ActivitySet = activitySet()

simpleViewActivitySet.use({
    namespace: 'datahub_dgm',
    activityName: 'readDataView',
    version: '1.0.0',
    matchingVersionRange: '*',
    context: '*',
    funcs:  async (payload, serviceResult: ServiceActivityResultBuilder) => {
        console.log(`ReadData request received: ${JSON.stringify(payload)}`);
        return serviceResult.success(await ReadData(payload.view, payload.id));
    }
});

simpleViewActivitySet.use({
    namespace: 'datahub_dgm',
    activityName: 'writeDataView',
    version: '1.0.0',
    matchingVersionRange: '*',
    context: '*',
    funcs:  async (payload, serviceResult: ServiceActivityResultBuilder) => {
        console.log(`WriteData request received: ${JSON.stringify(payload)}`);
        return serviceResult.success(await WriteData(payload.view, payload.data));
    }
});

export { simpleViewActivitySet }