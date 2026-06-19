// Re-export shared dependencies
export {
  sharedVersions,
  sharedDeps,
  type DependencyInfo,
  type Dependencies
} from './sharedDeps.js';


export * from './comms/serviceRequest.js'
export * from './comms/dataRequest.js'

export * from './types/index.js';

export * from './comms/ui/UiRemoteRegistration.js'

export * from './data/fluent/index.js';
export * from './data/models/api/data.js';
export * from './data/models/fluxor/fluxorData.js'

// Re-export UI message types
export * from './messages/index.js';
export * from './sharedDeps.js'
