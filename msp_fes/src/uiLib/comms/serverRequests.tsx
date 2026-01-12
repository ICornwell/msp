import ky from 'ky';
import { UiFeatureManifestSection } from 'msp_common';

const apiHostName = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');

export async function getAvailableFeatures(): Promise<UiFeatureManifestSection[]> {
  const response = await ky.post(`${apiHostName}/api/v1/discovery/discoverOpenUiFeatures`).json<{ serviceResult: { result: { features: UiFeatureManifestSection[] } } }>();
  return response.serviceResult?.result?.features;
}