
export function getServiceActivities() {
  return [ExecuteProxyFlowActivity, IssueAccessCapabilityActivity];
}

export * from './proxyExecutionContract.js';
export * from './executeProxyFlow.js';
export * from './issueAccessCapability.js';

import { ExecuteProxyFlowActivity } from './executeProxyFlow.js';
import { IssueAccessCapabilityActivity } from './issueAccessCapability.js';