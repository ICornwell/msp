import ky from 'ky';

const apiHostName = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');

export async function getAvailableFeatures<FeatureType>(discoveryType: string, payload?: unknown): Promise<FeatureType[]> {
  const response = await ky.put(`${apiHostName}/api/v1/service/run`, {
    json: {
      namespace: 'discovery',
      activityName: discoveryType,
      version: '1.0.0',
      payload: payload ?? {},
    },
  }).json<{ result?: { features?: FeatureType[] } }>();

  return response.result?.features || [];
}