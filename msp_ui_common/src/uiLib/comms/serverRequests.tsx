import { RequestEnvelope, ServiceRequestResult } from 'msp_common';

const apiHostName = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');

export async function getAvailableFeatures<FeatureType>(discoveryType: string, payload?: unknown): Promise<FeatureType[]> {
  const controller = new AbortController();
  const response = await fetch(`${apiHostName}/api/v1/service/run`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      namespace: 'discovery',
      activityName: discoveryType,
      version: '1.0.0',
      variantName: 'default',
      payload: payload ?? {},
    }),
    signal: controller.signal,
    
  })
  const result = await response.json() as ServiceRequestResult;

  return result?.result.features || [];
}

export async function serviceRequest<E extends RequestEnvelope>(serviceType: 'activity' | 'data' | 'view-read' | 'view-write',
  envelope: E,
  options?: { baseUrl?: string; endpointPath?: string; timeoutMs?: number }
): Promise<ServiceRequestResult> {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), options?.timeoutMs ?? 30000);
  let typeUrl = 'service/run'
  switch (serviceType) {
    case 'activity':
      typeUrl = 'service/run';
      break; // default
    case 'data':
      typeUrl = 'data';
      break;
    case 'view-read':
      typeUrl = 'view/read';
      break;
    case 'view-write':
      typeUrl = 'view/write';
      break;
    default:
      console.warn(`Unknown serviceType "${serviceType}" in ActivityDispatchProvider, defaulting to "activity".`);
  }

  const path = options?.endpointPath ?? typeUrl;
  const host = options?.baseUrl ?? window.location.origin;
  const url = `${host}/api/v1/${path}`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
      signal: controller.signal,
    });

    clearTimeout(timeoutHandle);

    if (!response.ok) {
      console.error('Activity call failed:', response.status, response.statusText);
      throw new Error(`Activity call failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as ServiceRequestResult;

    return result;
  } catch (error: any) {
    clearTimeout(timeoutHandle);
    console.error('Service request failed:', error);
    return {
      ...envelope,
      success: false,
      message: 'Service request failed.',
      error: error?.message ?? String(error),
    } as unknown as ServiceRequestResult;
  }
}