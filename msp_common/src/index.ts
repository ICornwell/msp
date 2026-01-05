// Re-export shared dependencies
export {
  sharedVersions,
  sharedDeps,
  type DependencyInfo,
  type Dependencies
} from './sharedDeps.js';

export {Ports} from './ports.js';

export {SharedConfig, Config, ProductConfig} from './sharedconfig.js';

export type { UiFeatureManifestSection, ManifestCommon, Manifest } from './manifests/index.js';

export { ManifestBuilder, makeManifest } from './manifests/manifestBuilder.js';

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
  activitySet as ActivitySet,
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

export * from './configuredCommon.js'

// Re-export ALS and JWT utilities
export * from './als/index.js';
