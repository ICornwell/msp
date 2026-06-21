// Service Activity Registry
// Uses ActivitySet for version matching and name matching

import { serviceManager, emptyActivitySet, DataRequestResultBuilder, DataRequest} from 'msp_svr_common';
import { DataRequestEnvelope } from 'msp_common';
import type { ActivitySet, DataFeatureManifestSection } from 'msp_svr_common';
import type {ProductConfig} from 'msp_svr_common';
import { Manifest, ServiceManifestSection } from 'msp_svr_common';
import { expandFeatureProducts } from './productsListExpander.js';
import { registerViews } from './viewRegistry.js';

export type DataActivityRegistration = {
  namespace: string;
  activityName: string;
  version: string;
  variantName?: string;
  matchingVersionRange?: string;  // e.g., '^1.0.0', defaults to exact version
  serviceUrl: string;  // e.g., 'http://localhost:3001' for actorwork
  serviceName: string;
  forProducts: ProductConfig[]
};

const registrations: DataActivityRegistration[] = [];
const registeredActivitySet: ActivitySet = emptyActivitySet();

  function isSameFeature(a: DataActivityRegistration, b: DataActivityRegistration): unknown {
    return a.namespace === b.namespace && a.activityName === b.activityName && a.version === b.version;
  }



export function registerFeatures(manifest: Manifest, service: ServiceManifestSection, features: DataFeatureManifestSection | DataFeatureManifestSection[]) {
  // Store registration for tracking
  for (const feature of Array.isArray(features) ? features : [features]) {
    const forProducts = expandFeatureProducts(manifest, service, feature);
    const registration: DataActivityRegistration = {
      namespace: feature.namespace || service.namespace || manifest.namespace || 'default', // Assuming namespace is derived from product domain
      activityName: feature.name || 'unnamed-activity',
      version: feature.version || service.version || manifest.version || '1.0.0',
      variantName: feature.variantName || service.variantName || manifest.variantName || 'default',
      serviceUrl: feature.serverUrl || service.serverUrl || manifest.serverUrl || 'none',
      serviceName: service.name || 'none',
      forProducts: forProducts??[]
    };

      const existingIndex = registrations.findIndex(r => isSameFeature(r, registration));
        if (existingIndex >= 0) {
          registrations.splice(existingIndex, 1);
        }

    registrations.push(registration);

    const matchingVersionRange = registration.matchingVersionRange || registration.version;

    // Create a proxy activity that forwards to the remote service
    registeredActivitySet.use({
      namespace: registration.namespace,
      activityName: registration.activityName,
      version: registration.version,
      variantName: registration.variantName || 'default',
      matchingVersionRange,
      context: '*',
      funcs: async (payload: any, resultBuilder: DataRequestResultBuilder) => {
        try {
          const envelope: DataRequestEnvelope = {
            namespace: registration.namespace,
            activityName: registration.activityName,
            version: registration.version,
            variantName: registration.variantName || 'default',
            payload,
            context: '*'
          };

          resultBuilder.log(`Proxying to ${registration.serviceName} at ${registration.serviceUrl}`);

          const result = await DataRequest(envelope);

          if (result.success) {
            return resultBuilder.success(result.result);
          } else {
            return resultBuilder.failed(
              result.message || `Remote service failed: ${registration.serviceName}`,
              result.error
            );
          }
        } catch (error: any) {
          return resultBuilder.failed(
            `Failed to proxy to ${registration.serviceName}`,
            { message: error.message, serviceUrl: registration.serviceUrl }
          );
        }
      }
    });
    console.log(`Registered activity: ${registration.namespace}/${registration.activityName}@${registration.version} (${matchingVersionRange}) -> ${registration.serviceUrl}`);
  }
  registerViews(manifest, service, Array.isArray(features) ? features : [features], true);
}

// Use the ActivitySet's handle method which has fancy version matching and name matching
export async function handleDataRequest(namespace: string, activityName: string, version: string, payload: any, resultBuilder?: DataRequestResultBuilder) {
  return await registeredActivitySet.handle(namespace, activityName, version, payload, resultBuilder);
}

export function getAllDataRegistrations(): DataActivityRegistration[] {
  return [...registrations];
}

export function createDataServiceManager() {
  const sm = serviceManager();
  sm.use(registeredActivitySet);
  return sm;
}


export default {

};
