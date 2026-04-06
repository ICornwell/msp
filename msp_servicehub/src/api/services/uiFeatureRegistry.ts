import { bestVersionMatch, isMatch, type Manifest, type ServiceManifestSection, type UiFeatureManifestSection} from "msp_svr_common"
import { expandFeatureProducts } from "./productsListExpander.js";
import { expandFeatureName } from "./featureIdExpander.js";
import { UiRemoteRegistration } from "msp_common";

const registrations: UiFeatureManifestSection[] = [];

const featureAliases: Record<string, [string, UiFeatureManifestSection]> = {}

function featureUnqiueName(feature: UiFeatureManifestSection): string {
  return `${feature.namespace}/${feature.name}`;
}


export function registerFeatures(manifest: Partial<Manifest>, service: Partial<ServiceManifestSection>, features: UiFeatureManifestSection | UiFeatureManifestSection[]) {
    
    for (const feature of Array.isArray(features) ? features : [features]) {
      const forProducts = expandFeatureProducts(manifest, service, feature);
      const namedFeature = expandFeatureName(manifest, service, feature);

      const unqiueName = featureUnqiueName(namedFeature);
      
        const registration: UiFeatureManifestSection = {
          ...feature,
          serverUrl: feature.serverUrl ?? service.serverUrl ?? manifest.serverUrl,
          serverMFUrl: feature.serverMFUrl ?? service.serverMFUrl ?? manifest.serverMFUrl,
          forProducts,
        };
        let alias = (feature.namespace ?? 'default').toLowerCase();
        const existingIndex = registrations.findIndex(r => isSameFeature(r, registration));
        if (existingIndex >= 0) {
          registrations.splice(existingIndex, 1);
          // find and remove the existing alias if it exists
          const aliasEntry = Object.entries(featureAliases).find(([_, v]) => v?.[0] === unqiueName);
          if (aliasEntry) {
            alias = aliasEntry[0];
          }
        }
        if (!featureAliases[feature.remotePath]) {
          featureAliases[feature.remotePath] = [unqiueName, registration];
        }
        featureAliases[alias] = [unqiueName, registration];
        registrations.push(registration);
  }

  function isSameFeature(a: UiFeatureManifestSection, b: UiFeatureManifestSection): unknown {
    return a.namespace === b.namespace && a.name === b.name
       && a.version === b.version && a.variantName === b.variantName;
  }
}

export function getFeatureAliasForProduct(featureNamespace: string, featureName: string,
  productDomain: string, productName: string ,productVersion: string, productVariantName: string)
    : UiRemoteRegistration | null {
      const features = getRegisteredFeaturesByAlias();
      const candidateFeatures = Object.entries(features).filter(([_a, [_n,f]]) => isMatch(f.namespace??'*', featureNamespace)
          && isMatch(f.name??'*', featureName));

      function getVersionRangeForProduct(feature: UiFeatureManifestSection): string | undefined {
        const matchingProduct = feature.forProducts?.find(p => isMatch(p.domain??'*', productDomain)
          && isMatch(p.name??'*', productName)
          && isMatch(p.variantName??'*', productVariantName));
        return matchingProduct ? matchingProduct.version : undefined;
      }
  
      const bestFeatures = bestVersionMatch(candidateFeatures, productVersion,
        (f) => f[1][0]
        , (f) => f[1][1].version??'*', (f) => (getVersionRangeForProduct(f[1][1]) ?? 'none'));
      
      if (bestFeatures.length === 0) {
        return null
      }
      const feature = bestFeatures[0];
      const remoteFileName = feature[1][1].remotePath;
      const remoteContainerName = feature[1][1].namespace
        || 'default';

      return {
        remoteFileName,
        remoteName: remoteContainerName,
        remoteEntry: feature[1][1].serverMFUrl ?? feature[1][1].serverUrl ?? 'none',
        moduleName: feature[1][1].name ?? 'default',
      };
}

export function getRegisteredFeaturesByAlias() {
  return featureAliases;
}

export function getRegisteredFeatures() {
  return registrations;
}
