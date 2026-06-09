import type { ActivitySet } from 'msp_svr_common';

import { AwsResourceDataActivities } from '../activities/awsResourceDataActivities.js';

export function getDataServiceActivities(): ActivitySet {
  return AwsResourceDataActivities;
}
