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
  .withFQId({name: 'awsClusterSetupConfig', version: '1.0'})
  .forDomain({ name: 'aws', version: '1.0' })
  .withUniqueBusinessKey((data) => `${data.setupId}::${data.region}::${data.clusterName}`)
  .buildObject();

export const awsClusterSetupDesiredStateObject = createValueObject('awsClusterSetupDesiredState', awsClusterSetupDesiredStateSchema)
  .withFQId({name: 'awsClusterSetupDesiredState', version: '1.0'})
  .forDomain({ name: 'aws', version: '1.0' })
  .buildObject();

export const awsClusterSetupEksDesiredStateObject = createValueObject('awsClusterSetupEksDesiredState', awsClusterSetupEksDesiredStateSchema)
  .withFQId({name: 'awsClusterSetupEksDesiredState', version: '1.0'})
  .forDomain({ name: 'aws', version: '1.0' })
  .buildObject();

export const awsClusterSetupEcrDesiredStateObject = createValueObject('awsClusterSetupEcrDesiredState', awsClusterSetupEcrDesiredStateSchema)
  .withFQId({name: 'awsClusterSetupEcrDesiredState', version: '1.0'})
  .forDomain({ name: 'aws', version: '1.0' })
  .buildObject();

export const awsClusterSetupNetworkDesiredStateObject = createValueObject('awsClusterSetupNetworkDesiredState', awsClusterSetupNetworkDesiredStateSchema)
  .withFQId({name: 'awsClusterSetupNetworkDesiredState', version: '1.0'})
  .forDomain({ name: 'aws', version: '1.0' })
  .buildObject();

export const awsClusterSetupRepositoryObject = createValueObject('awsClusterSetupRepository', awsClusterSetupRepositorySchema)
  .withFQId({name: 'awsClusterSetupRepository', version: '1.0'})
  .forDomain({ name: 'aws', version: '1.0' })
  .buildObject();

export const awsDesiredResourceConfigObject = createEntityObject('awsDesiredResourceConfig', awsDesiredResourceConfigSchema)
  .withFQId({name: 'awsDesiredResourceConfig', version: '1.0'})
  .forDomain({ name: 'aws', version: '1.0' })
  .withUniqueBusinessKey((data) => `${data.setupCaseId}::${data.setupRunId}::${data.region}`)
  .buildObject();

export const relatedAwsSetupObjects = createRelations()
  .allowRelationFromTo('hasDesiredState', awsClusterSetupConfigObject, awsClusterSetupDesiredStateObject, true)
  .allowRelationFromTo('hasEksDesiredState', awsClusterSetupDesiredStateObject, awsClusterSetupEksDesiredStateObject, true)
  .allowRelationFromTo('hasEcrDesiredState', awsClusterSetupDesiredStateObject, awsClusterSetupEcrDesiredStateObject, true)
  .allowRelationFromTo('hasNetworkDesiredState', awsClusterSetupDesiredStateObject, awsClusterSetupNetworkDesiredStateObject, true)
  .allowRelationFromTo('hasRepository', awsClusterSetupEcrDesiredStateObject, awsClusterSetupRepositoryObject, true)
  .buildRelatedObjects();
