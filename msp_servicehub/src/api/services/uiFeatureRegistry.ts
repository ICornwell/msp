import type { UiFeatureManifest} from "msp_common"


const uiFeatureList: UiFeatureManifest[] = []

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