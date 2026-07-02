import type { ManifestBuildResult, TypedManifest } from 'msp_svr_common';
import { makeManifest } from 'msp_svr_common';
import { withModuleXActorWorkModel } from './modelDeclarations.js';
import { addModuleXDataFeatures } from './dataFeatures.js';
import { addModuleXActivityFeatures } from './activityFeatures.js';

function createModuleXServiceBuilder(config?: any) {
  const service = withModuleXActorWorkModel(
    makeManifest(config)
      .withNamespace('moduleX')
      .withAllowedContexts(['*'])
      .withService('ModuleXResourceService')
  )
    .forProducts([{ domain: '*', name: '*', version: '*' }])
    .withAllowedContexts(['*'])
    .withUiFeature('ModuleXResourcesFeature')
      .withRemoteName('moduleX_remoteEntry.js')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endUiFeature
    .withUiFeature('ModuleXSettingsFeature')
      .withRemoteName('moduleX_remoteEntry.js')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endUiFeature
    addModuleXActivityFeatures(service)

    addModuleXDataFeatures(service);

    return service;
}

export function createModuleXManifest(config?: any) {
  return createModuleXServiceBuilder(config)
    .endService
    .build();
}

export function createTypedModuleXManifest(config?: any): TypedManifest {
  return createModuleXServiceBuilder(config)
    .endService
    .buildTyped();
}

export function createModuleXManifestBundle(config?: any): ManifestBuildResult<TypedManifest> {
  return createModuleXServiceBuilder(config)
    .endService
    .buildFull();
}

export type TypedModuleXManifest = ReturnType<typeof createTypedModuleXManifest>;



// for type testing
/* // Compile-time proof that typed projection exposes the named link variant.
export type ModuleXTypedLinkVariantProof =
  TypedModuleXManifest['Services']['ModuleXResourceService_1_0_0_default']['TypeVariants']['Work']


export const ModuleXTypedLinkVariantProof2 =
  createTypedModuleXManifest().Services.ModuleXResourceService_1_0_0_default.TypeVariants.Link.moduleXOperatorCreatesInventoryCase_1_0_0_default


export const ModuleXTypedLinkVariantProof3 =
  createTypedModuleXManifest().Services.ModuleXResourceService_1_0_0_default.ActivityFeatures
 */

