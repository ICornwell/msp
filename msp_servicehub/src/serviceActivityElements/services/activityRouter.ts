import { serviceManager } from 'msp_svr_common';
import { createServiceManager } from './serviceActivityRegistry.js';
import { discoveryActivitySet } from '../activities/discovery.js';

// Create service manager for local activities
const localServices = serviceManager();
localServices.use(discoveryActivitySet);



// Main routing function - checks local first, then uses registry's ActivitySet
export async function routeServiceActivity(
  namespace: string,
  activityName: string,
  version: string,
  payload: any,
  _context?: string
) {
  // Try local activities first
  const localResults = await localServices.runAllMatches(namespace, activityName, version, payload);
  
  if (localResults.success) {
    return localResults;
  }

  // Try remote services using the registry's ActivitySet (with fancy version matching)
  const latestRegisteredActivities = createServiceManager()

  const registeredActivityResults = await latestRegisteredActivities.runAllMatches(namespace, activityName, version, payload);
  
  if (registeredActivityResults.success) {
    return registeredActivityResults;
  }

  // Not found anywhere
  return {
    namespace,
    activityName,
    version,
    success: false,
    message: `No service found for activity: ${namespace}/${activityName}@${version}`,
    error: { code: 'ACTIVITY_NOT_FOUND' },
    logs: [
      ...(localResults.logs || []),
      ...(registeredActivityResults.logs || [])
    ]
  };
}

export { localServices };
