import { activitySet, ServiceActivityResultBuilder } from 'msp_common'
import type { ActivitySet, Manifest } from 'msp_common'
import { getRegisteredFeatures, registerFeatures as registerUiFeatures } from '../services/uiFeatureRegistry.js'
import { registerFeatures as registerActivityFeatures } from '../services/serviceActivityRegistry.js'
import { Config } from '../../config.js'

const discoveryActivitySet: ActivitySet = activitySet()

discoveryActivitySet.use({
    namespace: 'discovery',
    activityName: 'discoverOpenUiFeatures',
    version: '1.0.0',
    matchingVersionRange: '*',
    context: '*',
    funcs:  async (payload, serviceResult: ServiceActivityResultBuilder) => {
        console.log(`Discovery request received: ${JSON.stringify(payload)}`);
        const features = getRegisteredFeatures().map((feature) => ({
            ...feature,
            remotePath: `${feature.namespace}/${feature.featureName}/${feature.version}`,
            serviceUrl: `${Config.myUrl}/ui/v1/`
        }));
        console.log(`Returning ${features.length} features`);
        return serviceResult.success({ features })
    }
});

discoveryActivitySet.use({
    namespace: 'discovery',
    activityName: 'registerManifest',
    version: '1.0.0',
    matchingVersionRange: '*',
    context: '*',
    funcs:  async (payload, serviceResult: ServiceActivityResultBuilder) => {
        console.log(`Discovery registration received: ${JSON.stringify(payload)}`);
        // payload can be single feature or array of features
        const manifest = (payload.manifest || payload) as Manifest; // Support both { manifest: {...} } and direct feature object(s)
        
        if (manifest.services) {
            for (const service of manifest.services) {
                if (service.uiFeatures) {
                    const uiFeatures = service.uiFeatures.map((feature: any) => ({
                        ...feature,
                        // Optionally add service name or other metadata to the feature
                        serviceName: service.name,
                        product: manifest.product,
                    }));
                    registerUiFeatures(manifest, service, uiFeatures);
                    console.log(`Registered ${service.uiFeatures.length} features from service ${service.name}`);
                }
                if (service.activityFeatures) {
                    const activityFeatures = service.activityFeatures.map((feature: any) => ({
                        ...feature,
                        // Optionally add service name or other metadata to the feature
                        serviceName: service.name,
                        product: manifest.product,
                    }));
                    registerActivityFeatures(manifest, service, activityFeatures);
                    console.log(`Registered ${service.activityFeatures.length} features from service ${service.name}`);
                }
            }
        }

        return serviceResult.success({ message: 'Features registered successfully', count: manifest.services?.length })
    }
});

export { discoveryActivitySet }