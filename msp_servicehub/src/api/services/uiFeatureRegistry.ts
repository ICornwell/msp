import type { UiFeatureManifestSection} from "msp_common"
import { httpRequest } from "msp_common"
import Config from "../config.js"


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

function registerFeature(feature: UiFeatureManifestSection) {
  uiFeatureList.push(feature)
  const responsePromise =  httpRequest.post(`${Config.uiBffUrl}/api/v1/discovery/registerUiFeature`, feature)
  return responsePromise;
}

function getFeatures() {
  return uiFeatureList
}

export const uiFeatureRegistry = {
  registerFeature,
  getFeatures
}