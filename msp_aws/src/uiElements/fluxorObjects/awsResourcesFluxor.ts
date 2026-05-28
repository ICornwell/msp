import type { FluxorData, PrefixedDataOfSchema } from 'msp_common';

import {
  ecrRepositorySchema,
  eksClusterSchema,
} from '../../data/awsResources/awsResourceSchemas.js';

export type AwsResourceRow =
  | (PrefixedDataOfSchema<undefined, 'eks', typeof eksClusterSchema> & {
      aws_type?: string;
      aws_name?: string;
      aws_region?: string;
      aws_status?: string;
    })
  | (PrefixedDataOfSchema<undefined, 'ecr', typeof ecrRepositorySchema> & {
      aws_type?: string;
      aws_name?: string;
      aws_region?: string;
      aws_status?: string;
    });

export const awsResourcesFluxorData: FluxorData<Partial<AwsResourceRow>> = {
  aws_type: {
    dictionaryName: 'aws-resource-type',
    attributeName: 'type',
    label: 'Type',
  },
  aws_name: {
    dictionaryName: 'aws-resource-name',
    attributeName: 'name',
    label: 'Name',
  },
  aws_region: {
    dictionaryName: 'aws-resource-region',
    attributeName: 'region',
    label: 'Region',
  },
  aws_status: {
    dictionaryName: 'aws-resource-status',
    attributeName: 'status',
    label: 'Status',
  },
};
