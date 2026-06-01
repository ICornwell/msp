import { Manifest, ServiceManifestSection,
   UiFeatureManifestSection, ApiFeatureManifestSection, ActivityFeatureManifestSection,
  TypeVariantsManifestBlock, ManifestTypeVariants, TypedManifest,
  TypedServiceManifestSection, TypedFeatureManifestSection, CompoundKeyFromSection, 
  MergeTypeVariantsManifestBlocks,
  TypeVariantsScopeFromBlock,
  MergeManifestTypeVariants,
  EmptyManifestTypeVariants,
  DataFeatureManifestSection} from './manifest.js'
import { Config, ProductConfig } from '../sharedconfig.js'

// Flatten - recursively flattens intersection types into a single object type
// Apply this to the final extracted type: Flatten<typeof builder.data>
export type Flatten<T> = T extends Array<infer AT>
  ? FlattenObject<AT>[]
  : FlattenObject<T>;

type FlattenObject<T> = T extends (Object | undefined)
  ? { [K in keyof T]: T[K] extends Array<infer Item>
      ? FlattenObject<Exclude<Item, undefined>>[]
      : (T[K] extends (Object | undefined)
        ? FlattenObject<T[Exclude<K, undefined>]>
        : T[K]
        )
    }
  : T;

type AnyTypedServiceSection = TypedServiceManifestSection<any, any>;
type SeededServiceTypeVariants = ManifestTypeVariants<{}, {}, {}>;
type NameTriplet<
  TName extends string = string,
  TVersion extends string = string,
  TVariantName extends string = string,
> = {
  name: TName;
  version: TVersion;
  variantName: TVariantName;
};

type SeededServiceSection<TTriplet extends NameTriplet = NameTriplet> = TypedServiceManifestSection<
  TTriplet['name'],
  TTriplet['version'],
  TTriplet['variantName'],
  SeededServiceTypeVariants,
  {},
  {},
  {}
>;

type UPSERTTypeVariants<
  TVariantContainer,
  TNewVariants extends TypeVariantsManifestBlock,
> = TVariantContainer extends { TypeVariants: infer TVariants }
  ? Omit<TVariantContainer, 'TypeVariants'> & {
      TypeVariants: TVariants extends ManifestTypeVariants
        ? MergeManifestTypeVariants<TVariants, TypeVariantsScopeFromBlock<TNewVariants>>
        : TVariants extends TypeVariantsManifestBlock
          ? TypeVariantsScopeFromBlock<MergeTypeVariantsManifestBlocks<TVariants, TNewVariants>>
          : TypeVariantsScopeFromBlock<TNewVariants>;
    }
  : TVariantContainer extends { typeVariants?: infer TVariants }
    ? Omit<TVariantContainer, 'typeVariants'> & {
        typeVariants: TVariants extends ManifestTypeVariants
          ? MergeManifestTypeVariants<TVariants, TypeVariantsScopeFromBlock<TNewVariants>>
          : TVariants extends TypeVariantsManifestBlock
            ? TypeVariantsScopeFromBlock<MergeTypeVariantsManifestBlocks<TVariants, TNewVariants>>
            : MergeManifestTypeVariants<EmptyManifestTypeVariants, TypeVariantsScopeFromBlock<TNewVariants>>;
      }
    : TVariantContainer;

export type ManifestBuildResult<
  TManifest extends TypedManifest
> = {
  SimpleManifest: Manifest;
  TypedManifest: TManifest;
};

type NameFrom<NameBearer> = NameBearer extends { name?: infer N } ? (N extends string ? N : never) : never;
type VersionFrom<VersionBearer> = VersionBearer extends { version?: infer V } ? (V extends string ? V : never) : never;
type VariantNameFrom<VariantNameBearer> = VariantNameBearer extends { variantName?: infer VN } ? (VN extends string ? VN : never) : never;

type UPSERTServiceToManifest<TManifest extends TypedManifest, TService extends TypedServiceManifestSection> 
= Omit<TManifest, 'Services'> & { Services: TManifest['Services'] & { [K in CompoundKeyFromSection<TService>]: TService } };

type UPSERTUiFeatureToService<
  TService extends TypedServiceManifestSection,
  TFeature extends UiFeatureManifestSection,
> = Omit<TService, 'UiFeatures'> & {
  UiFeatures: TService['UiFeatures'] & { [K in CompoundKeyFromSection<TFeature>]: TFeature };
};

type UPSERTApiFeatureToService<
  TService extends TypedServiceManifestSection,
  TFeature extends ApiFeatureManifestSection,
> = Omit<TService, 'ApiFeatures'> & {
  ApiFeatures: TService['ApiFeatures'] & { [K in CompoundKeyFromSection<TFeature>]: TFeature };
};

type UPSERTActivityFeatureToService<
  TService extends TypedServiceManifestSection,
  TFeature extends ActivityFeatureManifestSection,
> = Omit<TService, 'ActivityFeatures'> & {
  ActivityFeatures: TService['ActivityFeatures'] & { [K in CompoundKeyFromSection<TFeature>]: TFeature };
};

type UPSERTDataFeatureToService<
  TService extends TypedServiceManifestSection,
  TFeature extends DataFeatureManifestSection,
> = Omit<TService, 'DataFeatures'> & {
  DataFeatures: TService['DataFeatures'] & { [K in CompoundKeyFromSection<TFeature>]: TFeature };
};

// type AddTypeVariantsToService<TService extends TypedServiceManifestSection, TBlock extends TypeVariantsManifestBlock> 
// = Omit<TService, 'TypeVariants'> & { TypeVariants: MergeManifestTypeVariants<TypeVariantsScopeFromBlock<TBlock>, TService['TypeVariants']> }
 

function toCompoundName(section: { name?: string; version?: string; variantName?: string }): string | undefined {
  if (typeof section?.name !== 'string') {
    return undefined;
  }
  const normalizedVersion = typeof section?.version === 'string'
    ? section.version.replace(/\./g, '_')
    : undefined;
  if (typeof section?.version === 'string' && typeof section?.variantName === 'string') {
    return `${section.name}_${normalizedVersion}_${section.variantName}`;
  }
  if (typeof section?.version === 'string') {
    return `${section.name}_${normalizedVersion}`;
  }
  return section.name;
}

function toNamedSectionMap<TItem extends { name?: string; version?: string; variantName?: string }>(
  items: readonly TItem[] | undefined,
): Record<string, TItem> {
  return Object.fromEntries(
    (items ?? [])
      .map((item) => {
        const key = toCompoundName(item);
        return key ? [key, item] : undefined;
      })
      .filter((entry): entry is [string, TItem] => Array.isArray(entry)),
  );
}

function toTypeVariantMaps(typeVariants?: TypeVariantsManifestBlock): ManifestTypeVariants {
  const actorEntries = toNamedSectionMap(typeVariants?.actorTypeVariants);
  const workEntries = toNamedSectionMap(typeVariants?.workTypeVariants);
  const linkEntries = toNamedSectionMap(typeVariants?.linkTypeVariants);

  return {
    Actor: actorEntries,
    Work: workEntries,
    Link: linkEntries,
  };
}

function toSectionMap(services: AnyTypedServiceSection[]): Record<string, AnyTypedServiceSection> {
  return toNamedSectionMap(services);
}

export interface ManifestBuilder<
  TManifest extends TypedManifest
> {

  forProducts(products: Partial<ProductConfig>[]): ManifestBuilder<TManifest>
  withAllowedContexts(contexts: string[]): ManifestBuilder<TManifest>
  withNamespace(namespace: string): ManifestBuilder<TManifest>

  withService<TName extends string, TVersion extends string = '1.0.0', TVariantName extends string = 'default'>(
    name: TName,
    version?: TVersion,
    variantName?: TVariantName,
  ): ManifestServiceBuilder<TManifest, SeededServiceSection<NameTriplet<TName, TVersion, TVariantName>>>
  withTypeVariants<TBlock extends TypeVariantsManifestBlock>(typeVariants: TBlock): ManifestBuilder<UPSERTTypeVariants<TManifest, TBlock>>

  build(): Manifest
  buildTyped(): TManifest
  buildFull(): ManifestBuildResult<TManifest>
}

export function makeManifest(config: Partial<Config>): ManifestBuilder<TypedManifest<{}>> {
  return makeAnyManifest<TypedManifest<{},{actorTypeVariants:[],workTypeVariants:[],linkTypeVariants:[]}>>(config);
}

function makeAnyManifest<TManifest extends TypedManifest>(config: Partial<Config>): ManifestBuilder<TManifest> {

  const values: {
    namespace?: string
    allowedContexts: string[]
    serviceBuilders: ManifestServiceBuilder<TManifest, any>[]
    forProducts: Partial<ProductConfig>[]
    typeVariants: TypeVariantsManifestBlock
  } = {
    allowedContexts: [],
    serviceBuilders: [],
    forProducts: [],
    typeVariants: {}
  }
  const builder = {
    withService: (name: string, version: string = "1.0.0", variantName: string = "default") => 
      (makeServiceManifest(builder, name, version, variantName, values.serviceBuilders) as ManifestServiceBuilder<TManifest, SeededServiceSection<NameTriplet<typeof name, typeof version, typeof variantName>>>),
    withTypeVariants: <TBlock extends TypeVariantsManifestBlock>(typeVariants: TBlock) => { values.typeVariants = typeVariants; return builder as ManifestBuilder<UPSERTTypeVariants<TManifest, TBlock>> },
    forProducts: (products: Partial<ProductConfig>[]) => { values.forProducts = products; return builder },
    withAllowedContexts: (contexts: string[]) => { values.allowedContexts = contexts; return builder },
    withNamespace: (namespace: string) => { values.namespace = namespace; return builder },
    build: () => {
      // Finalize and return the manifest
      return {
        namespace: values.namespace || `${config.product?.domain ??'default'}-${config.product?.name ??'default'}`,
        name: config.product?.name || 'Unnamed Manifest',
        version: config.product?.version || 'Unnamed Manifest',
        variantName: config.product?.variantName || 'Unnamed Manifest',
        forProducts: values.forProducts,
        serverUrl: config?.myUrl || 'http://localhost',
        serverMFUrl: config?.myMFUrl || 'http://localhost',
        serverDataUrl: config?.myDataUrl || 'http://localhost',
        typeVariants: values.typeVariants,
        services: values.serviceBuilders.map(sb => sb.build(config)),
        allowedContexts: values.allowedContexts

      } as Manifest;
    },
    buildTyped: () => {
      const services = values.serviceBuilders.map((sb) => sb.buildTyped(config));
      return {
        ...builder.build(),
        Services: toSectionMap(services),
        TypeVariants: toTypeVariantMaps(values.typeVariants),
      } as TManifest;
    },
    buildFull: () => {
      const simpleManifest = builder.build();
      const typedManifest = builder.buildTyped();
      return {
        SimpleManifest: simpleManifest,
        TypedManifest: typedManifest,
      } as ManifestBuildResult<TManifest>;
    }
  } as ManifestBuilder<TManifest>
  return builder as ManifestBuilder<TManifest>;
}

export interface ManifestServiceBuilder<
  TManifest extends TypedManifest,
  TService extends TypedServiceManifestSection = any,

> {
  withServerUrl(serverUrl: string): ManifestServiceBuilder<TManifest,TService>
  withMFServerUrl(serverUrl: string): ManifestServiceBuilder<TManifest,TService>
  withDataServerUrl(serverUrl: string): ManifestServiceBuilder<TManifest,TService>
  withAllowedContexts(contexts: string[]): ManifestServiceBuilder<TManifest,TService>
  forProducts(products: Partial<ProductConfig>[]): ManifestServiceBuilder<TManifest,TService>
  withNamespace(namespace: string): ManifestServiceBuilder<TManifest,TService>

  withTypeVariants<TBlock extends TypeVariantsManifestBlock>(typeVariants: TBlock): 
  ManifestServiceBuilder<UPSERTServiceToManifest<TManifest, UPSERTTypeVariants<TService, TBlock>>,
   UPSERTTypeVariants<TService, TBlock>>

  withUiFeature<TFeatureName extends string, TFeatureVersion extends string = '1.0.0', TFeatureVariantName extends string = 'default'>(name: TFeatureName, version?: TFeatureVersion, variantName?: TFeatureVariantName): ManifestUiFeatureBuilder<TManifest, TService, TypedFeatureManifestSection<UiFeatureManifestSection<TFeatureName, TFeatureVersion, TFeatureVariantName>>>
  withApiFeature<TFeatureName extends string, TFeatureVersion extends string = '1.0.0', TFeatureVariantName extends string = 'default'>(name: TFeatureName, version?: TFeatureVersion, variantName?: TFeatureVariantName): ManifestApiFeatureBuilder<TManifest, TService, TypedFeatureManifestSection<ApiFeatureManifestSection<TFeatureName, TFeatureVersion, TFeatureVariantName>>>
  withActivityFeature<TFeatureName extends string, TFeatureVersion extends string = '1.0.0', TFeatureVariantName extends string = 'default'>(name: TFeatureName, version?: TFeatureVersion, variantName?: TFeatureVariantName): ManifestActivityFeatureBuilder<TManifest, TService, TypedFeatureManifestSection<ActivityFeatureManifestSection<TFeatureName, TFeatureVersion, TFeatureVariantName>>>
  withDataFeature<TFeatureName extends string, TFeatureVersion extends string = '1.0.0', TFeatureVariantName extends string = 'default'>(name: TFeatureName, version?: TFeatureVersion, variantName?: TFeatureVariantName): ManifestDataFeatureBuilder<TManifest, TService, TypedFeatureManifestSection<DataFeatureManifestSection<TFeatureName, TFeatureVersion, TFeatureVariantName>>>


  endService: ManifestBuilder<UPSERTServiceToManifest<TManifest, TService>>
  build(config?: Partial<Config>): ServiceManifestSection<NameFrom<TService>, VersionFrom<TService>, VariantNameFrom<TService>>
  buildTyped(config?: Partial<Config>): TService
}

export function makeServiceManifest<TReturnManifest extends TypedManifest, TName extends string,
 TVersion extends string, TVariantName extends string>(returnTo: ManifestBuilder<TReturnManifest>,
   name:TName, version: TVersion, variantName: TVariantName, services: ManifestServiceBuilder<TReturnManifest, any>[]
  ): ManifestServiceBuilder<TReturnManifest, SeededServiceSection<NameTriplet<TName, TVersion, TVariantName>>> {
  const service = {
    namespace: '',
    name,
    serverUrl: '',
    serverMFUrl: '',
    serverDataUrl: '',
    version,
    variantName,
    allowedContexts: ['*'],
    forProducts: [] as Partial<ProductConfig>[],
    typeVariants: {} as TypeVariantsManifestBlock,
    uiFeatureBuilders: [] as ManifestUiFeatureBuilder<any, any, any>[],
    apiFeatureBuilders: [] as ManifestApiFeatureBuilder<any, any, any>[],
    activityFeatureBuilders: [] as ManifestActivityFeatureBuilder<any, any, any>[],
    dataFeatureBuilders: [] as ManifestDataFeatureBuilder<any, any, any>[]
  }


  const builder : ManifestServiceBuilder<TReturnManifest, SeededServiceSection<NameTriplet<TName, TVersion, TVariantName>>> = {
    withServerUrl: (serverUrl: string) => { service.serverUrl = serverUrl; return builder },
    withMFServerUrl: (serverMFUrl: string) => { service.serverMFUrl = serverMFUrl; return builder },
    withDataServerUrl: (serverDataUrl: string) => { service.serverDataUrl = serverDataUrl; return builder },
    withAllowedContexts: (contexts: string[]) => { service.allowedContexts = contexts; return builder },
    forProducts: (products: Partial<ProductConfig>[]) => { service.forProducts = products; return builder },
    withNamespace: (namespace: string) => { service.namespace = namespace; return builder },

     withTypeVariants: <TBlock extends TypeVariantsManifestBlock>(typeVariants: TBlock) => { service.typeVariants = typeVariants;
      return builder as unknown as ManifestServiceBuilder<UPSERTServiceToManifest<TReturnManifest, UPSERTTypeVariants<SeededServiceSection<NameTriplet<TName, TVersion, TVariantName>>, TBlock>>, UPSERTTypeVariants<SeededServiceSection<NameTriplet<TName, TVersion, TVariantName>>, TBlock>> },

    withUiFeature: <TFeatureName extends string, TFeatureVersion extends string = '1.0.0',
     TFeatureVariantName extends string = 'default'>(name: TFeatureName, 
      version: TFeatureVersion = "1.0.0" as TFeatureVersion,
       variantName: TFeatureVariantName = "default" as TFeatureVariantName) => makeUiFeatureManifest<
      TReturnManifest,
      SeededServiceSection<NameTriplet<TName, TVersion, TVariantName>>,
      TypedFeatureManifestSection<UiFeatureManifestSection<TFeatureName, TFeatureVersion, TFeatureVariantName>>,
      TFeatureName,
      TFeatureVersion,
      TFeatureVariantName
    >(builder, name, version, variantName, service.uiFeatureBuilders),
    withApiFeature: <TFeatureName extends string, TFeatureVersion extends string = '1.0.0', TFeatureVariantName extends string = 'default'>(name: TFeatureName, version: TFeatureVersion = "1.0.0" as TFeatureVersion, variantName: TFeatureVariantName = "default" as TFeatureVariantName) => makeApiFeatureManifest<
      TReturnManifest,
      SeededServiceSection<NameTriplet<TName, TVersion, TVariantName>>,
      TypedFeatureManifestSection<ApiFeatureManifestSection<TFeatureName, TFeatureVersion, TFeatureVariantName>>,
      TFeatureName,
      TFeatureVersion,
      TFeatureVariantName
    >(builder, name, version, variantName, service.apiFeatureBuilders),
    withActivityFeature: <TFeatureName extends string, TFeatureVersion extends string = '1.0.0', TFeatureVariantName extends string = 'default'>(name: TFeatureName, version: TFeatureVersion = "1.0.0" as TFeatureVersion, variantName: TFeatureVariantName = "default" as TFeatureVariantName) => makeActivityFeatureManifest<
      TReturnManifest,
      SeededServiceSection<NameTriplet<TName, TVersion, TVariantName>>,
      TypedFeatureManifestSection<ActivityFeatureManifestSection<TFeatureName, TFeatureVersion, TFeatureVariantName>>,
      TFeatureName,
      TFeatureVersion,
      TFeatureVariantName
    >(builder, name, version, variantName, service.activityFeatureBuilders),
    withDataFeature: <TFeatureName extends string, TFeatureVersion extends string = '1.0.0', TFeatureVariantName extends string = 'default'>(name: TFeatureName, version: TFeatureVersion = "1.0.0" as TFeatureVersion, variantName: TFeatureVariantName = "default" as TFeatureVariantName) => makeDataFeatureManifest<
      TReturnManifest,
      SeededServiceSection<NameTriplet<TName, TVersion, TVariantName>>,
      TypedFeatureManifestSection<DataFeatureManifestSection<TFeatureName, TFeatureVersion, TFeatureVariantName>>,
      TFeatureName,
      TFeatureVersion,
      TFeatureVariantName
    >(builder, name, version, variantName, service.dataFeatureBuilders),
    
    endService: returnTo as ManifestBuilder<UPSERTServiceToManifest<TReturnManifest, SeededServiceSection<NameTriplet<TName, TVersion, TVariantName>>>>,
    build: (config?: Partial<Config>) => {
      const serviceManifest: ServiceManifestSection<TName, TVersion, TVariantName> = {
        namespace: service.namespace,
        name: service.name,
        version: service.version,
        variantName: service.variantName,
        serverUrl: service.serverUrl || config?.myUrl || 'http://localhost',
        serverMFUrl: service.serverMFUrl || config?.myMFUrl || 'http://localhost',
        serverDataUrl: service.serverDataUrl || config?.myDataUrl || 'http://localhost',
        allowedContexts: service.allowedContexts,
        forProducts: service.forProducts,
        work: [],
        typeVariants: toTypeVariantMaps(service.typeVariants),
        uiFeatures: service.uiFeatureBuilders.map(fb => fb.build(config)),
        activityFeatures: service.activityFeatureBuilders.map(fb => fb.build(config)),
        apiFeatures: service.apiFeatureBuilders.map(fb => fb.build(config)),
        dataFeatures: service.dataFeatureBuilders.map(fb => fb.build(config))
      }

      // Finalize and return the manifest
      return serviceManifest
    },
    buildTyped: (config?: Partial<Config>) => {
      const serviceManifest = builder.build(config) as ServiceManifestSection<TName, TVersion, TVariantName>;
      return {
        ...serviceManifest,
        TypeVariants: toTypeVariantMaps(service.typeVariants),
        UiFeatures: toNamedSectionMap(serviceManifest.uiFeatures),
        ApiFeatures: toNamedSectionMap(serviceManifest.apiFeatures),
        ActivityFeatures: toNamedSectionMap(serviceManifest.activityFeatures),
        DataFeatures: toNamedSectionMap(serviceManifest.dataFeatures)
      } as SeededServiceSection<NameTriplet<TName, TVersion, TVariantName>>;
    }
  } as  ManifestServiceBuilder<TReturnManifest, SeededServiceSection<NameTriplet<TName, TVersion, TVariantName>>>
  services.push(builder)
  return builder as ManifestServiceBuilder<TReturnManifest, SeededServiceSection<NameTriplet<TName, TVersion, TVariantName>>>
}

export interface ManifestUiFeatureBuilder<
  TReturnManifest extends TypedManifest,
  TReturnService extends TypedServiceManifestSection,
  TReturnFeature extends TypedFeatureManifestSection<UiFeatureManifestSection> = TypedFeatureManifestSection<UiFeatureManifestSection>,
> {
  withTypeVariants<TBlock extends TypeVariantsManifestBlock>(typeVariants: TBlock): ManifestUiFeatureBuilder<
    UPSERTServiceToManifest<TReturnManifest, UPSERTUiFeatureToService<TReturnService, UPSERTTypeVariants<TReturnFeature, TBlock>>>,
    UPSERTUiFeatureToService<TReturnService, UPSERTTypeVariants<TReturnFeature, TBlock>>,
    UPSERTTypeVariants<TReturnFeature, TBlock>
  >
  withRemoteName(remoteName: string): ManifestUiFeatureBuilder<TReturnManifest, TReturnService, TReturnFeature>
  withAllowedContexts(contexts: string[]): ManifestUiFeatureBuilder<TReturnManifest, TReturnService, TReturnFeature>
  forProducts(product: Partial<ProductConfig>[]): ManifestUiFeatureBuilder<TReturnManifest, TReturnService, TReturnFeature>

  endUiFeature: ManifestServiceBuilder<
    UPSERTServiceToManifest<TReturnManifest, UPSERTUiFeatureToService<TReturnService, TReturnFeature>>,
    UPSERTUiFeatureToService<TReturnService, TReturnFeature>
  >
  build(config?: Partial<Config>): TReturnFeature
}

export interface ManifestApiFeatureBuilder<
  TReturnManifest extends TypedManifest,
  TReturnService extends TypedServiceManifestSection,
  TReturnFeature extends TypedFeatureManifestSection<ApiFeatureManifestSection> = TypedFeatureManifestSection<ApiFeatureManifestSection>,
> {
  withTypeVariants<TBlock extends TypeVariantsManifestBlock>(typeVariants: TBlock): ManifestApiFeatureBuilder<
    UPSERTServiceToManifest<TReturnManifest, UPSERTApiFeatureToService<TReturnService, UPSERTTypeVariants<TReturnFeature, TBlock>>>,
    UPSERTApiFeatureToService<TReturnService, UPSERTTypeVariants<TReturnFeature, TBlock>>,
    UPSERTTypeVariants<TReturnFeature, TBlock>
  >
  withRemoteName(remoteName: string): ManifestApiFeatureBuilder<TReturnManifest, TReturnService, TReturnFeature>
  withAllowedContexts(contexts: string[]): ManifestApiFeatureBuilder<TReturnManifest, TReturnService, TReturnFeature>
  forProducts(product: Partial<ProductConfig>[]): ManifestApiFeatureBuilder<TReturnManifest, TReturnService, TReturnFeature>

  endApiFeature: ManifestServiceBuilder<
    UPSERTServiceToManifest<TReturnManifest, UPSERTApiFeatureToService<TReturnService, TReturnFeature>>,
    UPSERTApiFeatureToService<TReturnService, TReturnFeature>
  >
  build(config?: Partial<Config>): TReturnFeature
}

export interface ManifestActivityFeatureBuilder<
  TReturnManifest extends TypedManifest,
  TReturnService extends TypedServiceManifestSection,
  TReturnFeature extends TypedFeatureManifestSection<ActivityFeatureManifestSection> = TypedFeatureManifestSection<ActivityFeatureManifestSection>,
> {
  withTypeVariants<TBlock extends TypeVariantsManifestBlock>(typeVariants: TBlock): ManifestActivityFeatureBuilder<
    UPSERTServiceToManifest<TReturnManifest, UPSERTActivityFeatureToService<TReturnService, UPSERTTypeVariants<TReturnFeature, TBlock>>>,
    UPSERTActivityFeatureToService<TReturnService, UPSERTTypeVariants<TReturnFeature, TBlock>>,
    UPSERTTypeVariants<TReturnFeature, TBlock>
  >
  withAllowedContexts(contexts: string[]): ManifestActivityFeatureBuilder<TReturnManifest, TReturnService, TReturnFeature>
  forProducts(product: Partial<ProductConfig>[]): ManifestActivityFeatureBuilder<TReturnManifest, TReturnService, TReturnFeature>

  endActivityFeature: ManifestServiceBuilder<
    UPSERTServiceToManifest<TReturnManifest, UPSERTActivityFeatureToService<TReturnService, TReturnFeature>>,
    UPSERTActivityFeatureToService<TReturnService, TReturnFeature>
  >
  build(config?: Partial<Config>): TReturnFeature
}

export interface ManifestDataFeatureBuilder<
  TReturnManifest extends TypedManifest,
  TReturnService extends TypedServiceManifestSection,
  TReturnFeature extends TypedFeatureManifestSection<DataFeatureManifestSection> = TypedFeatureManifestSection<DataFeatureManifestSection>,
> {
  withTypeVariants<TBlock extends TypeVariantsManifestBlock>(typeVariants: TBlock): ManifestDataFeatureBuilder<
    UPSERTServiceToManifest<TReturnManifest, UPSERTDataFeatureToService<TReturnService, UPSERTTypeVariants<TReturnFeature, TBlock>>>,
    UPSERTDataFeatureToService<TReturnService, UPSERTTypeVariants<TReturnFeature, TBlock>>,
    UPSERTTypeVariants<TReturnFeature, TBlock>
  >
  withAllowedContexts(contexts: string[]): ManifestDataFeatureBuilder<TReturnManifest, TReturnService, TReturnFeature>
  forProducts(product: Partial<ProductConfig>[]): ManifestDataFeatureBuilder<TReturnManifest, TReturnService, TReturnFeature>

  endDataFeature: ManifestServiceBuilder<
    UPSERTServiceToManifest<TReturnManifest, UPSERTDataFeatureToService<TReturnService, TReturnFeature>>,
    UPSERTDataFeatureToService<TReturnService, TReturnFeature>
  >
  build(config?: Partial<Config>): TReturnFeature
}

export function makeUiFeatureManifest<
  TReturnManifest extends TypedManifest,
  TReturnService extends TypedServiceManifestSection,
  TReturnFeature extends TypedFeatureManifestSection<UiFeatureManifestSection>,
  TName extends string = NameFrom<TReturnFeature>,
  TVersion extends string = VersionFrom<TReturnFeature>,
  TVariantName extends string = VariantNameFrom<TReturnFeature>,
>(returnTo: ManifestServiceBuilder<TReturnManifest, TReturnService>, name: TName, version: TVersion, variantName: TVariantName, featureBuilders: ManifestUiFeatureBuilder<any, any, any>[]): ManifestUiFeatureBuilder<TReturnManifest, TReturnService, TReturnFeature> {
  const values = {
    name,
    version,
    variantName,
    remoteName: 'default-remote',
    allowedContexts: ['*'],
    forProducts: {} as Partial<ProductConfig>[],
    typeVariants: {} as TypeVariantsManifestBlock
  }


  const builder = {
    withTypeVariants: <TBlock extends TypeVariantsManifestBlock>(typeVariants: TBlock) => { values.typeVariants = typeVariants; return builder as unknown as ManifestUiFeatureBuilder<
      UPSERTServiceToManifest<TReturnManifest, UPSERTUiFeatureToService<TReturnService, UPSERTTypeVariants<TReturnFeature, TBlock>>>,
      UPSERTUiFeatureToService<TReturnService, UPSERTTypeVariants<TReturnFeature, TBlock>>,
      UPSERTTypeVariants<TReturnFeature, TBlock>
    > },
    withRemoteName: (remoteName: string) => { values.remoteName = remoteName; return builder },
    withAllowedContexts: (contexts: string[]) => { values.allowedContexts = contexts; return builder },
    forProducts: (products: Partial<ProductConfig>[]) => { values.forProducts = products; return builder },
    endUiFeature: returnTo,
    build: (_config?: Partial<Config>) => {
      // Finalize and return the manifest
      const uiFeatureManifest = {
        name: values.name,
        version: values.version,
        variantName: values.variantName,
        remotePath: values.remoteName,
        allowedContexts: values.allowedContexts,
        forProducts: values.forProducts,
        typeVariants: values.typeVariants
      } as unknown as TReturnFeature
      return uiFeatureManifest

    }
  } as unknown as ManifestUiFeatureBuilder<TReturnManifest, TReturnService, TReturnFeature>
  featureBuilders.push(builder)
  return builder as ManifestUiFeatureBuilder<TReturnManifest, TReturnService, TReturnFeature>
}

export function makeApiFeatureManifest<
  TReturnManifest extends TypedManifest,
  TReturnService extends TypedServiceManifestSection,
  TReturnFeature extends TypedFeatureManifestSection<ApiFeatureManifestSection>,
  TName extends string = NameFrom<TReturnFeature>,
  TVersion extends string = VersionFrom<TReturnFeature>,
  TVariantName extends string = VariantNameFrom<TReturnFeature>,
>(returnTo: ManifestServiceBuilder<TReturnManifest, TReturnService>, name: TName, version: TVersion, variantName: TVariantName, featureBuilders: ManifestApiFeatureBuilder<any, any, any>[]): ManifestApiFeatureBuilder<TReturnManifest, TReturnService, TReturnFeature> {
  const values = {
    name,
    version,
    variantName,
    remoteName: 'default-remote',
    allowedContexts: ['*'],
    forProducts: {} as Partial<ProductConfig>[],
    typeVariants: {} as TypeVariantsManifestBlock
  }


  const builder = {
    withTypeVariants: <TBlock extends TypeVariantsManifestBlock>(typeVariants: TBlock) => { values.typeVariants = typeVariants; return builder as unknown as ManifestApiFeatureBuilder<
      UPSERTServiceToManifest<TReturnManifest, UPSERTApiFeatureToService<TReturnService, UPSERTTypeVariants<TReturnFeature, TBlock>>>,
      UPSERTApiFeatureToService<TReturnService, UPSERTTypeVariants<TReturnFeature, TBlock>>,
      UPSERTTypeVariants<TReturnFeature, TBlock>
    > },
    withRemoteName: (remoteName: string) => { values.remoteName = remoteName; return builder },
    withAllowedContexts: (contexts: string[]) => { values.allowedContexts = contexts; return builder },
    forProducts: (products: Partial<ProductConfig>[]) => { values.forProducts = products; return builder },
    endApiFeature: returnTo,
    build: (_config?: Partial<Config>) => {
      // Finalize and return the manifest
      const apiFeatureManifest = {
        name: values.name,
        version: values.version,
        variantName: values.variantName,
        remotePath: values.remoteName,
        allowedContexts: values.allowedContexts,
        forProducts: values.forProducts,
        typeVariants: values.typeVariants
      } as unknown as TReturnFeature
      return apiFeatureManifest

    }
  } as unknown as ManifestApiFeatureBuilder<TReturnManifest, TReturnService, TReturnFeature>
  featureBuilders.push(builder)
  return builder as ManifestApiFeatureBuilder<TReturnManifest, TReturnService, TReturnFeature>
}

export function makeActivityFeatureManifest<
  TReturnManifest extends TypedManifest,
  TReturnService extends TypedServiceManifestSection,
  TReturnFeature extends TypedFeatureManifestSection<ActivityFeatureManifestSection>,
  TName extends string = NameFrom<TReturnFeature>,
  TVersion extends string = VersionFrom<TReturnFeature>,
  TVariantName extends string = VariantNameFrom<TReturnFeature>,
>(returnTo: ManifestServiceBuilder<TReturnManifest, TReturnService>, name: TName, version: TVersion, variantName: TVariantName, featureBuilders: ManifestActivityFeatureBuilder<any, any, any>[]): ManifestActivityFeatureBuilder<TReturnManifest, TReturnService, TReturnFeature> {
  const values = {
    name,
    version,
    variantName,
    activityNamespace: '',
     activityName: '',
     activityVersion: '',
    allowedContexts: ['*'],
    forProducts: {} as Partial<ProductConfig>[],
    typeVariants: {} as TypeVariantsManifestBlock
  }


  const builder = {
    withTypeVariants: <TBlock extends TypeVariantsManifestBlock>(typeVariants: TBlock) => { values.typeVariants = typeVariants; return builder as unknown as ManifestActivityFeatureBuilder<
      UPSERTServiceToManifest<TReturnManifest, UPSERTActivityFeatureToService<TReturnService, UPSERTTypeVariants<TReturnFeature, TBlock>>>,
      UPSERTActivityFeatureToService<TReturnService, UPSERTTypeVariants<TReturnFeature, TBlock>>,
      UPSERTTypeVariants<TReturnFeature, TBlock>
    > },
    withAllowedContexts: (contexts: string[]) => { values.allowedContexts = contexts; return builder },
    forProducts: (products: Partial<ProductConfig>[]) => { values.forProducts = products; return builder },
    endActivityFeature: returnTo,
    build: (_config?: Partial<Config>) => {
      // Finalize and return the manifest
      const activityFeatureManifest = {
        name: values.name,
        version: values.version,
        variantName: values.variantName,
        remotePath: `${values.activityNamespace}/${values.activityName}/${values.activityVersion}`,
        allowedContexts: values.allowedContexts,
        forProducts: values.forProducts,
        typeVariants: values.typeVariants
      } as unknown as TReturnFeature
      return activityFeatureManifest

    }
  } as unknown as ManifestActivityFeatureBuilder<TReturnManifest, TReturnService, TReturnFeature>
  featureBuilders.push(builder)
  return builder as ManifestActivityFeatureBuilder<TReturnManifest, TReturnService, TReturnFeature>
}

export function makeDataFeatureManifest<
  TReturnManifest extends TypedManifest,
  TReturnService extends TypedServiceManifestSection,
  TReturnFeature extends TypedFeatureManifestSection<DataFeatureManifestSection>,
  TName extends string = NameFrom<TReturnFeature>,
  TVersion extends string = VersionFrom<TReturnFeature>,
  TVariantName extends string = VariantNameFrom<TReturnFeature>,
>(returnTo: ManifestServiceBuilder<TReturnManifest, TReturnService>, name: TName, version: TVersion, variantName: TVariantName, featureBuilders: ManifestDataFeatureBuilder<any, any, any>[]): ManifestDataFeatureBuilder<TReturnManifest, TReturnService, TReturnFeature> {
  const values = {
    name,
    version,
    variantName,
    activityNamespace: '',
     activityName: '',
     activityVersion: '',
    allowedContexts: ['*'],
    forProducts: {} as Partial<ProductConfig>[],
    typeVariants: {} as TypeVariantsManifestBlock
  }


  const builder = {
    withTypeVariants: <TBlock extends TypeVariantsManifestBlock>(typeVariants: TBlock) => { values.typeVariants = typeVariants; return builder as unknown as ManifestDataFeatureBuilder<
      UPSERTServiceToManifest<TReturnManifest, UPSERTDataFeatureToService<TReturnService, UPSERTTypeVariants<TReturnFeature, TBlock>>>,
      UPSERTDataFeatureToService<TReturnService, UPSERTTypeVariants<TReturnFeature, TBlock>>,
      UPSERTTypeVariants<TReturnFeature, TBlock>
    > },
    withAllowedContexts: (contexts: string[]) => { values.allowedContexts = contexts; return builder },
    forProducts: (products: Partial<ProductConfig>[]) => { values.forProducts = products; return builder },
    endDataFeature: returnTo,
    build: (_config?: Partial<Config>) => {
      // Finalize and return the manifest
      const dataFeatureManifest = {
        name: values.name,
        version: values.version,
        variantName: values.variantName,
        remotePath: `${values.activityNamespace}/${values.activityName}/${values.activityVersion}`,
        allowedContexts: values.allowedContexts,
        forProducts: values.forProducts,
        typeVariants: values.typeVariants
      } as unknown as TReturnFeature
      return dataFeatureManifest

    }
  } as unknown  as ManifestDataFeatureBuilder<TReturnManifest, TReturnService, TReturnFeature>
  featureBuilders.push(builder)
  return builder as ManifestDataFeatureBuilder<TReturnManifest, TReturnService, TReturnFeature>
}