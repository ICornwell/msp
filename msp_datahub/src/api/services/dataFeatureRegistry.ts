import type { DataFeatureManifestSection } from 'msp_svr_common';

type RegisteredDataFeature = DataFeatureManifestSection & {
  manifestNamespace?: string;
  serviceName?: string;
};

const dataFeatures: RegisteredDataFeature[] = [];

function featureKey(feature: RegisteredDataFeature): string {
  return [
    feature.manifestNamespace || '*',
    feature.serviceName || '*',
    feature.namespace || '*',
    feature.name || '*',
    feature.version || '1.0.0',
    feature.variantName || 'default',
  ].join('|');
}

export function registerDataFeatures(
  features: RegisteredDataFeature[],
): { added: number; total: number } {
  const existing = new Set(dataFeatures.map(featureKey));
  let added = 0;

  for (const feature of features) {
    const key = featureKey(feature);
    if (!existing.has(key)) {
      dataFeatures.push(feature);
      existing.add(key);
      added += 1;
    }
  }

  return { added, total: dataFeatures.length };
}

export function getRegisteredDataFeatures(): RegisteredDataFeature[] {
  return [...dataFeatures];
}
