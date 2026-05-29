import { makeManifest } from 'msp_svr_common';
import { withAwsActorWorkModel } from './modelDeclarations.js';

function createAwsServiceBuilder(config?: any) {
  return withAwsActorWorkModel(
    makeManifest(config)
      .withAllowedContexts(['*'])
      .addService('AwsResourceService')
  )
    .forProducts([{ domain: '*', name: '*', version: '*' }])
    .withAllowedContexts(['*'])
    .addUiFeature('AwsResourcesFeature')
      .withRemoteName('aws_remoteEntry.js')
      .withAllowedContexts(['*'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endUiFeature
    .addActivityFeature('listEksClusters', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endActivityFeature
    .addActivityFeature('listEcrRepositories', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endActivityFeature;
}

export function createAwsManifest(config?: any) {
  return createAwsServiceBuilder(config)
    .endService
    .build();
}

export function createTypedAwsManifest(config?: any) {
  return createAwsServiceBuilder(config)
    .endService
    .buildTyped();
}

export function createAwsManifestBundle(config?: any) {
  return createAwsServiceBuilder(config)
    .endService
    .buildFull();
}

export type TypedAwsManifest = ReturnType<typeof createTypedAwsManifest>;

// Compile-time proof that typed projection exposes the named link variant.
export type AwsTypedLinkVariantProof =
  TypedAwsManifest['Services']['AwsResourceService_1_0_0_default']['TypeVariants']['Work']


export const AwsTypedLinkVariantProof2 =
  createTypedAwsManifest().Services.AwsResourceService_1_0_0_default.TypeVariants.Link.awsOperatorCreatesInventoryCase_1_0_0_default


export const AwsTypedLinkVariantProof3 =
  createTypedAwsManifest().Services.AwsResourceService_1_0_0_default.ActivityFeatures


