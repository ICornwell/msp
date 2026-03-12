// Manifest Registration Service
import { serviceRequest } from 'msp_common';
import { createActorworkManifest } from '../manifest/manifest.js';
import { config } from './config.js';

export async function registerManifest(): Promise<boolean> {
  try {
    console.log(`Registering actorwork manifest with servicehub at ${config.serviceHubUrl}...`);

    // Register the GetUserProfileData activity
    const manifest = createActorworkManifest(config) as any;

    const result = await serviceRequest(
      {
        namespace: 'servicehub',
        activityName: 'registerManifest',
        version: '1.0.0',
        payload: manifest,
      },
      {
        baseUrl: config.serviceHubUrl,
        endpointPath: '/api/v1/service/run',
        timeoutMs: 5000,
      }
    );

    if (result.success) {
      console.log(`✓ Successfully registered manifest with servicehub`);
      return true;
    } else {
      console.error(`✗ Failed to register manifest:`, result.message, result.error);
      return false;
    }
  } catch (error: any) {
    console.error(`✗ Error registering manifest:`, error.message);
    return false;
  }
}

export async function registerWithRetry(intervalMs = 5000): Promise<void> {
  let registered = false;

  while (!registered) {
    registered = await registerManifest();

    if (!registered) {
      console.log(`Retrying manifest registration in ${intervalMs / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  console.log('✓ Actorwork successfully registered with servicehub');
}

// Also register UI features (future expansion)
/* export async function registerUiFeatures(): Promise<void> {
  const manifest = createActorworkManifest(config) as any;
  const uiFeatures = (manifest.services || []).flatMap((service: any) =>
    (service.uiFeatures || []).map((feature: any) => ({
      ...feature,
      // Discovery payload includes where the MF remote entry is served.
      serverUrl: config.uiRemoteUrl,
      domain: feature.product?.domain || service.product?.domain || manifest.product?.domain,
      name: feature.product?.name || service.product?.name || manifest.product?.name,
      version: feature.product?.version || service.product?.version || manifest.product?.version,
    }))
  );

  if (uiFeatures.length === 0) {
    console.log('No UI features found in actorwork manifest to register.');
    return;
  }

  const result = await serviceRequest(
    {
      namespace: 'discovery',
      activityName: 'registerUiFeature',
      version: '1.0.0',
      payload: uiFeatures,
    },
    {
      baseUrl: config.serviceHubUrl,
      endpointPath: '/api/v1/service/run',
      timeoutMs: 5000,
    }
  );

  if (!result.success) {
    console.error('Failed to register actorwork UI features:', result.message, result.error);
    return;
  }

  console.log(`✓ Registered ${uiFeatures.length} actorwork UI feature(s) with discovery`);
}
 */