import { activitySet, ServiceActivityResultBuilder } from 'msp_common'
import type { ActivitySet } from 'msp_common'

const discoveryActivitySet: ActivitySet = activitySet()

discoveryActivitySet.use({
    namespace: 'discovery',
    activityName: 'discoverOpenUiFeatures',
    version: '1.0.0',
    matchingVersionRange: '*',
    context: '*',
    funcs:  async (payload, serviceResult: ServiceActivityResultBuilder) => {
        console.log(`Discovery request received: ${JSON.stringify(payload)}`);
        return serviceResult.success({})
    }
});

discoveryActivitySet.use({
    namespace: 'discovery',
    activityName: 'registerUiFeature',
    version: '1.0.0',
    matchingVersionRange: '*',
    context: '*',
    funcs:  async (payload, serviceResult: ServiceActivityResultBuilder) => {
        console.log(`Discovery request received: ${JSON.stringify(payload)}`);
        return serviceResult.success({})
    }
});

export { discoveryActivitySet }