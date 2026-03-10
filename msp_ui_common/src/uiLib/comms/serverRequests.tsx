import ky from 'ky';
import { UiFeatureManifestSection } from 'msp_common';

const apiHostName = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');

export async function getAvailableFeatures(): Promise<UiFeatureManifestSection[]> {
  const response = await ky.put(`${apiHostName}/api/v1/service/run`, {
    json: {
      namespace: 'discovery',
      activityName: 'discoverOpenUiFeatures',
      version: '1.0.0',
      payload: {},
    },
  }).json<{ result?: { features?: UiFeatureManifestSection[] } }>();

  return response.result?.features || [];
}