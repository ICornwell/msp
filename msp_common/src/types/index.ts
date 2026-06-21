import {satisfies} from 'semver';

export interface ClientCredentialsConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  scope: string; // e.g., "api://target-service/.default"
  authority?: string; // defaults to Azure AD
  authLibrary?: 'msal' | 'generic'; // Optional property to specify which auth library to use
}

export interface JWTValidationConfig {
  trustedIssuers: string[];
  audience?: string[];
  clockTolerance?: number; // in seconds
  maxTokenAge?: number; // in seconds
}

export type ServicePayload = {
  [key: string]: any;
};

export type ServiceResult = {
  success: boolean;
  data?: any;
  error?: string;
};

export type ServiceActivityFunction = (payload: ServicePayload, result: ServiceResult) => ServiceResult;

export interface ServiceActivityRegistration {
  namespace: string;
  activityName: string;
  version: string;
  activities: ServiceActivityFunction | ServiceActivityFunction[];
}

export type NameTriplet<
  TName extends string = string,
  TVersion extends string = string,
  TVariantName extends string = string,
> = {
  name: TName;
  version: TVersion;
  variantName: TVariantName;
};

export type BusinessElementName<
  TName extends string = string,
  TVersion extends string = string,
  TVariantName extends string = string,
> = NameTriplet<TName, TVersion, TVariantName> & {
  domain: {
    name: string;
    version: string;
    variantName?: string;
  };
};

export type OpsElementName<
  TName extends string = string,
  TVersion extends string = string,
  TVariantName extends string = string,
> = NameTriplet<TName, TVersion, TVariantName> & {
  namespace: string;
};

type VersionedResourceIdLike = {
  name: string;
  version: string;
  variantName?: string;
  namespace?: string;
};

type MatchableIdentifier = {
  namespace?: string;
  name?: string;
  version?: string;
  variantName?: string;
};

function normalizeIdentifier(value?: MatchableIdentifier): VersionedResourceIdLike {
  return {
    name: value?.name ?? '*',
    version: value?.version ?? '1.0.0',
    variantName: value?.variantName ?? 'default',
    namespace: value?.namespace ?? 'default',
  };
}

function equalOrEquivalent(a?: string, b?: string): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a === '*' || b === '*') return true;
  return a === b;
}

function matchesVersionedResourceId(a?: VersionedResourceIdLike, b?: VersionedResourceIdLike): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return equalOrEquivalent(a.name, b.name)
    && (equalOrEquivalent(a.version, b.version) || satisfies(a.version, b.version))
    && equalOrEquivalent(a.variantName, b.variantName)
    && equalOrEquivalent(a.namespace, b.namespace);
}

export function matchesId(a?: MatchableIdentifier, b?: MatchableIdentifier): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;

  const left = normalizeIdentifier(a);
  const right = normalizeIdentifier(b);

  return matchesVersionedResourceId(left, right);
}

export type ViewIdentifier = {
  namespace: string;
  name: string;
  variantName?: string;
  version?: string;
}

export type ViewDataIdentifier = ViewIdentifier & {
  viewRootEntityId: string,
  viewRootEntityHistoricTimestamp?: string
  recordId?: string; // Optional recordId for intra array lookup, if applicable
}

export type ViewDataQueryByIdIdentifier = ViewDataIdentifier & {
  // place holder for any additional properties specific to ID-based queries if needed in the future
}

export type ViewDataQueryByKeyIdentifier = ViewDataIdentifier & {
  viewRootBusKey: string,
}

export type ViewDataQueryIdentifier = ViewDataQueryByIdIdentifier | ViewDataQueryByKeyIdentifier;

export type ViewDataContent<D = any> = ViewDataQueryByIdIdentifier & {
  viewRootId: string,
  viewRootEntityType: string,
  viewRootEntityBusKey: string,
  content: D
}

// if handcrafted new data to be saved as a view, key and timestamps will not be present
export type ViewDataNewContent<D = any> = Omit<ViewDataContent<D>, 'viewRootEntityId' |
  'viewRootId' | 'viewRootEntityBusKey' | 'viewRootEntityHistoricTimestamp' | 'recordId'>

export function isViewDataContent_Matching_ViewDataIdentifier(content?: ViewDataContent, identifier?: ViewDataQueryIdentifier): boolean {
  if (!content && !identifier) return true;
  if (!content || !identifier) return false;
  return matchesId(content, identifier)
    && content.viewRootEntityId === identifier.viewRootEntityId
    && content.viewRootEntityHistoricTimestamp === identifier.viewRootEntityHistoricTimestamp
    && content.recordId === identifier.recordId;
}

export function viewDataIdentifier_Match(a?: ViewDataIdentifier, b?: ViewDataIdentifier): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return matchesId(a, b)
    && a.viewRootEntityId === b.viewRootEntityId
    && a.viewRootEntityHistoricTimestamp === b.viewRootEntityHistoricTimestamp
    && a.recordId === b.recordId;
}