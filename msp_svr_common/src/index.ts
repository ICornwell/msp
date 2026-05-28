export type { UiFeatureManifestSection, DataFeatureManifestSection, InformationManifestSection,
  ApiFeatureManifestSection, ActivityFeatureManifestSection, ServiceManifestSection,
  ManifestCommon, Manifest, TypeVariantsManifestBlock, ActorCoreType, WorkCoreType,
  ActorTypeVariantManifestSection, WorkTypeVariantManifestSection,
  LinkPrototypeEndpointManifestSection, LinkTypeVariantManifestSection,
  ManifestBuilder, ManifestServiceBuilder, ManifestUiFeatureBuilder,
  ManifestApiFeatureBuilder, ManifestActivityFeatureBuilder } from './manifests/index.js';

export * from './manifests/index.js';
//export type { ManifestBuilder } from './manifests/manifestBuilder.js';

// Re-export service manager utilities
export {
  serviceManager
} from './service-manager/serviceManager.js';

export { startMspServer } from './app/server.js';
export { mspAuthMiddleware } from './als/authMiddleware.js';

export {
  isMatch,
  bestVersionMatch,
  highestVersionMatches,
  type Matcher
} from './service-manager/isMatch.js';

export {  type ServiceRequestEnvelope,
  type ServiceRequestOptions,
  type ServiceRequestResult, ServiceActivityResult} from 'msp_common'

export {
  CreateResultBuilder,
  defaultResult,
  addServiceActivityToSet,
  activitySet,
  type ServiceActivityExec,
  type ServiceActivityList,
  type ActivitySet,
  type ServiceActivity,
  type ServiceActivityResultBuilder
} from './service-manager/serviceActivitySet.js';

export type {
  ServicePayload,
  ServiceResult,
  ServiceActivityFunction,
  ServiceActivityRegistration,

} from './service-manager/types/index.js';

export {
  serviceRequest,
  runServiceActivity,
} from './comms/serviceRequest.js';



export {Ports} from './ports.js';

export {SharedConfig} from './sharedconfig.js';
export type {Config, ProductConfig} from './sharedconfig.js';


// Re-export ALS and JWT utilities
export * from './als/index.js';

export { setConfig, getConfig, manifest, httpRequest } from './configuredCommon.js';


