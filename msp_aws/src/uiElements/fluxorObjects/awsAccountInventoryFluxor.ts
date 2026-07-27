import type { FluxorData, PrefixedDataOfSchema } from 'msp_common';

import { awsAccountResourceSchema } from '../../data/awsResources/awsResourceSchemas.js';

export type AwsAccountInventoryRow = PrefixedDataOfSchema<undefined, 'inv', typeof awsAccountResourceSchema> & {
  aws_type?: string;
  aws_name?: string;
  aws_region?: string;
  aws_status?: string;
  aws_desired?: string;
  aws_tags?: string;
};

export const awsAccountInventoryFluxorData: FluxorData<Partial<AwsAccountInventoryRow>> = {
  aws_type: {
    dictionaryName: 'aws-account-resource-type',
    attributeName: 'type',
    label: 'Type',
  },
  aws_name: {
    dictionaryName: 'aws-account-resource-name',
    attributeName: 'name',
    label: 'Name',
  },
  aws_region: {
    dictionaryName: 'aws-account-resource-region',
    attributeName: 'region',
    label: 'Region',
  },
  aws_status: {
    dictionaryName: 'aws-account-resource-status',
    attributeName: 'status',
    label: 'Status',
  },
  aws_desired: {
    dictionaryName: 'aws-account-resource-desiredStatus',
    attributeName: 'desiredStatus',
    label: 'Desired State',
  },
  aws_tags: {
    dictionaryName: 'aws-account-resource-tagSummary',
    attributeName: 'tagSummary',
    label: 'Tags',
  },
};
