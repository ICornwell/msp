import { buildActivitySet, ServiceActivityResultBuilder } from 'msp_svr_common'
import type { ActivitySet } from 'msp_svr_common'
import { ReadData } from '../services/dgmRead.js';
import { WriteData } from '../services/dgmWrite.js';

const simpleViewActivitySet: ActivitySet = buildActivitySet()
    .withNamespace('datahub_dgm')
    .withVersion('1.0.0')
    .withMatchingVersionRange('*')
    .withContext('*')
    .use({
        activityName: 'readDataView',
        funcs: async (payload, serviceResult: ServiceActivityResultBuilder) => {
            console.log(`ReadData request received: ${JSON.stringify(payload)}`);
            return serviceResult.success(await ReadData(payload.view, payload.id));
        }
    })
    .use({
        activityName: 'writeDataView',
        funcs: async (payload, serviceResult: ServiceActivityResultBuilder) => {
            console.log(`WriteData request received: ${JSON.stringify(payload)}`);
            return serviceResult.success(await WriteData(payload.view, payload.data));
        }
    })
    .build();

export { simpleViewActivitySet }