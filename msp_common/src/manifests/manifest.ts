

export declare type Manifest = {
  domain: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
}

export declare type DomainManifest = Manifest & {
  informationPackages: InformationManifest[]
  subDomains: DomainManifest[]
  work: WorkManifest[]
}

export declare type ServiceManifest = Manifest & {
 informationPackages: InformationManifest[]
 uiFeatures: UiFeatureManifest[]
 apiFeatures: UiFeatureManifest[]
 work: WorkManifest[]
}

export declare type UiFeatureManifest = Manifest & {
 informationPackages: InformationManifest[]
 work: WorkManifest[]
}

export declare type ApiFeatureManifest = Manifest & {
 information: InformationManifest[]
 work: WorkManifest[]
}

export declare type InformationManifest = Manifest & {
 
}

export declare type WorkManifest = Manifest & {
 
}