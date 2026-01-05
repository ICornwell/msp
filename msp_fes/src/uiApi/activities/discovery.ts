import { ActivitySet, ServiceActivityResultBuilder } from 'msp_common'
import { uiFeatureRegistry } from '../services/uiFeatureRegistry.js'

const discoveryActivitySet = ActivitySet()

discoveryActivitySet.use({
    namespace: 'discovery',
    activityName: 'discoverOpenUiFeatures',
    version: '1.0.0',
    context: '*',
    funcs:  async (payload, serviceResult: ServiceActivityResultBuilder) => {
        console.log(`Discovery request received: ${JSON.stringify(payload)}`);
        const features = uiFeatureRegistry.getFeatures();
        console.log(`Returning ${features.length} features`);
        serviceResult.updateResult({ features })
        return serviceResult
    }
});

discoveryActivitySet.use({
    namespace: 'discovery',
    activityName: 'registerUiFeature',
    version: '1.0.0',
    context: '*',
    funcs:  async (payload, serviceResult: ServiceActivityResultBuilder) => {
        console.log(`Discovery registration received: ${JSON.stringify(payload)}`);
        return serviceResult
    }
});

export { discoveryActivitySet }