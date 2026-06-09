import type { ManifestBuildResult, TypedManifest } from 'msp_svr_common';
import { makeManifest } from 'msp_svr_common';
import { withAwsActorWorkModel } from './modelDeclarations.js';

function createAwsServiceBuilder(config?: any) {
  return withAwsActorWorkModel(
    makeManifest(config)
      .withNamespace('aws')
      .withAllowedContexts(['*'])
      .withService('AwsResourceService')
  )
    .forProducts([{ domain: '*', name: '*', version: '*' }])
    .withAllowedContexts(['*'])
    .withUiFeature('AwsResourcesFeature')
      .withRemoteName('aws_remoteEntry.js')
      .withAllowedContexts(['*'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endUiFeature
    .withActivityFeature('listEksClusters', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endActivityFeature
    .withActivityFeature('listEcrRepositories', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endActivityFeature
    .withActivityFeature('readClusterSetupConfig', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endActivityFeature
    .withActivityFeature('writeClusterSetupConfig', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endActivityFeature
    .withActivityFeature('reconcileClusterSetupConfig', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endActivityFeature
    .withActivityFeature('getAwsWizardBootstrap', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endActivityFeature
    .withActivityFeature('connectAwsCredentials', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endActivityFeature
    .withDataFeature('awsEksClusters', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endDataFeature
    .withDataFeature('awsEcrRepositories', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endDataFeature
    .withDataFeature('awsIamRoles', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endDataFeature
    .withDataFeature('awsNetworkTopology', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endDataFeature
    .withDataFeature('awsInventorySnapshot', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endDataFeature
    .withDataFeature('readAwsDesiredResourceConfig', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endDataFeature
    .withDataFeature('writeAwsDesiredResourceConfig', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endDataFeature
    .withDataFeature('awsValidateCredentials', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endDataFeature;
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

