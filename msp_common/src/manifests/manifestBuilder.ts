import { Manifest, ServiceManifestSection, UiFeatureManifestSection } from './manifest.js'
import { Config, ProductConfig } from '../sharedconfig.js'

export interface ManifestBuilder {
  addService(): ManifestServiceBuilder
  withAllowedContexts(contexts: string[]): ManifestBuilder
  build(): Partial<Manifest>
}

export function makeManifest(config: Partial<Config>): ManifestBuilder {

  const values: {
    allowedContexts: string[]
    serviceBuilders: ManifestServiceBuilder[]
  } = {
    allowedContexts: [],
    serviceBuilders: []
  }
  const builder: ManifestBuilder = {
    addService: () => makeServiceManifest(builder, values.serviceBuilders),
    withAllowedContexts: (contexts: string[]) => { values.allowedContexts = contexts; return builder },
    build: () => {
      // Finalize and return the manifest
      return {
        product: {
          domain: config.product?.domain || 'None',
          name: config.product?.name || 'Unnamed Manifest',
          version: config.product?.version || '1.0.0',
          variantName: config.product?.variantName || 'default-variant'
        },
        serverUrl: config?.myUrl || 'http://localhost',
        services: values.serviceBuilders.map(sb => sb.build()),
        allowedContexts: values.allowedContexts

      } as Partial<Manifest>;
    }
  }
  return builder
}

export interface ManifestServiceBuilder {
  addUiFeature(): ManifestUiFeatureBuilder
  withAllowedContexts(contexts: string[]): ManifestServiceBuilder
  forProduct(product: Partial<ProductConfig>): ManifestServiceBuilder

  endService: ManifestBuilder
  build(): Partial<ServiceManifestSection>
}

export function makeServiceManifest(returnTo: ManifestBuilder, services: ManifestServiceBuilder[]): ManifestServiceBuilder {
  const feature = {
    allowedContexts: ['*'],
    product: {} as Partial<ProductConfig>,
    uiFeatureBuilders: [] as ManifestUiFeatureBuilder[]
  }


  const builder = {
    addUiFeature: () => makeUiFeatureManifest(builder, feature.uiFeatureBuilders),
    withAllowedContexts: (contexts: string[]) => { feature.allowedContexts = contexts; return builder },
    forProduct: (product: Partial<ProductConfig>): ManifestServiceBuilder => { feature.product = product; return builder },
    endService: returnTo,
    build: () => {
      const serviceManifest: Partial<ServiceManifestSection> = {
        allowedContexts: feature.allowedContexts,
        product: feature.product,
        uiFeatures: feature.uiFeatureBuilders.map(fb => fb.build())
      }

      // Finalize and return the manifest
      return serviceManifest
    }
  }
  services.push(builder)
  return builder
}

export interface ManifestUiFeatureBuilder {
  withRemoteName(remoteName: string): ManifestUiFeatureBuilder
  withAllowedContexts(contexts: string[]): ManifestUiFeatureBuilder
  forProduct(product: Partial<ProductConfig>): ManifestUiFeatureBuilder

  endUiFeature: ManifestServiceBuilder
  build(): UiFeatureManifestSection
}

export function makeUiFeatureManifest(returnTo: ManifestServiceBuilder, featureBuilders: ManifestUiFeatureBuilder[]): ManifestUiFeatureBuilder {
  const values = {
    remoteName: 'default-remote',
    allowedContexts: ['*'],
    product: {} as Partial<ProductConfig>
  }


  const builder = {
    withRemoteName: (remoteName: string) => { values.remoteName = remoteName; return builder },
    withAllowedContexts: (contexts: string[]) => { values.allowedContexts = contexts; return builder },
    forProduct: (product: Partial<ProductConfig>): ManifestUiFeatureBuilder => { values.product = product; return builder },
    endUiFeature: returnTo,
    build: () => {
      // Finalize and return the manifest
      const uiFeatureManifest: UiFeatureManifestSection = {
        remotePath: values.remoteName,
        allowedContexts: values.allowedContexts,
        product: values.product
      }
      return uiFeatureManifest

    }
  }
  featureBuilders.push(builder)
  return builder
}