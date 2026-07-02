import { ActivitySet, buildActivitySet } from 'msp_svr_common';

import { }
from '../services/index.js';


export function getServiceActivities(): ActivitySet {
  return buildActivitySet()
    .withNamespace('moduleX')
    .withVersion('1.0.0')
    .withMatchingVersionRange('*')
    .withContext('*')
   /* .use({
      activityName: 'moduleXExampleServiceActivity',
      funcs: listEksClustersHandler,
    }) */
   
    .build();
}
   

