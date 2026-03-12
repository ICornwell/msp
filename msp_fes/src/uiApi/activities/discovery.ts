import { activitySet, ServiceActivityResultBuilder, serviceRequest, getConfig } from 'msp_common'
import type { ActivitySet } from 'msp_common'

const discoveryActivitySet: ActivitySet = activitySet()

discoveryActivitySet.use({
    namespace: 'discovery',
    activityName: 'discoverOpenUiFeatures',
    version: '1.0.0',
    matchingVersionRange: '*',
    context: '*',
    funcs:  async (payload: any, serviceResult: ServiceActivityResultBuilder) => {
        console.log(`Discovery request received: ${JSON.stringify(payload)}`);
        const response = await serviceRequest(
            {
                namespace: 'discovery',
                activityName: 'discoverOpenUiFeatures',
                version: '1.0.0',
                payload: payload ?? {},
            },
            {
                baseUrl: getConfig().serviceHubApiUrl,
                endpointPath: '/api/v1/service/run',
                timeoutMs: 5000,
            }
        );

        const features = response.result?.features || [];
        console.log(`Returning ${features.length} features from servicehub`);
        serviceResult.updateResult({ features });
        return serviceResult
    }
});

discoveryActivitySet.use({
    namespace: 'discovery',
    activityName: 'registerUiFeature',
    version: '1.0.0',
    matchingVersionRange: '*',
    context: '*',
    funcs:  async (payload: any, serviceResult: ServiceActivityResultBuilder) => {
        console.log(`Discovery registration received: ${JSON.stringify(payload)}`);
        const response = await serviceRequest(
            {
                namespace: 'discovery',
                activityName: 'registerUiFeature',
                version: '1.0.0',
                payload,
            },
            {
                baseUrl: getConfig().serviceHubApiUrl,
                endpointPath: '/api/v1/service/run',
                timeoutMs: 5000,
            }
        );

        serviceResult.updateResult({
            message: response.success ? 'Feature registered successfully' : 'Failed to register feature',
            proxied: true,
        });
        return serviceResult
    }
});

export { discoveryActivitySet }