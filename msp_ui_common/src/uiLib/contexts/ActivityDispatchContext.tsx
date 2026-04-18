import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useUiEventPublisher } from './UiEventContext.js';
import { useDataCacheContext } from './DataCacheContext.js';
import type { ServiceRequestEnvelope, ServiceRequestResult } from 'msp_common';
import type { ViewDataContent } from "msp_common";
import { UiActivityEvent } from '../events/uiEvents.js';

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
        payload,
        context,
        correlationId,
      };

      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), defaultTimeout);

      try {
        const response = await fetch(`${serviceHubUrl}/service/run`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(envelope),
          signal: controller.signal,
        });

        clearTimeout(timeoutHandle);

        if (!response.ok) {
          console.error('Activity call failed:', response.status, response.statusText);
          throw new Error(`Activity call failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json() as ServiceRequestResult;

        if (result.success && result.result) {
          const raw = result.result;
          // ViewDataContent[] convention: { data: [{ viewName, viewVersion, viewRootId, content }] }
          if (Array.isArray(raw?.data) && raw.data.length > 0 && raw.data[0]?.viewName !== undefined) {
            for (const item of raw.data as Array<ViewDataContent<any>>) {
              dataCache.submitData(item);
            }
          }
          raiseUiEvent({
            messageType: ActivityEvents.ACTIVITY_SUCCEEDED,
            payload: {
              namespace,
              activityName,
              version,
              result
            },
            correlationId,
            timestamp: Date.now(),
          });
        } else {
          console.error('Activity execution failed:', result.message, result.error);
          raiseUiEvent({
            messageType: ActivityEvents.ACTIVITY_FAILED,
            payload: {
              namespace,
              activityName,
              version,
              result: { error: result.message, 
              details: result.error}
            },
            correlationId,
            timestamp: Date.now(),
          });
        }
      } catch (err: any) {
        console.error('Activity call error:', err);
        clearTimeout(timeoutHandle);
        raiseUiEvent({
          messageType: ActivityEvents.ACTIVITY_FAILED,
          payload: {
            namespace,
            activityName,
            version,
            result: { error: err.message || 'Network error' },
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
