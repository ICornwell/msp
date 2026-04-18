import { useContext, createContext, useRef, useState } from 'react';
import PubSub, { UiPubSubMsg } from './UiPubSub.js';
import { useUiEventContext } from './UiEventContext.js';
//import { DataIdentifier } from './Data.js';
import type { ViewDataContent, ViewDataQueryIdentifier } from 'msp_common';
import { v4 as uuid } from 'uuid';

/**
 * UIEvent messageTypes raised by the DataCache subsystem.
 * Use these in .whenEventRaised(...) to match data events in Behaviours.
 */
export type DataCacheEventsType = {
  /** Raised when a data view arrives from a service call or is replayed from cache. */
  DATA_LOADED:  'DATA_LOADED',
  /** Raised when a cached data view is mutated via save(). */
  DATA_CHANGED: 'DATA_CHANGED',
}


export const DataCacheEvents: DataCacheEventsType = {
  /** Raised when a data view arrives from a service call or is replayed from cache. */
  DATA_LOADED:  'DATA_LOADED',
  /** Raised when a cached data view is mutated via save(). */
  DATA_CHANGED: 'DATA_CHANGED',
} as const;

// ============================================================================
// Message Types for Data Domain
// ============================================================================

export type DataRequestCommon = {
  type: string;
  correlationId?: string;
};
export type DataRequest = DataRequestCommon & (
  | { type: 'LoadDataView', viewDataQueryIdentifier: ViewDataQueryIdentifier }
  | { type: 'RefreshDataView', viewDataContent: ViewDataContent<any> }
  | { type: 'UnloadDataView', viewDataContent: ViewDataContent<any> }
  | { type: 'PublishChange', viewDataContent: ViewDataContent<any>, changePath?: string[], changeValue?: any }
);

export type DataEventCommon = {
  type: string;
  viewDataContent: ViewDataContent<any>;
  correlationId?: string;
  fromCache?: boolean;
};

export type DataEvent = DataEventCommon & (
  | { type: 'DataViewLoaded' }
  | { type: 'DataViewLoadFailed', error: string }
  | { type: 'DataViewChanged', changeType: 'updated' | 'deleted', path?: string[] }
  | { type: 'DataViewUnloaded' }
)

export type DataCacheMsg = UiPubSubMsg & (DataRequest | DataEvent);

// ============================================================================
// Cache Storage
// ============================================================================

type CacheKey = string; // serialized: `${viewDomain}|${viewName}|${viewRootEntityId}`
type CachedView = {
  viewDataContent?: ViewDataContent<any>;
  loadedAt: number;
  locked?: boolean;
};

function toCacheKey(viewDataContent: ViewDataQueryIdentifier): CacheKey {
  const { viewDomain, viewName, viewRootEntityId } = viewDataContent;
  return `${viewDomain}|${viewName}|${viewRootEntityId}`;
}

function fromDataIdentifier(viewDataQueryIdentifier: ViewDataQueryIdentifier): CacheKey {
  return toCacheKey(viewDataQueryIdentifier);
}

// ============================================================================
// Context Type
// ============================================================================

export type DataCacheContextType = {
  // Pub-sub for data domain
  subscribeToEvents: (callback: (msg: DataCacheMsg) => void, filter?: (msg: DataCacheMsg) => boolean) => string;
  unsubscribeFromEvents: (subscriptionId: string) => void;
  publishRequest: (request: DataRequest) => void;
  publishEvent: (event: DataEvent) => void;
  
  // Direct cache queries (sync)
  queryData: (viewDataQueryIdentifier: ViewDataQueryIdentifier) => any | undefined;
  submitData: (viewDataContent: ViewDataContent<any>) => any | undefined;
  queryDataByIdentifier: (viewDataQueryIdentifier: ViewDataQueryIdentifier) => any | undefined;
  isLocked: (viewDataQueryIdentifier: ViewDataQueryIdentifier) => boolean;
  
  // Internal cache state (for provider only)
  _cache: Map<CacheKey, CachedView>;
  _entityIndex: Map<string, Set<CacheKey>>;
};

// ============================================================================
// Context and Provider
// ============================================================================

export const DataCacheContext = createContext<DataCacheContextType>({
  subscribeToEvents: () => '',
  unsubscribeFromEvents: () => {},
  publishRequest: () => {},
  publishEvent: () => {},
  queryData: () => undefined,
  submitData: () => undefined,
  queryDataByIdentifier: () => undefined,
  isLocked: () => false,
  _cache: new Map(),
  _entityIndex: new Map(),
});

export const DataCacheProvider = ({ children }: { children: any }) => {
  const requestPubSubRef = useRef(PubSub<DataCacheMsg>());
  const eventPubSubRef = useRef(PubSub<DataCacheMsg>());
  const [cache] = useState(() => new Map<CacheKey, CachedView>());
  const [entityIndex] = useState(() => new Map<string, Set<CacheKey>>());
  const [inFlightRequests] = useState(() => new Map<CacheKey, Promise<void>>());

  const { publish: raiseUiEvent } = useUiEventContext();

  // Publish to the private DataCache bus AND the UIEvent bus.
  // Behaviours see the UIEvent; render-engine containers subscribe to the private bus.
  function fireDataEvent(event: DataEvent) {
    // timeout to enusre event is in the next, rather than cuurent react cycle
    // so fast repsosnes from the cache don't miss the requester's listener subscriptions
    setTimeout(() => {
    const msg = { messageType: event.type, payload: event, ...event } as any;
    eventPubSubRef.current.publish(msg);

    const isChange = event.type === 'DataViewChanged';
    raiseUiEvent({
      messageType: isChange ? DataCacheEvents.DATA_CHANGED : DataCacheEvents.DATA_LOADED,
      payload: {
        viewDataContent: event.viewDataContent,
        fromCache: (event as any).fromCache ?? false,
        dataEventType: event.type,
      },
      correlationId: event.correlationId || uuid(),
      timestamp: Date.now(),
    });
  }, 0);
}

  // Subscribe to requests and handle them
  const requestSubIdRef = useRef<string | undefined>(undefined);
  if (!requestSubIdRef.current) {
    requestSubIdRef.current = requestPubSubRef.current.subscribe({
      callback: handleDataRequest,
    });
  }

  function fromViewData(data: ViewDataContent<any>, viewDataQueryIdentifier: ViewDataQueryIdentifier): ViewDataContent<any> | undefined {
    if (!data) return undefined;
    if (Array.isArray(data.content) && viewDataQueryIdentifier.recordId) {
      return { ...data, recordId: viewDataQueryIdentifier.recordId, content: data.content.find((item: any) => item.id === viewDataQueryIdentifier.recordId) };
    }
    return data;
  }

  async function loadData(viewDataQueryIdentifier: ViewDataQueryIdentifier, forceRefresh = false, correlationId?: string): Promise<void> {
    const key = toCacheKey(viewDataQueryIdentifier);
    
    if (inFlightRequests.has(key)) {
      return;
    }

    if (!forceRefresh && cache.has(key)) {
      const cached = cache.get(key)!;
      const data = fromViewData(cached.viewDataContent as ViewDataContent<any>, viewDataQueryIdentifier)
      fireDataEvent({ type: 'DataViewLoaded', viewDataContent: data, fromCache: true, correlationId } as any);
      return;
    }

    const loadPromise = (async () => {
      try {
        //TODO: replace with real data loading logic
        // we've not had to do this yet as data has been loaded
        // via ServiceActiivty calls so far
        // but he manifests will provide ViewDataQueryIdentifier maps to Activities
        // so the UI can just request by the ViewDataQueryIdentifier and not have to know
        // the Service Activity names
        await new Promise(resolve => setTimeout(resolve, 100));
        const mockData = { id: viewDataQueryIdentifier.viewRootEntityId, type: viewDataQueryIdentifier.viewRootEntityId, view: viewDataQueryIdentifier.viewName, loadedAt: Date.now() };
        const viewDataContent: ViewDataContent<any> = {
          viewName: viewDataQueryIdentifier.viewName,
          viewDomain: viewDataQueryIdentifier.viewDomain,
          viewVersion: viewDataQueryIdentifier.viewVersion ?? '1.0.0',
          viewRootEntityType: viewDataQueryIdentifier.viewRootEntityId,
          viewRootEntityId: viewDataQueryIdentifier.viewRootEntityId,
          viewRootEntityBusKey: viewDataQueryIdentifier.viewRootEntityId,
          viewRootId: viewDataQueryIdentifier.viewRootEntityId,
          content: mockData,
        };
        cache.set(key, { viewDataContent, loadedAt: Date.now() });

        if (!entityIndex.has(viewDataQueryIdentifier.viewRootEntityId)) {
          entityIndex.set(viewDataQueryIdentifier.viewRootEntityId, new Set());
        }
        entityIndex.get(viewDataQueryIdentifier.viewRootEntityId)!.add(key);

        const data = fromViewData(viewDataContent, viewDataQueryIdentifier)
        fireDataEvent({ type: 'DataViewLoaded', viewDataContent: data, fromCache: false, correlationId } as any);
      } catch (error: any) {
        eventPubSubRef.current.publish({
          messageType: 'DataViewLoadFailed',
          type: 'DataViewLoadFailed',
          viewDataQueryIdentifier,
          error: error?.message || 'Load failed',
          payload: { error: error?.message || 'Load failed' },
        } as any);
      } finally {
        inFlightRequests.delete(key);
      }
    })();

    inFlightRequests.set(key, loadPromise);
    await loadPromise;
  }

  function handleDataRequest(msg: DataCacheMsg) {
    if (msg.type === 'LoadDataView') {
      loadData(msg.viewDataQueryIdentifier, false, msg.correlationId);
    } else if (msg.type === 'RefreshDataView') {
      loadData(msg.viewDataContent, true, msg.correlationId);
    } else if (msg.type === 'UnloadDataView') {
      const key = toCacheKey(msg.viewDataContent);
      cache.delete(key);
      
      const indexSet = entityIndex.get(msg.viewDataContent.viewRootId);
      if (indexSet) {
        indexSet.delete(key);
        if (indexSet.size === 0) entityIndex.delete(msg.viewDataContent.viewRootId);
      }

      eventPubSubRef.current.publish({
        messageType: 'DataViewUnloaded',
        type: 'DataViewUnloaded',
        viewDataContent: msg.viewDataContent,
        correlationId: msg.correlationId,
      } as any);
    } else if (msg.type === 'PublishChange') {
      const key = toCacheKey(msg.viewDataContent);
      const cached = cache.get(key);
      
      if (cached) {
        if (msg.changePath && msg.changeValue !== undefined) {
          let target = cached.viewDataContent?.content;
          for (let i = 0; i < msg.changePath.length - 1; i++) {
            target = target[msg.changePath[i]];
          }
          target[msg.changePath[msg.changePath.length - 1]] = msg.changeValue;
        }

        fireDataEvent({
          type: 'DataViewChanged',
          viewDataContent: cached.viewDataContent,
          changeType: 'updated', path: msg.changePath,
          correlationId: msg.correlationId,
        } as DataEvent);
      }
    }
  }

  const contextValue: DataCacheContextType = {
    subscribeToEvents: (callback, filter) => 
      eventPubSubRef.current.subscribe({ callback, msgTypeFilter: filter }),
    unsubscribeFromEvents: (subscriptionId) => 
      eventPubSubRef.current.unsubscribe(subscriptionId),
    publishRequest: (request) => 
      requestPubSubRef.current.publish({ messageType: request.type, payload: request, ...request } as any),
    publishEvent: (event) => fireDataEvent(event),
    
    queryData: (viewDataQueryIdentifier) => {
      const key = toCacheKey(viewDataQueryIdentifier);
      return cache.get(key)?.viewDataContent?.content;
    },
    queryDataByIdentifier: (id) => {
      const key = fromDataIdentifier(id);
      return cache.get(key)?.viewDataContent?.content;
    },

    submitData: (viewDataContent: ViewDataContent<any>, correlationId?: string) => {
      const key = toCacheKey(viewDataContent);
      const cached = cache.get(key);
      if (cached && cached.viewDataContent) {
        cached.viewDataContent.content = viewDataContent.content;
        fireDataEvent({
          type: 'DataViewChanged',
          viewDataContent: cached.viewDataContent,
          changeType: 'updated',
          correlationId,
        } as DataEvent);
      } else {
        cache.set(key, { viewDataContent, loadedAt: Date.now() });
        fireDataEvent({
          type: 'DataViewLoaded',
          viewDataContent,
          fromCache: false,
          correlationId,
        } as DataEvent);
      }
    },

    isLocked: (viewDataQueryIdentifier) => {
      const key = toCacheKey(viewDataQueryIdentifier);
      return cache.get(key)?.locked ?? false;
    },
    
    _cache: cache,
    _entityIndex: entityIndex,
  };

  return (
    <DataCacheContext.Provider value={contextValue}>
      {children}
    </DataCacheContext.Provider>
  );
};

export const useDataCacheContext = () => useContext(DataCacheContext);

// ============================================================================
// Data Dispatch — used exclusively by Behaviours via BehaviourDispatchProvider
// ============================================================================

export type DataDispatch = {
  invalidate: (viewDataContent: any, correlationId?: string) => void;
  save: (viewDataContent: any, changePath?: string[], changeValue?: any, correlationId?: string) => void;
};

/**
 * Hook that exposes the Behaviour-facing dispatch surface of the data subsystem.
 * Not for use in leaf UI components.
 */
export function useDataDispatch(): DataDispatch {
  const context = useDataCacheContext();
  return {
    invalidate: (viewDataContent, correlationId) => {
      context.publishRequest({ type: 'UnloadDataView', viewDataContent, correlationId });
    },
    save: (viewDataContent, changePath, changeValue, correlationId) => {
      context.publishRequest({ type: 'PublishChange', viewDataContent, changePath, changeValue, correlationId });
    },
  };
}
