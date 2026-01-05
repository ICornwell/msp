import { ProductConfig } from "../sharedconfig.js";

export declare type ManifestCommon = {
  // manifest sections can restrict usage contexts
  allowedContexts: string[]; // e.g., ['admin', 'user', '*']
  // manifest sections can speficy products ot override
  // higer level product info set to '?' to indicate overrides
  product?: Partial<ProductConfig>
}

export declare type Manifest = ManifestCommon & {
  description?: string;
  author?: string;
  serverUrl: string; // e.g., URL or file path
  services?: ServiceManifestSection[]
}



export declare type DomainManifest = Manifest & {
  informationPackages: InformationManifestSection[]
  subDomains: DomainManifest[]
  work: WorkManifestSection[]
}

export declare type ServiceManifestSection = ManifestCommon & {
 informationPackages: InformationManifestSection[]
 uiFeatures: UiFeatureManifestSection[]
 apiFeatures: ApiFeatureManifestSection[]
 work: WorkManifestSection[]
}

export declare type UiFeatureManifestSection =  ManifestCommon &{
   remotePath: string;
}

export declare type ApiFeatureManifestSection = ManifestCommon & {
 information: InformationManifestSection[]
 work: WorkManifestSection[]
}

export declare type InformationManifestSection = ManifestCommon & {
 
}

export declare type WorkManifestSection = ManifestCommon & {
 
}