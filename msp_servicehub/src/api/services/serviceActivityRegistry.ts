// Service Activity Registry
// Uses ActivitySet for version matching and name matching

import { ActivitySet, ServiceActivityResultBuilder, ServiceRequestEnvelope, serviceRequest } from 'msp_common';

export type ServiceActivityRegistration = {
  namespace: string;
  activityName: string;
  version: string;
  matchingVersionRange?: string;  // e.g., '^1.0.0', defaults to exact version
  serviceUrl: string;  // e.g., 'http://localhost:3001' for actorwork
  serviceName: string;
};

// ActivitySet is actually the factory function (exported as: activitySet as ActivitySet)
type ActivitySetInstance = ReturnType<typeof ActivitySet>;

class ServiceActivityRegistry {
  private activitySet: ActivitySetInstance;
  private registrations: ServiceActivityRegistration[] = [];

  constructor() {
    this.activitySet = ActivitySet();
  }

  register(registration: ServiceActivityRegistration) {
    // Store registration for tracking
    this.registrations.push(registration);
    
    const matchingVersionRange = registration.matchingVersionRange || registration.version;
    
    // Create a proxy activity that forwards to the remote service
    this.activitySet.use({
      namespace: registration.namespace,
      activityName: registration.activityName,
      version: registration.version,
      matchingVersionRange,
      context: '*',
      funcs: async (payload: any, resultBuilder: ServiceActivityResultBuilder) => {
        try {
          const envelope: ServiceRequestEnvelope = {
            namespace: registration.namespace,
            activityName: registration.activityName,
            version: registration.version,
            payload,
            context: '*'
          };

          resultBuilder.log(`Proxying to ${registration.serviceName} at ${registration.serviceUrl}`);

          const result = await serviceRequest(envelope, {
            baseUrl: registration.serviceUrl,
            endpointPath: '/api/v1/service/run',
            timeoutMs: 30000
          });

          if (result.success) {
            return resultBuilder.success(result.result);
          } else {
            return resultBuilder.failed(
              result.message || `Remote service failed: ${registration.serviceName}`,
              result.error
            );
          }
        } catch (error: any) {
          return resultBuilder.failed(
            `Failed to proxy to ${registration.serviceName}`,
            { message: error.message, serviceUrl: registration.serviceUrl }
          );
        }
      }
    });

    console.log(`Registered activity: ${registration.namespace}/${registration.activityName}@${registration.version} (${matchingVersionRange}) -> ${registration.serviceUrl}`);
  }

  // Use the ActivitySet's handle method which has fancy version matching and name matching
  async handle(namespace: string, activityName: string, version: string, payload: any, resultBuilder?: ServiceActivityResultBuilder) {
    return this.activitySet.handle(namespace, activityName, version, payload, resultBuilder);
  }

  getAll(): ServiceActivityRegistration[] {
    return [...this.registrations];
  }

  clear() {
    this.registrations = [];
    this.activitySet = ActivitySet();
  }
}

export const serviceActivityRegistry = new ServiceActivityRegistry();
