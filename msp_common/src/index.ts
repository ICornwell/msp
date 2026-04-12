// Re-export shared dependencies
export {
  sharedVersions,
  sharedDeps,
  type DependencyInfo,
  type Dependencies
} from './sharedDeps.js';

// export {Ports} from './ports.js';

// export {SharedConfig} from './sharedconfig.js';
// export type {Config, ProductConfig} from './sharedconfig.js';

export { ClientCredentialsConfig } from './types/index.js';

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

export * from './comms/serviceRequest.js';

export {isViewDataContent_Matching_ViewDataIndentifier} from './types/index.js';

export type {UiRemoteRegistration} from './comms/ui/UiRemoteRegistration.js'

export * from './configuredCommon.js'


export * from './data/fluent/index.js';
export * from './data/models/fluxor/fluxorData.js'

// Re-export UI message types
export * from './messages/index.js';
