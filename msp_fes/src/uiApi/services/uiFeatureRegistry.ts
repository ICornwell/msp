import type { UiFeatureManifestSection} from "msp_svr_common"


const uiFeatureList: UiFeatureManifestSection[] = [
  {
    name: 'Sample Feature',
    version: '1.0.0',
    description: 'A sample UI feature for demonstration purposes',
    serverUrl: '/features/sample-feature',
    namespace: 'sample-domain',
    allowedContexts: ['*'],
    remotePath: '/features/sample-feature/feature.js'
  }
]

function registerFeatures(features: UiFeatureManifestSection[]) {
  for (const feature of features) {
    uiFeatureList.push({...feature, serverUrl: feature.serverUrl || 'none'})
  }
  
}

function getFeatures() {
  return uiFeatureList
}

export const uiFeatureRegistry = {
  registerFeatures,
  getFeatures
}