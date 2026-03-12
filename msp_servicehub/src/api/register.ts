import { UiFeatureManifestSection } from "msp_common";
import serviceHubManifest from "./manifest/serviceHubManifest.js";
import { registerFeatures } from "./services/uiFeatureRegistry.js";

// push all my UI features to the bff registry


export function registerForBff() {
  for (const service of serviceHubManifest.services || []) {
    for (const uiFeature of service.uiFeatures || []) {
      const productUiFeature = {
        ...uiFeature,
        product: { ...serviceHubManifest.product, ...service.product, ...uiFeature.product },

      }
      registerFeatures(serviceHubManifest, service, productUiFeature);
    }
  }

}