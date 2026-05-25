// Re-export shared dependencies
export {
  sharedVersions,
  sharedDeps,
  type DependencyInfo,
  type Dependencies
} from './sharedDeps.js';


export * from './manifests/manifests.js'
export * from './comms/serviceRequest.js'

export { ClientCredentialsConfig, JWTValidationConfig } from './types/index.js';

export type {
  ServicePayload,
  ServiceResult,
  ServiceActivityFunction,
  ServiceActivityRegistration,
  ViewIdentifier,
  ViewDataIdentifier,
  ViewDataQueryIdentifier,
  ViewDataContent,
} from './types/index.js';

export {isViewDataContent_Matching_ViewDataIdentifier, viewDataIdentifier_Match} from './types/index.js';

export type { UiRemoteRegistration, ScopeItem } from './comms/ui/UiRemoteRegistration.js'

export * from './data/fluent/index.js';
export * from './data/models/fluxor/fluxorData.js'

// Re-export UI message types
export * from './messages/index.js';
