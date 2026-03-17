import { activitySet, ServiceActivityResultBuilder } from 'msp_common'
import type { ActivitySet } from 'msp_common'
import { ReadData } from '../services/dgmRead.js';
import { WriteData } from '../services/dgmWrite.js';

const discoveryActivitySet: ActivitySet = activitySet()

discoveryActivitySet.use({
    namespace: 'datahub_dgm',
    activityName: 'readData',
    version: '1.0.0',
    matchingVersionRange: '*',
    context: '*',
    funcs:  async (payload, serviceResult: ServiceActivityResultBuilder) => {
        console.log(`ReadData request received: ${JSON.stringify(payload)}`);
        return serviceResult.success(await ReadData(payload.view, payload.id));
    }
});

discoveryActivitySet.use({
     namespace: 'datahub_dgm',
    activityName: 'writeData',
    version: '1.0.0',
    matchingVersionRange: '*',
    context: '*',
    funcs:  async (payload, serviceResult: ServiceActivityResultBuilder) => {
        console.log(`WriteData request received: ${JSON.stringify(payload)}`);
        return serviceResult.success(await WriteData(payload.view, payload.data));
    }
});

export { discoveryActivitySet }