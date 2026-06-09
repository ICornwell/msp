import { ActivitySet, buildActivitySet } from 'msp_svr_common';

import { listEcrRepositoriesHandler, listEksClustersHandler,
  readClusterSetupConfigHandler, writeClusterSetupConfigHandler, reconcileClusterSetupConfigHandler,
  getAwsWizardBootstrapHandler, connectAwsCredentialsHandler }
from '../services/index.js';


export function getServiceActivities(): ActivitySet {
  return buildActivitySet()
    .withNamespace('aws')
    .withVersion('1.0.0')
    .withMatchingVersionRange('*')
    .withContext('*')
    .use({
      activityName: 'listEksClusters',
      funcs: listEksClustersHandler,
    })
    .use({
      activityName: 'listEcrRepositories',
      funcs: listEcrRepositoriesHandler,
    })
    .use({
      activityName: 'readClusterSetupConfig',
      funcs: readClusterSetupConfigHandler,
    })
    .use({
      activityName: 'writeClusterSetupConfig',
      funcs: writeClusterSetupConfigHandler,
    })
    .use({
      activityName: 'reconcileClusterSetupConfig',
      funcs: reconcileClusterSetupConfigHandler,
    })
    .use({
      activityName: 'getAwsWizardBootstrap',
      funcs: getAwsWizardBootstrapHandler,
    })
    .use({
      activityName: 'connectAwsCredentials',
      funcs: connectAwsCredentialsHandler,
    })
    .build();
}
   

