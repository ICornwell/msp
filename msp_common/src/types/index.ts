export interface ClientCredentialsConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  scope: string; // e.g., "api://target-service/.default"
  authority?: string; // defaults to Azure AD
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

export type ViewIdentifier = {
  viewDomain: string;
  viewName: string;
  viewVariantName?: string;
  viewVersion?: string;
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

export function isViewDataContent_Matching_ViewDataIdentifier(content?: ViewDataContent, identifier?: ViewDataQueryIdentifier): boolean {
  if (!content && !identifier) return true;
  if (!content || !identifier) return false;
  return content.viewDomain === identifier.viewDomain
    && content.viewName === identifier.viewName
    && content.viewVersion === identifier.viewVersion
    && content.viewRootEntityId === identifier.viewRootEntityId
    && content.viewRootEntityHistoricTimestamp === identifier.viewRootEntityHistoricTimestamp
    && content.recordId === identifier.recordId;
}

export function viewDataIdentifier_Match(a?: ViewDataIdentifier, b?: ViewDataIdentifier): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.viewDomain === b.viewDomain
    && a.viewName === b.viewName
    && a.viewVersion === b.viewVersion
    && a.viewRootEntityId === b.viewRootEntityId
    && a.viewRootEntityHistoricTimestamp === b.viewRootEntityHistoricTimestamp
    && a.recordId === b.recordId;
}