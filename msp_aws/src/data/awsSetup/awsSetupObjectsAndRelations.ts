import { createEntityObject } from 'msp_common';

import { awsClusterSetupConfigSchema, awsDesiredResourceConfigSchema } from './awsSetupSchemas.js';

export const awsClusterSetupConfigObject = createEntityObject('awsClusterSetupConfig', awsClusterSetupConfigSchema)
  .withId('awsClusterSetupConfig', '1.0')
  .forDomain({ name: 'aws', version: '1.0' })
  .buildObject();

export const awsDesiredResourceConfigObject = createEntityObject('awsDesiredResourceConfig', awsDesiredResourceConfigSchema)
  .withId('awsDesiredResourceConfig', '1.0')
  .forDomain({ name: 'aws', version: '1.0' })
  .buildObject();
