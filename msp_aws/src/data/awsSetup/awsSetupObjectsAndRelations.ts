import { createEntityObject, createRelations, createValueObject } from 'msp_common';

import {
  awsClusterSetupConfigSchema,
  awsClusterSetupDesiredStateSchema,
  awsClusterSetupEcrDesiredStateSchema,
  awsClusterSetupEksDesiredStateSchema,
  awsClusterSetupNetworkDesiredStateSchema,
  awsClusterSetupRepositorySchema,
  awsDesiredResourceConfigSchema,
} from './awsSetupSchemas.js';

export const awsClusterSetupConfigObject = createEntityObject('awsClusterSetupConfig', awsClusterSetupConfigSchema)
  .withFQId({ namespace: 'aws', version: '1.0'})
  .forDomain({ name: 'aws', version: '1.0' })
  .withUniqueBusinessKey((data) => `${data.setupId}`)
  .buildObject();

export const awsClusterSetupDesiredStateObject = createValueObject('awsClusterSetupDesiredState', awsClusterSetupDesiredStateSchema)
  .withFQId({ namespace: 'aws', version: '1.0'})
  .forDomain({ name: 'aws', version: '1.0' })
  .buildObject();

export const awsClusterSetupEksDesiredStateObject = createValueObject('awsClusterSetupEksDesiredState', awsClusterSetupEksDesiredStateSchema)
  .withFQId({ namespace: 'aws', version: '1.0'})
  .forDomain({ name: 'aws', version: '1.0' })
  .buildObject();

export const awsClusterSetupEcrDesiredStateObject = createValueObject('awsClusterSetupEcrDesiredState', awsClusterSetupEcrDesiredStateSchema)
  .withFQId({ namespace: 'aws', version: '1.0'})
  .forDomain({ name: 'aws', version: '1.0' })
  .buildObject();

export const awsClusterSetupNetworkDesiredStateObject = createValueObject('awsClusterSetupNetworkDesiredState', awsClusterSetupNetworkDesiredStateSchema)
  .withFQId({ namespace: 'aws', version: '1.0'})
  .forDomain({ name: 'aws', version: '1.0' })
  .buildObject();

export const awsClusterSetupRepositoryObject = createValueObject('awsClusterSetupRepository', awsClusterSetupRepositorySchema)
  .withFQId({ namespace: 'aws', version: '1.0'})
  .forDomain({ name: 'aws', version: '1.0' })
  .buildObject();

export const awsDesiredResourceConfigObject = createEntityObject('awsDesiredResourceConfig', awsDesiredResourceConfigSchema)
  .withFQId({ namespace: 'aws', version: '1.0'})
  .forDomain({ name: 'aws', version: '1.0' })
  .withUniqueBusinessKey((data) => `${data.setupCaseId}`)
  .buildObject();

export const relatedAwsSetupObjects = createRelations()
  .allowRelationFromTo('hasDesiredState', awsClusterSetupConfigObject, awsClusterSetupDesiredStateObject, true)
  .allowRelationFromTo('hasEksDesiredState', awsClusterSetupDesiredStateObject, awsClusterSetupEksDesiredStateObject, true)
  .allowRelationFromTo('hasEcrDesiredState', awsClusterSetupDesiredStateObject, awsClusterSetupEcrDesiredStateObject, true)
  .allowRelationFromTo('hasNetworkDesiredState', awsClusterSetupDesiredStateObject, awsClusterSetupNetworkDesiredStateObject, true)
  .allowRelationFromTo('hasRepository', awsClusterSetupEcrDesiredStateObject, awsClusterSetupRepositoryObject, true)
  .buildRelatedObjects();
