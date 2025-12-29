// Re-export shared dependencies
export {
  sharedVersions,
  sharedDeps,
  type DependencyInfo,
  type Dependencies
} from './sharedDeps.js';

// Re-export manifest types
export type {
  Manifest,
  DomainManifest,
  ServiceManifest,
  UiFeatureManifest,
  ApiFeatureManifest,
  InformationManifest,
  WorkManifest
} from './manifests/manifest.js';

// Re-export service manager utilities
export {
  serviceManager
} from './service-manager/serviceManager.js';

export {
  isMatch,
  type Matcher
} from './service-manager/isMatch.js';

export {
  CreateResultBuilder,
  defaultResult,
  addServiceActivityToSet,
  ActivitySet,
  type ServiceActivityExec,
  type ServiceActivityList,
  type ServiceActivity,
  type ServiceActivityResult,
  type ServiceActivityResultBuilder
} from './service-manager/serviceActivitySet.js';

export type {
  ServicePayload,
  ServiceResult,
  ServiceActivityFunction,
  ServiceActivityRegistration
} from './service-manager/types/index.js';
