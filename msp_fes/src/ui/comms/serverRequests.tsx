import { windowInternalId } from 'happy-dom/lib/PropertySymbol.js';
import ky from 'ky';
import { UiFeatureManifest } from 'msp_common';

const apiHostName = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');

export async function getAvailableFeatures(): Promise<UiFeatureManifest[]> {
  const response = await ky.post(`${apiHostName}/api/v1/discovery/discoverOpenUiFeatures`).json<{ features: UiFeatureManifest[] }>();
  return response.features;
}