import type { Manifest, ServiceManifestSection, UiFeatureManifestSection} from "msp_common"

export type ServiceUIRegistration = {
  namespace: string;
  featureName: string;
  version: string;
  matchingVersionRange?: string;  // e.g., '^1.0.0', defaults to exact version
  serviceUrl: string;  // e.g., 'http://localhost:3001' for actorwork
  remotePath: string;
};

const registrations: ServiceUIRegistration[] = [];
const uiFeatureList: UiFeatureManifestSection[] = [];

function registerFeatures(manifest: Partial<Manifest>, service: Partial<ServiceManifestSection>, features: UiFeatureManifestSection | UiFeatureManifestSection[]) {

    for (const feature of Array.isArray(features) ? features : [features]) {
        const product = { ...manifest.product, ...service.product, ...feature.product };
        const registration: ServiceUIRegistration = {
          namespace: product?.domain || 'default', // Assuming namespace is derived from product domain
          featureName: feature.name || 'unnamed-feature',
          version: product.version || '1.0.0',
          matchingVersionRange: product.version || 'none',
          serviceUrl: feature.serverUrl || 'none',
          remotePath: feature.remotePath || 'none'
        };
        uiFeatureList.push(feature);
        registrations.push(registration);
  }
}

function getRegisteredFeatures() {
  return [...registrations];
}

export {
  registerFeatures,
  getRegisteredFeatures
}