import { createDomainObject, createRelations } from 'msp_common';

import { ecrRepositorySchema, eksClusterSchema } from './awsResourceSchemas.js';

export const eksClusterObject = createDomainObject('eksCluster', eksClusterSchema)
  .withId('eksCluster', '1.0')
  .forDomain({ id: 'aws', version: '1.0' })
  .withIsEntity(true)
  .buildDomainObject();

export const ecrRepositoryObject = createDomainObject('ecrRepository', ecrRepositorySchema)
  .withId('ecrRepository', '1.0')
  .forDomain({ id: 'aws', version: '1.0' })
  .withIsEntity(true)
  .buildDomainObject();

export const relatedAwsResourceObjects = createRelations()
  .allowRelationTo('deploysImageFrom', eksClusterObject, ecrRepositoryObject, true)
  .buildRelatedObjects();
