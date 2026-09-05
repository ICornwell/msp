import { ActivitySet, buildActivitySet } from 'msp_svr_common';




export function getServiceActivities(): ActivitySet {
  return buildActivitySet()
    .withNamespace('pamela')
    .withVersion('1.0.0')
    .withMatchingVersionRange('*')
    .withContext('*')
 /*    .use({
      activityName: 'listEksClusters',
      funcs: listEksClustersHandler,
    }) */
  
    .build();
}
   

