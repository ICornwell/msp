import { ProductConfig, Manifest, ServiceManifestSection, ActivityFeatureManifestSection, UiFeatureManifestSection, ApiFeatureManifestSection } from "msp_common";

export function unPartial(products: Partial<ProductConfig>[] | undefined): ProductConfig[] {
  if (!products) return [{
    domain: '*',
    name: '*',
    version: '*',
    variantName: '*'
  }]
  return products.map(p => ({
    domain: p.domain || '*',
    name: p.name || '*',
    version: p.version || '*',
    variantName: p.variantName || '*'
  }))??[];
}

export function expandFeatureProducts<T extends ActivityFeatureManifestSection | ApiFeatureManifestSection |
UiFeatureManifestSection>(manifest: Partial<Manifest>, service  : Partial<ServiceManifestSection>, feature:T): ProductConfig[] {

    const forProducts = feature.forProducts?.length??0 > 0 ? unPartial(feature.forProducts) 
    : (service.forProducts?.length??0 > 0 ? unPartial(service.forProducts)
      : (manifest.forProducts?.length??0> 0 ? unPartial(manifest.forProducts)
        : [{ domain: '*', name: '*', version: '*', variantName: '*' }]));

    return forProducts
}