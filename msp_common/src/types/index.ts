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
}

export type ViewDataQueryByIdIdentifier = ViewIdentifier & {
  viewRootEntityId: string,
  viewRootEntityHistoricTimestamp?: string
}

export type ViewDataQueryByKeyIdentifier = ViewIdentifier & {
  viewRootEntityId: string,
  viewRootEntityHistoricTimestamp?: string
}

export type ViewDataQueryIdentifier = ViewDataQueryByIdIdentifier | ViewDataQueryByKeyIdentifier;

export type ViewDataContent<D = any> = ViewDataQueryByIdIdentifier & {
  viewRootId: string,
  viewRootEntityType: string,
  viewRootEntityBusKey: string,
  content: D
}

export function isViewDataContent_Matching_ViewDataIndentifier(content?: ViewDataContent, identifier?: ViewDataQueryIdentifier): boolean {
  if (!content && !identifier) return true;
  if (!content || !identifier) return false;
  return content.viewDomain === identifier.viewDomain
    && content.viewName === identifier.viewName
    && content.viewVersion === identifier.viewVersion
    && content.viewRootEntityId === identifier.viewRootEntityId
    && content.viewRootEntityHistoricTimestamp === identifier.viewRootEntityHistoricTimestamp;
}