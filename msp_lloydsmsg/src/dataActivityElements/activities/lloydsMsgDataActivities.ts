import { ActivitySet, buildActivitySet } from 'msp_svr_common';


export const LloydsMsgResourceDataActivities: ActivitySet =
  buildActivitySet()
    .withNamespace('lloydsMsg')
    .withVersion('1.0.0')
    .withMatchingVersionRange('*')
    .withContext('*')
   
    .build();
