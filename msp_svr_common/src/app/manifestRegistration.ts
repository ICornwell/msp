// Manifest Registration Service
import { Manifest, Config, serviceRequest } from 'msp_svr_common';

export async function registerManifest(config: Partial<Config>, manifest: Partial<Manifest>): Promise<boolean> {
  try {
    console.log(`Registering actorwork manifest with servicehub at ${config.serviceHubApiUrl}...`);


    const result = await serviceRequest(
      {
        namespace: 'discovery',
        activityName: 'registerManifest',
        version: '1.0.0',
        payload: manifest,
      },
      {
        baseUrl: config.serviceHubApiUrl,
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

export async function registerWithRetry(config: Partial<Config>, manifest: Partial<Manifest>, intervalMs = 5000): Promise<void> {
  let registered = false;

  while (!registered) {
    registered = await registerManifest(config, manifest);

    if (!registered) {
      console.log(`Retrying manifest registration in ${intervalMs / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  console.log('✓ Actorwork successfully registered with servicehub');
}

