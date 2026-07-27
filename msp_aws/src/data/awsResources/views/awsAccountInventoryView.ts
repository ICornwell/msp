import { createView } from 'msp_common';

import { awsAccountResourceObject } from '../awsResourceObjectsAndRelations.js';

export const awsAccountInventoryView = createView('aws-account-inventory')
  .withNamespace('aws')
  .withVersion('1.0')
  .withConfigSet('main')
  .useBusinessKey()
  .withRootElement(awsAccountResourceObject, false)
  .end()
  .endView()
  .build();
