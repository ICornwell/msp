import { createEntityObject, createRelations } from 'msp_common';

import { ecrRepositorySchema, eksClusterSchema } from './awsResourceSchemas.js';

export const eksClusterObject = createEntityObject('eksCluster', eksClusterSchema)
  .withFQId({name: 'eksCluster', version: '1.0'})
  .forDomain({ name: 'aws', version: '1.0' })
  .withUniqueBusinessKey((data) => `${data.region}::${data.clusterName}`)

  .buildObject();

export const ecrRepositoryObject = createEntityObject('ecrRepository', ecrRepositorySchema)
  .withFQId({name: 'ecrRepository', version: '1.0'})
  .forDomain({ name: 'aws', version: '1.0' })
  .withUniqueBusinessKey((data) => `${data.region}::${data.repositoryName}`)

  .buildObject();

export const relatedAwsResourceObjects = createRelations()
  .allowRelationFromTo('deploysImageFrom', eksClusterObject, ecrRepositoryObject, true)
  .buildRelatedObjects();
