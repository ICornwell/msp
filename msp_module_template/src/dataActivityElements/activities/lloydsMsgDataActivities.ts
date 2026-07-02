import { ActivitySet, buildActivitySet } from 'msp_svr_common';


export const ModuleXResourceDataActivities: ActivitySet =
  buildActivitySet()
    .withNamespace('moduleX')
    .withVersion('1.0.0')
    .withMatchingVersionRange('*')
    .withContext('*')
   
    .build();
