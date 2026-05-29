import { createEntityObject, createRelations } from 'msp_common';

import { ecrRepositorySchema, eksClusterSchema } from './awsResourceSchemas.js';

export const eksClusterObject = createEntityObject('eksCluster', eksClusterSchema)
  .withId('eksCluster', '1.0')
  .forDomain({ name: 'aws', version: '1.0' })
  .buildObject();

export const ecrRepositoryObject = createEntityObject('ecrRepository', ecrRepositorySchema)
  .withId('ecrRepository', '1.0')
  .forDomain({ name: 'aws', version: '1.0' })
  .buildObject();

export const relatedAwsResourceObjects = createRelations()
  .allowRelationToFrom('deploysImageFrom', eksClusterObject, ecrRepositoryObject, true)
  .buildRelatedObjects();
