import type { ServiceActivity } from 'msp_svr_common';

import { ReadClusterSetupConfigActivity, ReconcileClusterSetupConfigActivity, WriteClusterSetupConfigActivity } from './clusterSetupConfig.js';
import { ListEcrRepositoriesActivity } from './listEcrRepositories.js';
import { ListEksClustersActivity } from './listEksClusters.js';

export function getServiceActivities(): ServiceActivity[] {
  return [
    ListEksClustersActivity,
    ListEcrRepositoriesActivity,
    ReadClusterSetupConfigActivity,
    WriteClusterSetupConfigActivity,
    ReconcileClusterSetupConfigActivity,
  ];
}
