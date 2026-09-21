import { ActivitySet, buildActivitySet } from 'msp_svr_common';

export function getServiceActivities(): ActivitySet {
  return buildActivitySet()
    .withNamespace('module_template')
    .withVersion('1.0.0')
    .withMatchingVersionRange('*')
    .withContext('*')
 /*    .use({
      activityName: 'somename',
      funcs: someActivityHandler,
    }) */
  
    .build();
}
   

