import { createView } from 'msp_common';

import { awsClusterSetupConfigObject, awsDesiredResourceConfigObject } from '../awsSetupObjectsAndRelations.js';

export const awsClusterSetupConfigView = createView('aws-cluster-setup-config')
  .withNamespace('aws')
  .withVersion('1.0')
  .withConfigSet('main')
  .withRootKey('id')
  .withRootElement(awsClusterSetupConfigObject, false)
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
