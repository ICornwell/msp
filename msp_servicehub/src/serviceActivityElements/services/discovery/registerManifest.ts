import { withSemaphore } from "msp_semaphores";
import { DataFeatureManifestSection, getConfig, Manifest, runServiceActivity, ServiceActivityResultBuilder } from "msp_svr_common";
import { registerFeatures as registerUiFeatures } from '../uiFeatureRegistry.js'
import { registerFeatures as registerActivityFeatures } from '../serviceActivityRegistry.js'

function getDataFeatures(source: any): any[] {
    const fromSource = Array.isArray(source?.dataFeatures) ? source.dataFeatures : [];

    return [...fromSource];
}

async function forwardDataFeaturesToDataHub(manifest: Manifest): Promise<number> {
    const registrations: Array<{ manifestNamespace?: string; serviceName?: string; dataFeatures: any[] }> = [];

    const domainLevelDataFeatures = getDataFeatures(manifest);
    if (domainLevelDataFeatures.length > 0) {
        registrations.push({
            manifestNamespace: manifest.namespace,
            dataFeatures: domainLevelDataFeatures,
        });
    }

    for (const service of manifest.services || []) {
        const serviceDataFeatures = [
            ...getDataFeatures(service).map((feature: DataFeatureManifestSection) => ({
                ...feature,
                manifestNamespace: manifest.namespace,
                serviceName: service.name,
                serverUrl: feature.serverUrl || service.serverDataUrl || manifest.serverDataUrl
            })),
            ...((service.apiFeatures || []).flatMap((apiFeature: any) => [
                ...(Array.isArray(apiFeature?.data) ? apiFeature.data : []),
                ...(Array.isArray(apiFeature?.information) ? apiFeature.information : []),
            ])),
        ];

        if (serviceDataFeatures.length > 0) {
            registrations.push({
                manifestNamespace: manifest.namespace,
                serviceName: service.name,
                dataFeatures: serviceDataFeatures,
            });
        }
    }

    if (registrations.length === 0) {
        return 0;
    }

    const dataHubBaseUrl = getConfig().getHostUrl?.('dataHub') || 'http://localhost:4002';
    await runServiceActivity(
        'discovery',
        'registerDataFeatures',
        '1.0.0',
        { registrations },
        { baseUrl: dataHubBaseUrl },
    );

    return registrations.length;
}

export async function registerManifest(payload: any, serviceResult: ServiceActivityResultBuilder) {
  console.log(`Discovery registration received: ${JSON.stringify(payload)}`);
  return await withSemaphore(
    {
      semaphoreBaseUrl: getConfig().semaphoresUrl || 'no-semaphores-url-configured',
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
              namespace: feature.namespace || service.namespace || manifest.namespace, // Default to service name if namespace not provided
              ...feature,
              // Optionally add service name or other metadata to the feature
              serviceName: service.name,
            }));
            registerUiFeatures(manifest, service, uiFeatures);
            console.log(`Registered ${service.uiFeatures.length} features from service ${service.name}`);
          }
          if (service.activityFeatures) {
            const activityFeatures = service.activityFeatures.map((feature: any) => ({
              namespace: feature.namespace || service.namespace || manifest.namespace,
              ...feature,
              // Optionally add service name or other metadata to the feature
              serviceName: service.name,
            }));
            registerActivityFeatures(manifest, service, activityFeatures);
            console.log(`Registered ${service.activityFeatures.length} features from service ${service.name}`);
          }
        }
      }

      const forwardedDataRegistrations = await forwardDataFeaturesToDataHub(manifest);

      return serviceResult.success({
        message: 'Features registered successfully',
        count: manifest.services?.length,
        forwardedDataRegistrations,
      })
    }
  )
}