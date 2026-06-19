import { createView } from 'msp_common';

import {
  awsDesiredResourceConfigObject,
  relatedAwsSetupObjects,
} from '../awsSetupObjectsAndRelations.js';

const {
  awsClusterSetupConfig,
  awsClusterSetupDesiredState,
  awsClusterSetupEksDesiredState,
  awsClusterSetupEcrDesiredState,
  awsClusterSetupNetworkDesiredState,
  awsClusterSetupRepository,
} = relatedAwsSetupObjects;

export const awsClusterSetupConfigView = createView('aws-cluster-setup-config')
  .withNamespace('aws')
  .withVersion('1.0')
  .withConfigSet('main')
  .withRootKey('id')
  .withRootElement(awsClusterSetupConfig, false)
  .withNamedSubElement('desiredState', awsClusterSetupDesiredState, false)
    .withRelation('hasDesiredState')
    .withNamedSubElement('eks', awsClusterSetupEksDesiredState, false)
      .withRelation('hasEksDesiredState')
      .end()
    .withNamedSubElement('ecr', awsClusterSetupEcrDesiredState, false)
      .withRelation('hasEcrDesiredState')
      .withNamedSubElement('repositories', awsClusterSetupRepository, true)
        .withRelation('hasRepository')
        .end()
      .end()
    .withNamedSubElement('network', awsClusterSetupNetworkDesiredState, false)
      .withRelation('hasNetworkDesiredState')
      .end()
    .end()
  .end()
  .endView()
  .build();

export const awsDesiredResourceConfigView = createView('aws-desired-resource-config')
  .withNamespace('aws')
  .withVersion('1.0')
  .withConfigSet('main')
  .withRootKey('id')
  .withRootElement(awsDesiredResourceConfigObject, false)
  .end()
  .endView()
  .build();
