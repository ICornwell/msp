import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useUiEventPublisher } from './UiEventContext.js';
import { useDataCacheContext } from './DataCacheContext.js';
import type { ServiceRequestEnvelope } from 'msp_common';
import type { ViewDataContent } from "msp_common";
import { UiActivityEvent } from '../events/uiEvents.js';
import { serviceRequest } from '../comms/serverRequests.js';

export type ActivityEventsType = {
  /** Raised when a data view arrives from a service call or is replayed from cache. */
  ACTIVITY_SUCCEEDED:  'ACTIVITY_SUCCEEDED',
  /** Raised when a cached data view is mutated via save(). */
  ACTIVITY_FAILED: 'ACTIVITY_FAILED',
}

export const ActivityEvents: ActivityEventsType = {
  /** Raised when a data view arrives from a service call or is replayed from cache. */
  ACTIVITY_SUCCEEDED:  'ACTIVITY_SUCCEEDED',
  /** Raised when a cached data view is mutated via save(). */
  ACTIVITY_FAILED: 'ACTIVITY_FAILED',
} as const;

export type ActivityDispatchRequest = {
  namespace: string;
  activityName: string;
  version: string;
  payload: any;
  context?: string;
  correlationId?: string;
};

export type ActivityDispatchContextType = {
  callActivity: (request: ActivityDispatchRequest) => void;
};

export const ActivityDispatchContext = createContext<ActivityDispatchContextType>({
  callActivity: () => {},
});

export type ActivityDispatchProviderProps = {
  serviceHubUrl?: string;
  serviceType?: 'activity' | 'data' | 'view-read' | 'view-write';
  defaultTimeout?: number;
  children: ReactNode;
};

/**
 * Subsystem provider for activity/service calls.
 *
 * Behaviours dispatch here via useActivityDispatch().callActivity(...).
 * This provider owns the HTTP call and publishes DataLoaded / ActivityFailed
 * UIEvents on completion — it does NOT subscribe to the UIEvent bus.
 */
export function ActivityDispatchProvider({
  serviceHubUrl = '/api/v1',
  defaultTimeout = 30000,
  children,
}: ActivityDispatchProviderProps) {

  const { raiseUiEvent } = useUiEventPublisher<UiActivityEvent>();
  const dataCache = useDataCacheContext();

  const callActivity = useCallback(
    async (request: ActivityDispatchRequest) => {
      const { namespace, activityName, version, payload, context, correlationId } = request;

      const envelope: ServiceRequestEnvelope = {
        namespace,
        activityName,
        version,
        variantName: 'default',
        payload,
        context,
        correlationId,
      };

      try {
        const activityResponse = await serviceRequest('activity', envelope);

        if (activityResponse.success && activityResponse.result) {
          const raw = activityResponse.result;
          // ViewDataContent[] convention: { data: [{ viewName, viewVersion, viewRootId, content }] }
          if (Array.isArray(raw?.data) && raw.data.length > 0 && raw.data[0]?.viewName !== undefined) {
            for (const item of raw.data as Array<ViewDataContent<any>>) {
              dataCache.submitData(item);
            }
          }
          const responseWithoutResult = { ...activityResponse };
          delete responseWithoutResult.result;
          raiseUiEvent({
            messageType: ActivityEvents.ACTIVITY_SUCCEEDED,
            payload: {
              namespace,
              activityName,
              version,
              result: activityResponse.result,
              activityResponse: responseWithoutResult,
            },
            correlationId,
            timestamp: Date.now(),
          });
        } else {
          console.error('Activity execution failed:', activityResponse.message, activityResponse.error);
          raiseUiEvent({
            messageType: ActivityEvents.ACTIVITY_FAILED,
            payload: {
              namespace,
              activityName,
              version,
              activityResponse: { error: activityResponse.message, 
              details: activityResponse.error}
            },
            correlationId,
            timestamp: Date.now(),
          });
        }
      } catch (err: any) {
        console.error('Activity call error:', err);
       
        raiseUiEvent({
          messageType: ActivityEvents.ACTIVITY_FAILED,
          payload: {
            namespace,
            activityName,
            version,
            activityResponse: { error: err.message || 'Network error' },
          },
          correlationId,
          timestamp: Date.now(),
        });
      }
    },
    [raiseUiEvent, dataCache, serviceHubUrl, defaultTimeout],
  );

  return (
    <ActivityDispatchContext.Provider value={{ callActivity }}>
      {children}
    </ActivityDispatchContext.Provider>
  );
}

/**
 * Used exclusively by Behaviours (via BehaviourDispatchProvider) to
 * dispatch activity calls. Not for use in leaf UI components.
 */
export function useActivityDispatch(): ActivityDispatchContextType {
  return useContext(ActivityDispatchContext);
}
