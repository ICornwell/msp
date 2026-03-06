import { InformationManifestSection } from "msp_common/dist/manifests/manifest.js";
import dataHubManifest from "./manifest/dataHubManifest.js";
import { informationRegistry } from "./services/informationRegistry.js";


// push all my UI features to the bff registry


export function registerWithBff() {
  const uiFeatureList: InformationManifestSection[] = []
  for (const service of dataHubManifest.services || []) {
    for (const uiFeature of service.uiFeatures || []) {
      const productUiFeature = {
        ...uiFeature,
        product: { ...dataHubManifest.product, ...service.product, ...uiFeature.product },

      }
      uiFeatureList.push(productUiFeature);

    }
  }

  return informationRegistry.registerFeature(uiFeatureList);
}