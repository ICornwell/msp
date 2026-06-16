import type { ManifestBuildResult, TypedManifest } from 'msp_svr_common';
import { makeManifest } from 'msp_svr_common';
import { withAwsActorWorkModel } from './modelDeclarations.js';
import { addAwsDataFeatures } from './dataFeatures.js';
import { addAwsActivityFeatures } from './activityFeatures.js';

function createAwsServiceBuilder(config?: any) {
  const service = withAwsActorWorkModel(
    makeManifest(config)
      .withNamespace('aws')
      .withAllowedContexts(['*'])
      .withService('AwsResourceService')
  )
    .forProducts([{ domain: '*', name: '*', version: '*' }])
    .withAllowedContexts(['*'])
    .withUiFeature('AwsResourcesFeature')
      .withRemoteName('aws_remoteEntry.js')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endUiFeature
    .withUiFeature('AwsSettingsFeature')
      .withRemoteName('aws_remoteEntry.js')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endUiFeature
    addAwsActivityFeatures(service)

    addAwsDataFeatures(service);

    return service;
}

export function createAwsManifest(config?: any) {
  return createAwsServiceBuilder(config)
    .endService
    .build();
}

export function createTypedAwsManifest(config?: any): TypedManifest {
  return createAwsServiceBuilder(config)
    .endService
    .buildTyped();
}

export function createAwsManifestBundle(config?: any): ManifestBuildResult<TypedManifest> {
  return createAwsServiceBuilder(config)
    .endService
    .buildFull();
}

export type TypedAwsManifest = ReturnType<typeof createTypedAwsManifest>;



// for type testing
/* // Compile-time proof that typed projection exposes the named link variant.
export type AwsTypedLinkVariantProof =
  TypedAwsManifest['Services']['AwsResourceService_1_0_0_default']['TypeVariants']['Work']


export const AwsTypedLinkVariantProof2 =
  createTypedAwsManifest().Services.AwsResourceService_1_0_0_default.TypeVariants.Link.awsOperatorCreatesInventoryCase_1_0_0_default


export const AwsTypedLinkVariantProof3 =
  createTypedAwsManifest().Services.AwsResourceService_1_0_0_default.ActivityFeatures
 */

