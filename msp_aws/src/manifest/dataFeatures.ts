import type { ManifestServiceBuilder } from 'msp_svr_common';

export function addAwsDataFeatures(service: ManifestServiceBuilder<any, any>)
{ 
  return service
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