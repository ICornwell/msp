import { createView } from 'msp_common';

import { relatedAwsResourceObjects } from '../awsResourceObjectsAndRelations.js';

const { eksCluster, ecrRepository } = relatedAwsResourceObjects;

export const awsResourceInventoryView = createView('aws-resource-inventory')
  .withVersion('1.0')
  .withConfigSet('main')
  .withRootKey('id')
  .withRootElement(eksCluster, false)
  .withNamedSubElement('ecrRepository', ecrRepository, true)
  .withRelation('deploysImageFrom')
  .end()
  .end()
  .endView()
  .build();
