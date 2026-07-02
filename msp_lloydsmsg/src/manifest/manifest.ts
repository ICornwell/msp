import type { ManifestBuildResult, TypedManifest } from 'msp_svr_common';
import { makeManifest } from 'msp_svr_common';
import { withLloydsMsgActorWorkModel } from './modelDeclarations.js';
import { addLloydsMsgDataFeatures } from './dataFeatures.js';
import { addLloydsMsgActivityFeatures } from './activityFeatures.js';

function createLloydsMsgServiceBuilder(config?: any) {
  const service = withLloydsMsgActorWorkModel(
    makeManifest(config)
      .withNamespace('lloydsMsg')
      .withAllowedContexts(['*'])
      .withService('LloydsMsgResourceService')
  )
    .forProducts([{ domain: '*', name: '*', version: '*' }])
    .withAllowedContexts(['*'])
    .withUiFeature('LloydsMsgResourcesFeature')
      .withRemoteName('lloydsMsg_remoteEntry.js')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endUiFeature
    .withUiFeature('LloydsMsgSettingsFeature')
      .withRemoteName('lloydsMsg_remoteEntry.js')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endUiFeature
    addLloydsMsgActivityFeatures(service)

    addLloydsMsgDataFeatures(service);

    return service;
}

export function createLloydsMsgManifest(config?: any) {
  return createLloydsMsgServiceBuilder(config)
    .endService
    .build();
}

export function createTypedLloydsMsgManifest(config?: any): TypedManifest {
  return createLloydsMsgServiceBuilder(config)
    .endService
    .buildTyped();
}

export function createLloydsMsgManifestBundle(config?: any): ManifestBuildResult<TypedManifest> {
  return createLloydsMsgServiceBuilder(config)
    .endService
    .buildFull();
}

export type TypedLloydsMsgManifest = ReturnType<typeof createTypedLloydsMsgManifest>;



// for type testing
/* // Compile-time proof that typed projection exposes the named link variant.
export type LloydsMsgTypedLinkVariantProof =
  TypedLloydsMsgManifest['Services']['LloydsMsgResourceService_1_0_0_default']['TypeVariants']['Work']


export const LloydsMsgTypedLinkVariantProof2 =
  createTypedLloydsMsgManifest().Services.LloydsMsgResourceService_1_0_0_default.TypeVariants.Link.lloydsMsgOperatorCreatesInventoryCase_1_0_0_default


export const LloydsMsgTypedLinkVariantProof3 =
  createTypedLloydsMsgManifest().Services.LloydsMsgResourceService_1_0_0_default.ActivityFeatures
 */

