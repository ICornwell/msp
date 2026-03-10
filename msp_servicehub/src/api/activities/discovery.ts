import { ActivitySet, ServiceActivityResultBuilder } from 'msp_common'
import { uiFeatureRegistry } from '../services/uiFeatureRegistry.js'

const discoveryActivitySet = ActivitySet()

discoveryActivitySet.use({
    namespace: 'discovery',
    activityName: 'discoverOpenUiFeatures',
    version: '1.0.0',
    matchingVersionRange: '*',
    context: '*',
    funcs:  async (payload, serviceResult: ServiceActivityResultBuilder) => {
        console.log(`Discovery request received: ${JSON.stringify(payload)}`);
        const features = uiFeatureRegistry.getFeatures();
        console.log(`Returning ${features.length} features`);
        return serviceResult.success({ features })
    }
});

discoveryActivitySet.use({
    namespace: 'discovery',
    activityName: 'registerUiFeature',
    version: '1.0.0',
    matchingVersionRange: '*',
    context: '*',
    funcs:  async (payload, serviceResult: ServiceActivityResultBuilder) => {
        console.log(`Discovery registration received: ${JSON.stringify(payload)}`);
        // payload can be single feature or array of features
        const features = Array.isArray(payload) ? payload : [payload];
        for (const feature of features) {
            uiFeatureRegistry.getFeatures().push(feature);
        }
        return serviceResult.success({ message: 'Features registered successfully', count: features.length })
    }
});

export { discoveryActivitySet }