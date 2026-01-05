import { UiFeatureManifestSection } from "msp_common/dist/manifests/manifest.js";
import serviceHubManifest from "./manifest/serviceHubManifest.js";
import { uiFeatureRegistry } from "./services/uiFeatureRegistry.js";

// push all my UI features to the bff registry


export function registerWithBff() {
  const uiFeatureList: UiFeatureManifestSection[] = []
  for (const service of serviceHubManifest.services || []) {
    for (const uiFeature of service.uiFeatures || []) {
      const productUiFeature = {
        ...uiFeature,
        product: { ...serviceHubManifest.product, ...service.product, ...uiFeature.product },

      }
      uiFeatureList.push(productUiFeature);

    }
  }

  return uiFeatureRegistry.registerFeature(uiFeatureList);
}