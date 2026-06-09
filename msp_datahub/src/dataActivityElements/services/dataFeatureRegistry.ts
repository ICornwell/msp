import { emptyActivitySet, ActivitySet, ServiceActivityResultBuilder, serviceManager, serviceRequest, type DataFeatureManifestSection } from 'msp_svr_common';
import { ServiceRequestEnvelope } from 'msp_common';
type RegisteredDataFeature = DataFeatureManifestSection & {
  manifestNamespace?: string;
  serviceName?: string;
};

const dataFeatures: RegisteredDataFeature[] = [];
const registeredActivitySet: ActivitySet = emptyActivitySet();

// function isSameFeature(a: ServiceActivityRegistration, b: ServiceActivityRegistration): unknown {
//   return a.namespace === b.namespace && a.activityName === b.activityName && a.version === b.version;
// }

function featureKey(feature: RegisteredDataFeature): string {
  return [
    feature.manifestNamespace || '*',
    feature.serviceName || '*',
    feature.namespace || '*',
    feature.name || '*',
    feature.version || '1.0.0',
    feature.variantName || 'default',
  ].join('|');
}

export function registerDataFeatures(
  features: RegisteredDataFeature[],
): { added: number; total: number } {
  const existing = new Set(dataFeatures.map(featureKey));
  let added = 0;

  for (const feature of features) {
    const key = featureKey(feature);
    if (!existing.has(key)) {
      dataFeatures.push(feature);
      registerDataFeatureServiceActivity(feature);
      existing.add(key);
      added += 1;
    }
  }

  return { added, total: dataFeatures.length };
}

function registerDataFeatureServiceActivity(feature: RegisteredDataFeature) {

    // Create a proxy activity that forwards to the remote service
    registeredActivitySet.use({
      namespace: feature.namespace || 'default',
      activityName: feature.name || 'unnamed-activity',
      version: feature.version || '1.0.0',
      matchingVersionRange: feature.version || '1.0.0',
      context: '*',
      funcs: async (payload: any, resultBuilder: ServiceActivityResultBuilder) => {
        try {
          const envelope: ServiceRequestEnvelope = {
            namespace: feature.namespace || 'default',
            activityName: feature.name || 'unnamed-activity',
            version: feature.version || '1.0.0',
            payload,
            context: '*'
          };

          resultBuilder.log(`Proxying to ${feature.serviceName} at ${feature.serverUrl}`);

          const result = await serviceRequest(envelope, {
            baseUrl: feature.serverUrl || 'http://localhost',
            endpointPath: '/api/v1/service/run',
            timeoutMs: 30000
          });

          if (result.success) {
            return resultBuilder.success(result.result);
          } else {
            return resultBuilder.failed(
              result.message || `Remote service failed: ${feature.serviceName}`,
              result.error
            );
          }
        } catch (error: any) {
          return resultBuilder.failed(
            `Failed to proxy to ${feature.serviceName}`,
            { message: error.message, serviceUrl: feature.serverUrl }
          );
        }
      }
    });
}

export function getRegisteredDataFeatures(): RegisteredDataFeature[] {
  return [...dataFeatures];
}

export function createServiceManager() {
  const sm = serviceManager();
  sm.use(registeredActivitySet);
  return sm;
}


