import { serviceManager } from 'msp_common';
import { serviceActivityRegistry, ServiceActivityRegistration } from './serviceActivityRegistry.js';
import { discoveryActivitySet } from '../activities/discovery.js';

// Create service manager for local activities
const localServices = serviceManager();
localServices.use(discoveryActivitySet);

// Activity for registering remote service activities
localServices.use({
  namespace: 'servicehub',
  activityName: 'registerServiceActivity',
  version: '1.0.0',
  matchingVersionRange: '*',
  context: '*',
  funcs: async (payload, resultBuilder) => {
    const registration = payload as ServiceActivityRegistration;
    
    if (!registration.namespace || !registration.activityName || !registration.version || !registration.serviceUrl) {
      return resultBuilder.failed('Invalid registration: namespace, activityName, version, and serviceUrl are required');
    }

    serviceActivityRegistry.register(registration);
    return resultBuilder.success({ message: 'Service activity registered successfully', registration });
  }
});

// Main routing function - checks local first, then uses registry's ActivitySet
export async function routeServiceActivity(
  namespace: string,
  activityName: string,
  version: string,
  payload: any,
  _context?: string
) {
  // Try local activities first
  const localResult = await localServices.runAllMatches(namespace, activityName, version, payload);
  
  if (localResult.success) {
    return localResult;
  }

  // Try remote services using the registry's ActivitySet (with fancy version matching)
  const registryResult = await serviceActivityRegistry.handle(namespace, activityName, version, payload);
  
  if (registryResult.currentResult().success) {
    return registryResult.currentResult();
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
      ...(localResult.logs || []),
      ...(registryResult.currentResult().logs || [])
    ]
  };
}

export { localServices };
