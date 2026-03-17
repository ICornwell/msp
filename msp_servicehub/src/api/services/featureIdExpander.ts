import { Manifest, ServiceManifestSection, ActivityFeatureManifestSection,
  UiFeatureManifestSection, ApiFeatureManifestSection, ManifestCommon } from "msp_common";

export function unPartial<T extends ManifestCommon>(manifestPart: Partial<T>): T {

  return {
    namespace: manifestPart.namespace || 'default',
    name: manifestPart.name || 'default',
    version: manifestPart.version || '1.0.0',
    variantName: manifestPart.variantName || 'default',
    ...manifestPart
  } as T
}

export function expandFeatureName<T extends ActivityFeatureManifestSection | ApiFeatureManifestSection |
UiFeatureManifestSection>(manifest: Partial<Manifest>, service  : Partial<ServiceManifestSection>, feature:T): T {

    const fm = unPartial(manifest);
    const fs = unPartial(service);

    feature.namespace = feature.namespace || fs.namespace || fm.namespace || 'default';
    feature.name = feature.name || fs.name || fm.name || 'default';
    feature.version = feature.version || fs.version || fm.version || '1.0.0';
    feature.variantName = feature.variantName || fs.variantName || fm.variantName || 'default';

    return feature
}