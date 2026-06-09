import { ActivitySet, buildActivitySet } from 'msp_svr_common';
import { awsIamRolesHandler, awsInventorySnapshotHandler, awsNetworkTopologyHandler,
   readAwsDesiredResourceConfigHandler, writeAwsDesiredResourceConfigHandler,
  awsEksClustersHandler, awsEcrRepositoriesHandler, awsValidateCredentialsHandler } from '../services/index.js';


export const AwsResourceDataActivities: ActivitySet =
  buildActivitySet()
    .withNamespace('aws')
    .withVersion('1.0.0')
    .withMatchingVersionRange('*')
    .withContext('*')
    .use({
      activityName: 'awsEksClusters',
      funcs: awsEksClustersHandler,
    })
    .use({
      activityName: 'awsEcrRepositories',
      funcs: awsEcrRepositoriesHandler,
    })
    .use({
      activityName: 'awsIamRoles',
      funcs: awsIamRolesHandler,
    })
    .use({
      activityName: 'awsNetworkTopology',
      funcs: awsNetworkTopologyHandler,
    })
    .use({
      activityName: 'awsInventorySnapshot',
      funcs: awsInventorySnapshotHandler,
    })
    .use({
      activityName: 'readAwsDesiredResourceConfig',
      funcs: readAwsDesiredResourceConfigHandler,
    })
    .use({
      activityName: 'writeAwsDesiredResourceConfig',
      funcs: writeAwsDesiredResourceConfigHandler,
    })
    .use({
      activityName: 'awsValidateCredentials',
      funcs: awsValidateCredentialsHandler,
    })
    .build();
