import { createView } from 'msp_common';

import { relatedAwsResourceObjects } from '../awsResourceObjectsAndRelations.js';

const { eksCluster, ecrRepository } = relatedAwsResourceObjects;

export const awsResourceInventoryView = createView('aws-resource-inventory')
.withNamespace('aws')
  .withVersion('1.0')
  .withConfigSet('main')
  .withRootKey('clusterName')
  .withRootElement(eksCluster, false)
  .withNamedSubElement('ecrRepository', ecrRepository, true)
  .withRelation('deploysImageFrom')
  .end()
  .end()
  .endView()
  .build();
