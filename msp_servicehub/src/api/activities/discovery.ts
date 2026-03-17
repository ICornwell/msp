import { activitySet, ServiceActivityResultBuilder } from 'msp_common'
import type { ActivitySet, Manifest } from 'msp_common'
import { getFeatureAliasForProduct, getRegisteredFeatures, registerFeatures as registerUiFeatures } from '../services/uiFeatureRegistry.js'
import { registerFeatures as registerActivityFeatures } from '../services/serviceActivityRegistry.js'
import { UiRemoteRegistration } from 'msp_common'
import { withSemaphore } from 'msp_semaphors'
import {Config} from '../config.js'

const discoveryActivitySet: ActivitySet = activitySet()

discoveryActivitySet.use({
    namespace: 'discovery',
    activityName: 'discoverOpenUiFeatures',
    version: '1.0.0',
    matchingVersionRange: '*',
    context: '*',
    funcs:  async (payload, serviceResult: ServiceActivityResultBuilder) => {
        console.log(`Discovery request received: ${JSON.stringify(payload)}`);
        const product = payload?.product || {
            domain: '*',
            name: '*',
            version: '*',
            variantName: '*',
        };

        const allFeatures = getRegisteredFeatures();
        console.log(`Currently registered features: ${allFeatures.length}`);
        const matchingFeatures = allFeatures.map(feature => getFeatureAliasForProduct(
                feature.namespace || '*',
                feature.name || '*',
                product.domain || '*',
                product.name || '*',
                product.version || '*',
                product.variantName || '*'
            ) ).filter(match => match) as unknown as UiRemoteRegistration[];
        
        
        if (matchingFeatures.length == 0) return serviceResult.failed('No matching feature found');

        return serviceResult.success({ features: matchingFeatures })
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
        return await withSemaphore(
            {
                semaphoreBaseUrl: Config.semaphorsUrl || 'no-semaphors-url-configured',
                semaphoreName: 'servicehub:register-manifest',
                ttlMs: Number(process.env['MSP_SEMAPHORE_REGISTER_MANIFEST_TTL_MS'] || 10000),
                holderId: process.env['HOSTNAME'] || 'servicehub',
            },
            async () => {
                // payload can be single feature or array of features
                const manifest = (payload.manifest || payload) as Manifest; // Support both { manifest: {...} } and direct feature object(s)

                if (manifest.services) {
                    for (const service of manifest.services) {
                        if (service.uiFeatures) {
                            const uiFeatures = service.uiFeatures.map((feature: any) => ({
                                namespace : feature.namespace || service.namespace || manifest.namespace, // Default to service name if namespace not provided
                                ...feature,
                                // Optionally add service name or other metadata to the feature
                                serviceName: service.name,
                            }));
                            registerUiFeatures(manifest, service, uiFeatures);
                            console.log(`Registered ${service.uiFeatures.length} features from service ${service.name}`);
                        }
                        if (service.activityFeatures) {
                            const activityFeatures = service.activityFeatures.map((feature: any) => ({
                                 namespace : feature.namespace || service.namespace || manifest.namespace,
                                ...feature,
                                // Optionally add service name or other metadata to the feature
                                serviceName: service.name,
                            }));
                            registerActivityFeatures(manifest, service, activityFeatures);
                            console.log(`Registered ${service.activityFeatures.length} features from service ${service.name}`);
                        }
                    }
                }

                return serviceResult.success({ message: 'Features registered successfully', count: manifest.services?.length })
            }
        )
    }
});

export { discoveryActivitySet }