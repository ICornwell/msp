import { View } from "msp_common";
import { ProductConfig } from "../sharedconfig.js";

export type OptStr = string | undefined;

export type ManifestResourceType = 'feature' | 'service' | 'work' | 'actor' | 'view';

export type VersionedNamespaceResourceId = {
  type: ManifestResourceType;
  namespace?: string;
  name: string;
  version?: string;
  variantName?: string;
};

export declare type ManifestCommon<N extends string = string, VR extends string = string, VN extends string = string> = {
  // manifest sections can restrict usage contexts
  allowedContexts: string[]; // e.g., ['admin', 'user', '*']
  // manifest sections can speficy products ot override
  // higer level product info set to '?' to indicate overrides
  forProducts?: Partial<ProductConfig>[]
  name?: N,
  version?: VR,
  variantName?: VN,
  description?: string,
  serverUrl?: string,
  serverMFUrl?: string,
  serverDataUrl?: string,
  namespace?: string,
  typeVariants?: TypeVariantsScopeFromBlock<any>
}

export declare type Manifest<N extends string = string, VR extends string = string, VN extends string = string> = ManifestCommon<N, VR, VN> & {
  description?: string;
  author?: string;
  serverUrl: string; // e.g., URL or file path
  serverMFUrl: string;
  serverDataUrl: string;
  services?: ServiceManifestSection[]
}



export declare type DomainManifest<N extends string = string, VR extends string = string, VN extends string = string> = Manifest<N, VR, VN> & {
  dataFeatures: DataFeatureManifestSection[]
  subDomains: DomainManifest[]
  work: WorkManifestSection[]
}

export declare type ServiceManifestSection<N extends string = string, VR extends string = string, VN extends string = string> = ManifestCommon<N, VR, VN> & {

 dataFeatures: DataFeatureManifestSection[]
 uiFeatures: UiFeatureManifestSection[]
 apiFeatures: ApiFeatureManifestSection[]
 activityFeatures: ActivityFeatureManifestSection[]
 work: WorkManifestSection[]
 directViews: ViewsManifestSection[]
}

export declare type UiFeatureManifestSection<N extends string = string, VR extends string = string, VN extends string = string> =  ManifestCommon<N, VR, VN> &{
   remotePath: string;
}

export declare type ActivityFeatureManifestSection<N extends string = string, VR extends string = string, VN extends string = string> =  ManifestCommon<N, VR, VN> &{
  useForViewReads: View[]; 
  useForViewWrites: View[]; 
  remotePath: string;
   
}

export declare type ApiFeatureManifestSection<N extends string = string, VR extends string = string, VN extends string = string> = ManifestCommon<N, VR, VN> & {
 remotePath: string;
}

export declare type DataFeatureManifestSection<N extends string = string, VR extends string = string, VN extends string = string> = ManifestCommon<N, VR, VN> & {
  useForViewReads: View[]; 
  useForViewWrites: View[]; 
  remotePath: string;
}

// Deprecated alias kept for transition.
export declare type ViewsManifestSection = { owner: VersionedNamespaceResourceId, view: View, isWriteAllowed: boolean };

export declare type WorkManifestSection<N extends string = string, VR extends string = string, VN extends string = string> = ManifestCommon<N, VR, VN> & {
 
}

export declare type TypeVariantsManifestBlock = {
  actorTypeVariants?: readonly ActorTypeVariantManifestSection[]
  workTypeVariants?: readonly WorkTypeVariantManifestSection[]
  linkTypeVariants?: readonly LinkTypeVariantManifestSection[]
}

export declare type ActorCoreType = 'user' | 'system' | 'team' | 'group' | 'division' | 'branch' | 'organization';

export declare type WorkCoreType = 'file' | 'resource' | 'case' | 'job' | 'process' | 'taskGroup' | 'task';

export declare type TypeVariantManifestCommon<N extends string = string, VR extends string = string, VN extends string = string> = ManifestCommon<N, VR, VN> & {
  namespace?: string
  product?: string
  shortName?: string
  longName?: string
  icon?: string
  featurePermissions?: string[]
  dataEntitlements?: string[]
  objectives?: string[]
  purpose?: string
  declaredByFeatures?: string[]
}

export declare type ActorTypeVariantManifestSection<N extends string = string, VR extends string = string, VN extends string = string> = TypeVariantManifestCommon<N, VR, VN> & {
  extendsType: ActorCoreType
}

export declare type WorkTypeVariantManifestSection<N extends string = string, VR extends string = string, VN extends string = string> = TypeVariantManifestCommon<N, VR, VN> & {
  extendsType: WorkCoreType
}

export declare type LinkPrototypeEndpointManifestSection = {
  kind: 'actor' | 'work' | 'actorVariant' | 'workVariant'
  coreType?: ActorCoreType | WorkCoreType
  variantName?: string
  namespace?: string
  product?: string
}

export declare type LinkTypeVariantManifestSection<N extends string = string, VR extends string = string, VN extends string = string> = TypeVariantManifestCommon<N, VR, VN> & {
  linkType: 'isMemberOf' | 'isSubsetOf' | 'underAuthorityOf' | 'creates' | 'changes' | 'closes' | 'contributesTo'
  from: LinkPrototypeEndpointManifestSection
  to: LinkPrototypeEndpointManifestSection
  staticAttributes?: Record<string, unknown>
  lifecycleActivities?: {
    onCreate?: string[]
    onChange?: string[]
    onRemove?: string[]
  }
}

// Recursively rewrites dotted semver-like strings (e.g. 1.2.3) to underscore form (1_2_3)
// so generated object keys stay identifier-friendly.
export declare type NormalizeVersionToken<TVersion extends string> =
  TVersion extends `${infer THead}.${infer TTail}`
    ? `${THead}_${NormalizeVersionToken<TTail>}`
    : TVersion;

type StringToken<TValue> = Extract<TValue, string>;

export declare type CompoundKeyFromSection<TSection> =
  TSection extends { name?: infer N }
    ? [StringToken<N>] extends [never]
      ? never
      : TSection extends { version?: infer VR }
        ? [StringToken<VR>] extends [never]
          ? `${StringToken<N>}`
          : TSection extends { variantName?: infer VN }
            ? [StringToken<VN>] extends [never]
              ? `${StringToken<N>}_${NormalizeVersionToken<StringToken<VR>>}`
              : `${StringToken<N>}_${NormalizeVersionToken<StringToken<VR>>}_${StringToken<VN>}`
            : `${StringToken<N>}_${NormalizeVersionToken<StringToken<VR>>}`
        : `${StringToken<N>}`
    : never;

export declare type NamedRecordFromArray<TArray> =
  TArray extends readonly (infer TItem extends { name?: string })[]
    ? { [TNamed in TItem as CompoundKeyFromSection<TNamed>]: TNamed }
    : (TArray extends readonly (infer TItem extends {  })[]
    ? { [TNamed in TItem as string]: TNamed }
    : { [a: string]: never })

export declare type ManifestTypeVariants<
  TActor extends Record<string, ActorTypeVariantManifestSection> = Record<string, ActorTypeVariantManifestSection>,
  TWork extends Record<string, WorkTypeVariantManifestSection> = {},
  TLink extends Record<string, LinkTypeVariantManifestSection> = {},
> = {
  Actor: TActor;
  Work: TWork;
  Link: TLink;
};


export declare type EmptyManifestTypeVariants = ManifestTypeVariants<{}, {}, {}>;

export declare type TypeVariantsScopeFromBlock<TBlock extends TypeVariantsManifestBlock> = ManifestTypeVariants<
  NamedRecordFromArray<(TBlock['actorTypeVariants']) extends readonly ActorTypeVariantManifestSection[] ? TBlock['actorTypeVariants'] : []>,
  NamedRecordFromArray<(TBlock['workTypeVariants']) extends readonly WorkTypeVariantManifestSection[] ? TBlock['workTypeVariants'] : []>,
  NamedRecordFromArray<(TBlock['linkTypeVariants']) extends readonly LinkTypeVariantManifestSection[] ? TBlock['linkTypeVariants'] : []>
>;

export declare type MergeManifestTypeVariants<
  TLeft extends ManifestTypeVariants = { Actor: {}; Work: {}; Link: {} },
  TRight extends ManifestTypeVariants = { Actor: {}; Work: {}; Link: {} },
> = ManifestTypeVariants<
  TLeft['Actor'] & TRight['Actor'],
  TLeft['Work'] & TRight['Work'],
  TLeft['Link'] & TRight['Link']
>;

export declare type EmptyTypeVariantsManifestBlock = {
  actorTypeVariants: [];
  workTypeVariants: [];
  linkTypeVariants: [];
}

export declare type TypedFeatureManifestSection<
  TFeature extends UiFeatureManifestSection<any, any, any> | ApiFeatureManifestSection<any, any, any> | ActivityFeatureManifestSection<any, any, any> = UiFeatureManifestSection<any, any, any>,
  TVariants extends ManifestTypeVariants = any,
> = Omit<TFeature, 'typeVariants'> & {
  typeVariants: TVariants;
};

export declare type MergeTypeVariantsManifestBlocks<
  TLeft extends TypeVariantsManifestBlock = { actorTypeVariants: []; workTypeVariants: []; linkTypeVariants: [] },
  TRight extends TypeVariantsManifestBlock= { actorTypeVariants: []; workTypeVariants: []; linkTypeVariants: [] },
> = {
  actorTypeVariants: [...(TLeft['actorTypeVariants'] extends readonly ActorTypeVariantManifestSection[] ? TLeft['actorTypeVariants'] : []), ...(TRight['actorTypeVariants'] extends readonly ActorTypeVariantManifestSection[] ? TRight['actorTypeVariants'] : [])],
  workTypeVariants: [...(TLeft['workTypeVariants'] extends readonly WorkTypeVariantManifestSection[] ? TLeft['workTypeVariants'] : []), ...(TRight['workTypeVariants'] extends readonly WorkTypeVariantManifestSection[] ? TRight['workTypeVariants'] : [])],
  linkTypeVariants: [...(TLeft['linkTypeVariants'] extends readonly LinkTypeVariantManifestSection[] ? TLeft['linkTypeVariants'] : []), ...(TRight['linkTypeVariants'] extends readonly LinkTypeVariantManifestSection[] ? TRight['linkTypeVariants'] : [])],
}

export declare type TypedServiceManifestSection<
  Name extends string = string,
  Version extends string = string,
  VariantName extends string = string,
  TVariants extends ManifestTypeVariants = any,
  TUiFeatures extends Record<string, UiFeatureManifestSection<any, any, any>> = any,
  TApiFeatures extends Record<string, ApiFeatureManifestSection<any, any, any>> = any,
  TActivityFeatures extends Record<string, ActivityFeatureManifestSection<any, any, any>> = any,
  TDataFeatures extends Record<string, DataFeatureManifestSection<any, any, any>> = any,
> = ServiceManifestSection<Name, Version, VariantName> & {
  TypeVariants: TVariants;
  UiFeatures: TUiFeatures;
  ApiFeatures: TApiFeatures;
  ActivityFeatures: TActivityFeatures;
  DataFeatures: TDataFeatures;
};

export declare type TypedManifest<
  TServices extends {} = any,
  TVariants extends TypeVariantsManifestBlock = any,
> = Manifest & {
  Services: TServices;
  TypeVariants: TVariants;
};