import { createEntityObject, createRelations } from 'msp_common';

import { ecrRepositorySchema, eksClusterSchema } from './awsResourceSchemas.js';

export const eksClusterObject = createEntityObject('eksCluster', eksClusterSchema)
  .withFQId({name: 'eksCluster', version: '1.0'})
  .withUniqueBusinessKey('clusterName')
  .forDomain({ name: 'aws', version: '1.0' })
  .buildObject();

export const ecrRepositoryObject = createEntityObject('ecrRepository', ecrRepositorySchema)
  .withFQId({name: 'ecrRepository', version: '1.0'})
  .withUniqueBusinessKey('repositoryName')
  .forDomain({ name: 'aws', version: '1.0' })
  .buildObject();

export const relatedAwsResourceObjects = createRelations()
  .allowRelationToFrom('deploysImageFrom', eksClusterObject, ecrRepositoryObject, true)
  .buildRelatedObjects();

  
