import { activitySet, ServiceActivityResultBuilder } from 'msp_svr_common'
import type { ActivitySet } from 'msp_svr_common'
import { getRegisteredDataFeatures, registerDataFeatures } from '../services/dataFeatureRegistry.js';

type DataFeatureRegistrationPayload = {
    manifestNamespace?: string;
    serviceName?: string;
    dataFeatures?: any[];
};

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

discoveryActivitySet.use({
    namespace: 'discovery',
    activityName: 'registerDataFeatures',
    version: '1.0.0',
    matchingVersionRange: '*',
    context: '*',
    funcs: async (payload, serviceResult: ServiceActivityResultBuilder) => {
        const registrations = Array.isArray(payload?.registrations)
            ? payload.registrations
            : [payload];

        const normalized = registrations.flatMap((registration: DataFeatureRegistrationPayload) => {
            const features = Array.isArray(registration?.dataFeatures)
                ? registration.dataFeatures
                : [];
            return features.map((feature: any) => ({
                ...feature,
                manifestNamespace: registration.manifestNamespace,
                serviceName: registration.serviceName,
            }));
        });

        const result = registerDataFeatures(normalized);
        return serviceResult.success({
            message: 'Data features registered successfully',
            ...result,
        });
    }
});

discoveryActivitySet.use({
    namespace: 'discovery',
    activityName: 'getRegisteredDataFeatures',
    version: '1.0.0',
    matchingVersionRange: '*',
    context: '*',
    funcs: async (_payload, serviceResult: ServiceActivityResultBuilder) => {
        return serviceResult.success({
            features: getRegisteredDataFeatures(),
        });
    }
});

export { discoveryActivitySet }