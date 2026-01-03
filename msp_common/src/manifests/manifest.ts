

export declare type Manifest = {
  domain: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  allowedContexts: string[]; // e.g., ['admin', 'user', '*']
  serverUrl: string; // e.g., URL or file path
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
   remotePath: string;
}

export declare type ApiFeatureManifest = Manifest & {
 information: InformationManifest[]
 work: WorkManifest[]
}

export declare type InformationManifest = Manifest & {
 
}

export declare type WorkManifest = Manifest & {
 
}