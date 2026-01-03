import type { UiFeatureManifest} from "msp_common"


const uiFeatureList: UiFeatureManifest[] = [
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

function registerFeature(feature: UiFeatureManifest) {
  uiFeatureList.push(feature)
}

function getFeatures() {
  return uiFeatureList
}

export const uiFeatureRegistry = {
  registerFeature,
  getFeatures
}