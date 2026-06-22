import { useContext, createContext, useRef, useState } from 'react';
import PubSub, { UiPubSubMsg } from './UiPubSub.js';
import { useUiEventContext } from './UiEventContext.js';
//import { DataIdentifier } from './Data.js';
import type { DataViewIdQueryEnvelope, ViewDataContent, ViewDataQueryIdentifier } from 'msp_common';
import { v4 as uuid } from 'uuid';
import { serviceRequest } from '../comms/serverRequests.js';
import { useUserSession } from '../hooks/index.js';

/**
 * UIEvent messageTypes raised by the DataCache subsystem.
 * Use these in .whenEventRaised(...) to match data events in Behaviours.
 */
export type DataCacheEventsType = {
  /** Raised when a data view arrives from a service call or is replayed from cache. */
  DATA_LOADED: 'DATA_LOADED',
  /** Raised when a cached data view is mutated via save(). */
  DATA_CHANGED: 'DATA_CHANGED',
}


export const DataCacheEvents: DataCacheEventsType = {
  /** Raised when a data view arrives from a service call or is replayed from cache. */
  DATA_LOADED: 'DATA_LOADED',
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
  | { type: 'UpdateData', viewDataIdentifier: ViewDataQueryIdentifier, dataPatch: Partial<any> }
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

type CacheKey = string; // serialized: `${namespace}|${name}|${viewRootEntityId}`
type CachedView = {
  viewDataContent?: ViewDataContent<any>;
  loadedAt: number;
  locked?: boolean;
};

function toCacheKey(viewDataContent: ViewDataQueryIdentifier, forBusKey?: boolean): CacheKey {
  const {
    namespace,
    name,
    version,
    variantName,
    viewRootEntityId,
    viewRootBusinessKey } = viewDataContent;
  return `${namespace}|${name}|${version}|${variantName}|||${forBusKey ? viewRootBusinessKey : viewRootEntityId}`;
}

// function fromDataIdentifier(viewDataQueryIdentifier: ViewDataQueryIdentifier): CacheKey {
//   return toCacheKey(viewDataQueryIdentifier);
// }

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
  unsubscribeFromEvents: () => { },
  publishRequest: () => { },
  publishEvent: () => { },
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
  const [cache, clearCache] = useState(() => new Map<CacheKey, CachedView>());
  // the entityIndex tracks different view of the same entity,
  //  so that when an entity is updated, all views of it can be invalidated
  // will extend to all objects!
  const [entityIndex, clearEntityIndex] = useState(() => new Map<string, Set<CacheKey>>());
  const [inFlightRequests, clearInFlightRequests] = useState(() => new Map<CacheKey, Promise<void>>());

  const { publish: raiseUiEvent } = useUiEventContext();

  useUserSession({
    onLoggedOut: () => {
      clearCache(new Map<CacheKey, CachedView>());
      clearEntityIndex(new Map<string, Set<CacheKey>>());
      clearInFlightRequests(new Map<CacheKey, Promise<void>>());
    }, onLoggedIn: () => { return; }
  });

  function cacheHas(key: ViewDataQueryIdentifier): boolean {
    return cache.has(toCacheKey(key)) || cache.has(toCacheKey(key, true));
  }

  function cacheGet(key: ViewDataQueryIdentifier): CachedView | undefined {
    return cache.get(key.viewRootBusinessKey ? toCacheKey(key, true) : toCacheKey(key));
  }

  function cacheSet(key: ViewDataQueryIdentifier, value: CachedView): void {
    if (key.viewRootBusinessKey) {
      cache.set(toCacheKey(key, true), value);
    }
    if (key.viewRootEntityId) {
      cache.set(toCacheKey(key), value);
    }
  }

  function cacheDelete(key: ViewDataQueryIdentifier): boolean {
    const eid = cache.delete(toCacheKey(key))
    const bkey = cache.delete(toCacheKey(key, true));
    return eid || bkey;
  }

  function entityIndexHas(key: ViewDataQueryIdentifier): boolean {
    return entityIndex.has(toCacheKey(key)) || entityIndex.has(toCacheKey(key, true));
  }

  function entityIndexGet(key: ViewDataQueryIdentifier): Set<CacheKey> | undefined {
    return entityIndex.get(key.viewRootBusinessKey ? toCacheKey(key, true) : toCacheKey(key));
  }

  function entityIndexSet(key: ViewDataQueryIdentifier, value: Set<CacheKey>): void {
    if (key.viewRootBusinessKey) {
      entityIndex.set(toCacheKey(key, true), value);
    }
    if (key.viewRootEntityId) {
      entityIndex.set(toCacheKey(key), value);
    }
  }

  function entityIndexDelete(key: ViewDataQueryIdentifier): boolean {
    const eid = entityIndex.delete(toCacheKey(key))
    const bkey = entityIndex.delete(toCacheKey(key, true));
    return eid || bkey;
  }

  function inFlightRequestsHas(key: ViewDataQueryIdentifier): boolean {
    return inFlightRequests.has(toCacheKey(key)) || inFlightRequests.has(toCacheKey(key, true));
  }

  function inFlightRequestsSet(key: ViewDataQueryIdentifier, value: Promise<void>): boolean {
    if (key.viewRootBusinessKey) {
      inFlightRequests.set(toCacheKey(key, true), value);
    }
    if (key.viewRootEntityId) {
      inFlightRequests.set(toCacheKey(key), value);
    }
    return true;
  }

  function inFlightRequestsDelete(key: ViewDataQueryIdentifier): boolean {
    const eid = inFlightRequests.delete(toCacheKey(key))
    const bkey = inFlightRequests.delete(toCacheKey(key, true));
    return eid || bkey;
  }

  // Publish to the private DataCache bus AND the UIEvent bus.
  // Behaviours see the UIEvent; render-engine containers subscribe to the private bus.
  function dispatchDataEvent(event: DataEvent) {
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


    if (inFlightRequestsHas(viewDataQueryIdentifier)) {
      return;
    }

    if (!forceRefresh && cacheHas(viewDataQueryIdentifier)) {
      const cached = cacheGet(viewDataQueryIdentifier);
      const data = fromViewData(cached!.viewDataContent as ViewDataContent<any>, viewDataQueryIdentifier)
      dispatchDataEvent({ type: 'DataViewLoaded', viewDataContent: data, fromCache: true, correlationId } as any);
      return;
    }

    function isEmpty(value: any): boolean {
      return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
    }

    const loadPromise = (async () => {
      try {
        // if we don't have the data - request it from the the server,
        // cache the results and publish a DataViewLoaded event
        const entityId = viewDataQueryIdentifier.viewRootEntityId
        const busKey = viewDataQueryIdentifier.viewRootBusinessKey;
        const response = await serviceRequest<DataViewIdQueryEnvelope>('view-read', {
          payload: {
            viewId: viewDataQueryIdentifier,
            id: isEmpty(entityId) ? busKey : entityId,
            options: { dataRequestOptions: { useBusinessKey: isEmpty(entityId) } }
          }
        });

        if (response.success && response.result) {
          const raw = response.result;
          for (const data of (Array.isArray(raw?.data) ? raw.data : [raw.data]) as Array<ViewDataContent<any>>) {
            const viewDataContent = data?.name !== undefined
              ? fromViewData(data as ViewDataContent<any>, viewDataQueryIdentifier)
              : undefined;
            if (viewDataContent) {
              cacheSet(viewDataQueryIdentifier, { viewDataContent, loadedAt: Date.now() });

              if (!entityIndexHas(viewDataQueryIdentifier)) {
                entityIndexSet(viewDataQueryIdentifier, new Set());
              }
            }
            if (viewDataQueryIdentifier.viewRootEntityId) {
              entityIndexGet(viewDataQueryIdentifier)!.add(viewDataQueryIdentifier.viewRootEntityId);
            }
            if (viewDataQueryIdentifier.viewRootBusinessKey) {
              entityIndexGet(viewDataQueryIdentifier)!
                .add(viewDataQueryIdentifier.viewRootBusinessKey);
            }

            dispatchDataEvent({ type: 'DataViewLoaded', viewDataContent: data, fromCache: false, correlationId } as any);
          }
        }
      } catch (error: any) {
        eventPubSubRef.current.publish({
          messageType: 'DataViewLoadFailed',
          type: 'DataViewLoadFailed',
          viewDataQueryIdentifier,
          error: error?.message || 'Load failed',
          payload: { error: error?.message || 'Load failed' },
        } as any);
      } finally {
        inFlightRequestsDelete(viewDataQueryIdentifier);
      }
    })();

    inFlightRequestsSet(viewDataQueryIdentifier, loadPromise);
    await loadPromise;
  }

  function handleDataRequest(msg: DataCacheMsg) {
    if (msg.type === 'LoadDataView') {
      loadData(msg.viewDataQueryIdentifier, false, msg.correlationId);
    } else if (msg.type === 'RefreshDataView') {
      loadData(msg.viewDataContent, true, msg.correlationId);
    } else if (msg.type === 'UnloadDataView') {

      cacheDelete(msg.viewDataContent);

      const indexSet = entityIndexGet({
        ...msg.viewDataContent,
        viewRootEntityId: msg.viewDataContent.viewRootId,
        viewRootBusinessKey: undefined
      });
      if (indexSet) {
        if (msg.viewDataContent.viewRootEntityId) {
          indexSet.delete(msg.viewDataContent.viewRootEntityId);
        }
        if (msg.viewDataContent.viewRootBusinessKey) {
          indexSet.delete(msg.viewDataContent.viewRootBusinessKey);
        }
        if (indexSet.size === 0) entityIndexDelete({
          ...msg.viewDataContent,
          viewRootEntityId: msg.viewDataContent.viewRootId,
          viewRootBusinessKey: undefined
        });

      }

      eventPubSubRef.current.publish({
        messageType: 'DataViewUnloaded',
        type: 'DataViewUnloaded',
        viewDataContent: msg.viewDataContent,
        correlationId: msg.correlationId,
      } as any);
    } else if (msg.type === 'UpdateData') {
      const cached = cacheGet(msg.viewDataIdentifier);
      if (cached?.viewDataContent?.content && msg.dataPatch && typeof msg.dataPatch === 'object') {
        const currentContent = cached.viewDataContent.content as any;
        const recordId = msg.viewDataIdentifier.recordId;

        if (Array.isArray(currentContent) && recordId) {
          const updatedContent = currentContent.map((entry: any) =>
            entry?.id === recordId && entry && typeof entry === 'object'
              ? msg.dataPatch
              : entry
          );
          cacheSet(msg.viewDataIdentifier, { ...cached, viewDataContent: { ...cached.viewDataContent, content: updatedContent } });
        } else if (currentContent && typeof currentContent === 'object' && !Array.isArray(currentContent)) {
          cacheSet(msg.viewDataIdentifier, { ...cached, viewDataContent: { ...cached.viewDataContent, content: msg.dataPatch } });
        }

        const changedViewDataContent = fromViewData(cached.viewDataContent, msg.viewDataIdentifier)
          ?? cached.viewDataContent;

        dispatchDataEvent({
          type: 'DataViewChanged',
          viewDataContent: changedViewDataContent,
          changeType: 'updated',
          correlationId: msg.correlationId,
        } as DataEvent);
      }
    } else if (msg.type === 'PublishChange') {
      const cached = cacheGet(msg.viewDataContent);

      if (cached) {
        if (msg.changePath && msg.changeValue !== undefined) {
          let target = cached.viewDataContent?.content;
          for (let i = 0; i < msg.changePath.length - 1; i++) {
            target = target[msg.changePath[i]];
          }
          target[msg.changePath[msg.changePath.length - 1]] = msg.changeValue;
        }

        dispatchDataEvent({
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
    publishEvent: (event) => dispatchDataEvent(event),

    queryData: (viewDataQueryIdentifier) => {
      return cacheGet(viewDataQueryIdentifier)?.viewDataContent?.content;
    },
    queryDataByIdentifier: (id) => {

      return cacheGet(id)?.viewDataContent?.content;
    },

    submitData: (viewDataContent: ViewDataContent<any>, correlationId?: string) => {
      const cached = cacheGet(viewDataContent);
      if (cached && cached.viewDataContent) {
        cached.viewDataContent.content = viewDataContent.content;
        dispatchDataEvent({
          type: 'DataViewChanged',
          viewDataContent: cached.viewDataContent,
          changeType: 'updated',
          correlationId,
        } as DataEvent);
      } else {
        cacheSet(viewDataContent, { viewDataContent, loadedAt: Date.now() });
        dispatchDataEvent({
          type: 'DataViewLoaded',
          viewDataContent,
          fromCache: false,
          correlationId,
        } as DataEvent);
      }
    },

    isLocked: (viewDataQueryIdentifier) => {
      return cacheGet(viewDataQueryIdentifier)?.locked ?? false;
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
  update: (viewDataIdentifier: any, dataPatch: Partial<any>, correlationId?: string) => void;
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
    update: (viewDataIdentifier, dataPatch, correlationId) => {
      context.publishRequest({ type: 'UpdateData', viewDataIdentifier, dataPatch, correlationId });
    },
  };
}
