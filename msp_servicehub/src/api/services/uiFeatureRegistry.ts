import type { UiFeatureManifestSection} from "msp_common"

const uiFeatureList: UiFeatureManifestSection[] = [
  {
    name: 'Sample Feature',
    version: '1.0.0',
    description: 'A sample UI feature for demonstration purposes',
    serverUrl: '/features/sample-feature',
    domain: 'sample-domain',
    allowedContexts: ['*'],
    remotePath: '/features/sample-feature/feature.js'
  }
]

function registerFeatures(features: UiFeatureManifestSection | UiFeatureManifestSection[]) {
  const featureArray = Array.isArray(features) ? features : [features];
  for (const feature of featureArray) {
    uiFeatureList.push(feature);
  }
}

function getFeatures() {
  return uiFeatureList;
}

export const uiFeatureRegistry = {
  registerFeatures,
  getFeatures
}