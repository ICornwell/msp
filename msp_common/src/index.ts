// Re-export shared dependencies
export {
  sharedVersions,
  sharedDeps,
  type DependencyInfo,
  type Dependencies
} from './sharedDeps.js';

export {Ports} from './ports.js';

export {SharedConfig} from './sharedconfig.js';
export type {Config, ProductConfig} from './sharedconfig.js';

export type { UiFeatureManifestSection, InformationManifestSection,
  ApiFeatureManifestSection, ActivityFeatureManifestSection, ServiceManifestSection,
  ManifestCommon, Manifest } from './manifests/index.js';

export { makeManifest } from './manifests/manifestBuilder.js';
export type { ManifestBuilder } from './manifests/manifestBuilder.js';

// Re-export service manager utilities
export {
  serviceManager
} from './service-manager/serviceManager.js';

export {
  isMatch,
  bestVersionMatch,
  highestVersionMatches,
  type Matcher
} from './service-manager/isMatch.js';

export {
  CreateResultBuilder,
  defaultResult,
  addServiceActivityToSet,
  activitySet,
  type ServiceActivityExec,
  type ServiceActivityList,
  type ActivitySet,
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

export {
  serviceRequest,
  runServiceActivity,
  type ServiceRequestEnvelope,
  type ServiceRequestOptions,
  type ServiceRequestResult,
} from './comms/serviceRequest.js';

export type {UiRemoteRegistration} from './comms/ui/UiRemoteRegistration.js'

export * from './configuredCommon.js'

// Re-export ALS and JWT utilities
export * from './als/index.js';

export * from './data/fluent/index.js';

// Re-export UI message types
export * from './messages/index.js';
