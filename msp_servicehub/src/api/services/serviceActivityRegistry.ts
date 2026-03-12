// Service Activity Registry
// Uses ActivitySet for version matching and name matching

import { serviceManager, activitySet, ServiceActivityResultBuilder, ServiceRequestEnvelope, serviceRequest } from 'msp_common';
import type { ActivitySet } from 'msp_common';
import { ActivityFeatureManifestSection, Manifest, ServiceManifestSection } from 'msp_common';

export type ServiceActivityRegistration = {
  namespace: string;
  activityName: string;
  version: string;
  matchingVersionRange?: string;  // e.g., '^1.0.0', defaults to exact version
  serviceUrl: string;  // e.g., 'http://localhost:3001' for actorwork
  serviceName: string;
};

const registrations: ServiceActivityRegistration[] = [];
const registeredActivitySet: ActivitySet = activitySet();

export function registerFeatures(manifest: Manifest, service: ServiceManifestSection, features: ActivityFeatureManifestSection | ActivityFeatureManifestSection[]) {
  // Store registration for tracking
  for (const feature of Array.isArray(features) ? features : [features]) {
    const product = { ...manifest.product, ...service.product, ...feature.product };
    const registration: ServiceActivityRegistration = {
      namespace: product?.domain || 'default', // Assuming namespace is derived from product domain
      activityName: feature.name || 'unnamed-activity',
      version: product.version || '1.0.0',
      matchingVersionRange: product.version || 'none',
      serviceUrl: feature.serverUrl || 'none',
      serviceName: feature.remotePath || 'none'
    };
    registrations.push(registration);

    const matchingVersionRange = registration.matchingVersionRange || registration.version;

    // Create a proxy activity that forwards to the remote service
    registeredActivitySet.use({
      namespace: registration.namespace,
      activityName: registration.activityName,
      version: registration.version,
      matchingVersionRange,
      context: '*',
      funcs: async (payload: any, resultBuilder: ServiceActivityResultBuilder) => {
        try {
          const envelope: ServiceRequestEnvelope = {
            namespace: registration.namespace,
            activityName: registration.activityName,
            version: registration.version,
            payload,
            context: '*'
          };

          resultBuilder.log(`Proxying to ${registration.serviceName} at ${registration.serviceUrl}`);

          const result = await serviceRequest(envelope, {
            baseUrl: registration.serviceUrl,
            endpointPath: '/api/v1/service/run',
            timeoutMs: 30000
          });

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
}

// Use the ActivitySet's handle method which has fancy version matching and name matching
export async function handle(namespace: string, activityName: string, version: string, payload: any, resultBuilder?: ServiceActivityResultBuilder) {
  return await registeredActivitySet.handle(namespace, activityName, version, payload, resultBuilder);
}

export function getAll(): ServiceActivityRegistration[] {
  return [...registrations];
}

export function createServiceManager() {
  const sm = serviceManager();
  sm.use(registeredActivitySet);
  return sm;
}


export default {

};
