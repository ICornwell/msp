import type { ManifestServiceBuilder } from 'msp_svr_common';
import { awsClusterSetupConfigView } from '../data/index.js';

export function addAwsActivityFeatures(service: ManifestServiceBuilder<any, any>)
{ 
  return service
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
      .useForViewRead(awsClusterSetupConfigView)
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
    .withActivityFeature('refreshAwsWizardViews', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endActivityFeature
}

