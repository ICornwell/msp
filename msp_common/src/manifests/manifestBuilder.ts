import { Manifest, ServiceManifestSection,
   UiFeatureManifestSection, ApiFeatureManifestSection, ActivityFeatureManifestSection } from './manifest.js'
import { Config, ProductConfig } from '../sharedconfig.js'

export interface ManifestBuilder {
  addService(name: string, version?: string, variantName?: string): ManifestServiceBuilder
  forProducts(products: Partial<ProductConfig>[]): ManifestBuilder
  withAllowedContexts(contexts: string[]): ManifestBuilder
  build(): Partial<Manifest>
}

export function makeManifest(config: Partial<Config>): ManifestBuilder {

  const values: {
    allowedContexts: string[]
    serviceBuilders: ManifestServiceBuilder[]
    forProducts: Partial<ProductConfig>[]
  } = {
    allowedContexts: [],
    serviceBuilders: [],
    forProducts: []
  }
  const builder: ManifestBuilder = {
    addService: (name: string, version: string = "1.0.0", variantName: string = "default") => makeServiceManifest(builder, name, version, variantName, values.serviceBuilders),
    forProducts: (products: Partial<ProductConfig>[]) => { values.forProducts = products; return builder },
    withAllowedContexts: (contexts: string[]) => { values.allowedContexts = contexts; return builder },
    build: () => {
      // Finalize and return the manifest
      return {
        namespace: config.product?.domain,
        name: config.product?.name || 'Unnamed Manifest',
        version: config.product?.version || 'Unnamed Manifest',
        variantName: config.product?.variantName || 'Unnamed Manifest',
        forProducts: values.forProducts,
        serverUrl: config?.myUrl || 'http://localhost',
        serverMFUrl: config?.myMFUrl || 'http://localhost',
        services: values.serviceBuilders.map(sb => sb.build()),
        allowedContexts: values.allowedContexts

      } as Partial<Manifest>;
    }
  }
  return builder
}

export interface ManifestServiceBuilder {
  addUiFeature(name: string, version?: string, variantName?: string): ManifestUiFeatureBuilder
  addApiFeature(name: string, version?: string, variantName?: string): ManifestApiFeatureBuilder
  addActivityFeature(name: string, version?: string, variantName?: string): ManifestActivityFeatureBuilder

  withAllowedContexts(contexts: string[]): ManifestServiceBuilder
  forProducts(products: Partial<ProductConfig>[]): ManifestServiceBuilder

  endService: ManifestBuilder
  build(): Partial<ServiceManifestSection>
}

export function makeServiceManifest(returnTo: ManifestBuilder, name:string, version: string, variantName: string, services: ManifestServiceBuilder[]): ManifestServiceBuilder {
  const feature = {
    name,
    version,
    variantName,
    allowedContexts: ['*'],
    forProducts: [] as Partial<ProductConfig>[],
    uiFeatureBuilders: [] as ManifestUiFeatureBuilder[],
    apiFeatureBuilders: [] as ManifestApiFeatureBuilder[],
    activityFeatureBuilders: [] as ManifestActivityFeatureBuilder[]
  }


  const builder = {
    addUiFeature: (name: string, version: string = "1.0.0", variantName: string = "default") => makeUiFeatureManifest(builder, name, version, variantName, feature.uiFeatureBuilders),
    addApiFeature: (name: string, version: string = "1.0.0", variantName: string = "default") => makeApiFeatureManifest(builder, name, version, variantName, feature.apiFeatureBuilders),
    addActivityFeature: (name: string, version: string = "1.0.0", variantName: string = "default") => makeActivityFeatureManifest(builder, name, version, variantName, feature.activityFeatureBuilders),
    withAllowedContexts: (contexts: string[]) => { feature.allowedContexts = contexts; return builder },
    forProducts: (products: Partial<ProductConfig>[]): ManifestServiceBuilder => { feature.forProducts = products; return builder },
    endService: returnTo,
    build: () => {
      const serviceManifest: Partial<ServiceManifestSection> = {
        name: feature.name,
        version: feature.version,
        variantName: feature.variantName,
        allowedContexts: feature.allowedContexts,
        forProducts: feature.forProducts,
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
  forProducts(product: Partial<ProductConfig>[]): ManifestUiFeatureBuilder

  endUiFeature: ManifestServiceBuilder
  build(): UiFeatureManifestSection
}

export interface ManifestApiFeatureBuilder {
  withRemoteName(remoteName: string): ManifestApiFeatureBuilder
  withAllowedContexts(contexts: string[]): ManifestApiFeatureBuilder
  forProducts(product: Partial<ProductConfig>[]): ManifestApiFeatureBuilder

  endApiFeature: ManifestServiceBuilder
  build(): ApiFeatureManifestSection
}

export interface ManifestActivityFeatureBuilder {
  withRemoteName(remoteName: string): ManifestActivityFeatureBuilder
  withAllowedContexts(contexts: string[]): ManifestActivityFeatureBuilder
  forProducts(product: Partial<ProductConfig>[]): ManifestActivityFeatureBuilder

  endActivityFeature: ManifestServiceBuilder
  build(): ActivityFeatureManifestSection
}

export function makeUiFeatureManifest(returnTo: ManifestServiceBuilder, name: string, version: string, variantName: string, featureBuilders: ManifestUiFeatureBuilder[]): ManifestUiFeatureBuilder {
  const values = {
    name,
    version,
    variantName,
    remoteName: 'default-remote',
    allowedContexts: ['*'],
    forProducts: {} as Partial<ProductConfig>[]
  }


  const builder = {
    withRemoteName: (remoteName: string) => { values.remoteName = remoteName; return builder },
    withAllowedContexts: (contexts: string[]) => { values.allowedContexts = contexts; return builder },
    forProducts: (products: Partial<ProductConfig>[]): ManifestUiFeatureBuilder => { values.forProducts = products; return builder },
    endUiFeature: returnTo,
    build: () => {
      // Finalize and return the manifest
      const uiFeatureManifest: UiFeatureManifestSection = {
        name: values.name,
        version: values.version,
        variantName: values.variantName,
        remotePath: values.remoteName,
        allowedContexts: values.allowedContexts,
        forProducts: values.forProducts
      }
      return uiFeatureManifest

    }
  }
  featureBuilders.push(builder)
  return builder
}

export function makeApiFeatureManifest(returnTo: ManifestServiceBuilder, name: string, version: string, variantName: string, featureBuilders: ManifestApiFeatureBuilder[]): ManifestApiFeatureBuilder {
  const values = {
    name,
    version,
    variantName,
    remoteName: 'default-remote',
    allowedContexts: ['*'],
    forProducts: {} as Partial<ProductConfig>[]
  }


  const builder = {
    withRemoteName: (remoteName: string) => { values.remoteName = remoteName; return builder },
    withAllowedContexts: (contexts: string[]) => { values.allowedContexts = contexts; return builder },
    forProducts: (products: Partial<ProductConfig>[]): ManifestApiFeatureBuilder => { values.forProducts = products; return builder },
    endApiFeature: returnTo,
    build: () => {
      // Finalize and return the manifest
      const apiFeatureManifest: ApiFeatureManifestSection = {
        name: values.name,
        version: values.version,
        variantName: values.variantName,
        remotePath: values.remoteName,
        allowedContexts: values.allowedContexts,
        forProducts: values.forProducts
      }
      return apiFeatureManifest

    }
  }
  featureBuilders.push(builder)
  return builder
}

export function makeActivityFeatureManifest(returnTo: ManifestServiceBuilder, name: string, version: string, variantName: string, featureBuilders: ManifestActivityFeatureBuilder[]): ManifestActivityFeatureBuilder {
  const values = {
    name,
    version,
    variantName,
    remoteName: 'default-remote',
    allowedContexts: ['*'],
    forProducts: {} as Partial<ProductConfig>[]
  }


  const builder = {
    withRemoteName: (remoteName: string) => { values.remoteName = remoteName; return builder },
    withAllowedContexts: (contexts: string[]) => { values.allowedContexts = contexts; return builder },
    forProducts: (products: Partial<ProductConfig>[]): ManifestActivityFeatureBuilder => { values.forProducts = products; return builder },
    endActivityFeature: returnTo,
    build: () => {
      // Finalize and return the manifest
      const activityFeatureManifest: ActivityFeatureManifestSection = {
        name: values.name,
        version: values.version,
        variantName: values.variantName,
        remotePath: values.remoteName,
        allowedContexts: values.allowedContexts,
        forProducts: values.forProducts
      }
      return activityFeatureManifest

    }
  }
  featureBuilders.push(builder)
  return builder
}