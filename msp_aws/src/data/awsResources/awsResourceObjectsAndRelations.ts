import { createEntityObject, createRelations } from 'msp_common';

import { awsAccountResourceSchema, ecrRepositorySchema, eksClusterSchema } from './awsResourceSchemas.js';

export const eksClusterObject = createEntityObject('eksCluster', eksClusterSchema)
  .withFQId({ namespace: 'aws', version: '1.0'})
  .forDomain({ name: 'aws', version: '1.0' })
  .withUniqueBusinessKey((data) => `${data.region}::${data.clusterName}`)

  .buildObject();

export const ecrRepositoryObject = createEntityObject('ecrRepository', ecrRepositorySchema)
  .withFQId({ namespace: 'aws', version: '1.0'})
  .forDomain({ name: 'aws', version: '1.0' })
  .withUniqueBusinessKey((data) => `${data.region}::${data.repositoryName}`)

  .buildObject();

export const awsAccountResourceObject = createEntityObject('awsAccountResource', awsAccountResourceSchema)
  .withFQId({ namespace: 'aws', version: '1.0'})
  .forDomain({ name: 'aws', version: '1.0' })
  .withUniqueBusinessKey((data) => `${data.region}::${data.service}::${data.resourceType}::${data.name}`)

  .buildObject();

export const relatedAwsResourceObjects = createRelations()
  .allowRelationFromTo('deploysImageFrom', eksClusterObject, ecrRepositoryObject, true)
  .buildRelatedObjects();
