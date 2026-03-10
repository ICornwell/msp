import { useEffect, useRef } from 'react';
import { useUiEventContext } from '../contexts/UiEventContext.js';
import { useDataCacheContext } from '../contexts/DataCacheContext.js';
import type { ServiceRequestEnvelope, ServiceRequestResult } from 'msp_common';

type ServiceCallRequest = {
  messageType: string;
  payload: {
    namespace: string;
    activityName: string;
    version: string;
    payload: any;
    context?: string;
  };
  correlationId?: string;
  timestamp?: number;
};

export type ServiceDispatcherConfig = {
  serviceHubUrl?: string;
  defaultTimeout?: number;
};

/**
 * ServiceDispatcher component - listens for ServiceCallRequest events,
 * dispatches them to the backend, and publishes DataLoaded events with results.
 */
export function ServiceDispatcher({ config }: { config?: ServiceDispatcherConfig }) {
  const { subscribe, unsubscribe, publish } = useUiEventContext();
  const dataCache = useDataCacheContext();
  const subscriptionIdRef = useRef<string | null>(null);

  const serviceHubUrl = config?.serviceHubUrl || '/api/v1';
  const defaultTimeout = config?.defaultTimeout || 30000;

  useEffect(() => {
    // Subscribe to ServiceCallRequest events
    subscriptionIdRef.current = subscribe({
      callback: async (msg: ServiceCallRequest) => {
        if (msg.messageType !== 'ServiceCallRequest') return;
        const { namespace, activityName, version, payload, context } = msg.payload;

        try {
          // Build the service request envelope
          const envelope: ServiceRequestEnvelope = {
            namespace,
            activityName,
            version,
            payload,
            context,
            correlationId: msg.correlationId
          };

          // Make the HTTP request to the backend
          const controller = new AbortController();
          const timeoutHandle = setTimeout(() => controller.abort(), defaultTimeout);

          try {
            const response = await fetch(`${serviceHubUrl}/service/run`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(envelope),
              signal: controller.signal
            });

            clearTimeout(timeoutHandle);

            if (!response.ok) {
              throw new Error(`Service request failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json() as ServiceRequestResult;

            if (result.success && result.result) {
              // Publish DataLoaded event with the result
              const dataLoadedEvent = {
                messageType: 'DataLoaded',
                payload: {
                  dataType: activityName,
                  dataKey: `${namespace}/${activityName}/${version}`,
                  data: result.result,
                  fromCache: false
                },
                timestamp: Date.now()
              };

              publish(dataLoadedEvent);

              // Also publish to data cache for storage
              dataCache.publishEvent({
                type: 'DataViewLoaded',
                entityType: namespace,
                viewName: activityName,
                entityId: JSON.stringify(payload), // Use payload as key
                data: result.result
              });
            } else {
              console.error('Service call failed:', result.message, result.error);
              
              // Could publish a ServiceCallFailed event here
              publish({
                messageType: 'ServiceCallFailed',
                payload: {
                  namespace,
                  activityName,
                  version,
                  error: result.message || 'Unknown error',
                  details: result.error
                },
                correlationId: msg.correlationId,
                timestamp: Date.now()
              });
            }
          } catch (fetchError: any) {
            clearTimeout(timeoutHandle);
            console.error('Service request failed:', fetchError);
            
            publish({
              messageType: 'ServiceCallFailed',
              payload: {
                namespace,
                activityName,
                version,
                error: fetchError.message || 'Network error'
              },
              correlationId: msg.correlationId,
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.error('ServiceDispatcher error:', error);
        }
      },
      msgTypeFilter: (msg) => msg.messageType === 'ServiceCallRequest'
    });

    return () => {
      if (subscriptionIdRef.current) {
        unsubscribe(subscriptionIdRef.current);
      }
    };
  }, [serviceHubUrl, defaultTimeout]);

  return null; // This is a behavioral component with no UI
}
