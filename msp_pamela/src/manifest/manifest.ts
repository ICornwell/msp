import type { ManifestBuildResult, TypedManifest } from 'msp_svr_common';
import { makeManifest } from 'msp_svr_common';
import { withPamelaActorWorkModel } from './modelDeclarations.js';
import { addPamelaDataFeatures } from './dataFeatures.js';
import { addPamelaActivityFeatures } from './activityFeatures.js';

function createPamelaServiceBuilder(config?: any) {
  const service = withPamelaActorWorkModel(
    makeManifest(config)
      .withNamespace('pamela')
      .withAllowedContexts(['*'])
      .withService('PamelaResourceService')
  )
    .forProducts([{ domain: '*', name: '*', version: '*' }])
    .withAllowedContexts(['*'])
 
    addPamelaActivityFeatures(service)

    addPamelaDataFeatures(service);

    return service;
}

export function createPamelaManifest(config?: any) {
  return createPamelaServiceBuilder(config)
    .endService
    .build();
}

export function createTypedPamelaManifest(config?: any): TypedManifest {
  return createPamelaServiceBuilder(config)
    .endService
    .buildTyped();
}

export function createPamelaManifestBundle(config?: any): ManifestBuildResult<TypedManifest> {
  return createPamelaServiceBuilder(config)
    .endService
    .buildFull();
}

export type TypedPamelaManifest = ReturnType<typeof createTypedPamelaManifest>;



// for type testing
/* // Compile-time proof that typed projection exposes the named link variant.
export type PamelaTypedLinkVariantProof =
  TypedPamelaManifest['Services']['PamelaResourceService_1_0_0_default']['TypeVariants']['Work']


export const PamelaTypedLinkVariantProof2 =
  createTypedPamelaManifest().Services.PamelaResourceService_1_0_0_default.TypeVariants.Link.pamelaOperatorCreatesInventoryCase_1_0_0_default


export const PamelaTypedLinkVariantProof3 =
  createTypedPamelaManifest().Services.PamelaResourceService_1_0_0_default.ActivityFeatures
 */

