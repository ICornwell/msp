import { useContext, createContext, useRef, useState } from 'react';
import PubSub, { UiPubSubMsg } from './UiPubSub.js';
import { DataIdentifier } from './Data.js';

// ============================================================================
// Message Types for Data Domain
// ============================================================================

export type DataRequest = 
  | { type: 'LoadDataView', entityType: string, viewName: string, entityId: string }
  | { type: 'RefreshDataView', entityType: string, viewName: string, entityId: string }
  | { type: 'UnloadDataView', entityType: string, viewName: string, entityId: string }
  | { type: 'PublishChange', entityType: string, viewName: string, entityId: string, changePath?: string[], changeValue?: any };

export type DataEvent = 
  | { type: 'DataViewLoaded', entityType: string, viewName: string, entityId: string, data: any }
  | { type: 'DataViewLoadFailed', entityType: string, viewName: string, entityId: string, error: string }
  | { type: 'DataViewChanged', entityType: string, viewName: string, entityId: string, changeType: 'updated' | 'deleted', path?: string[] }
  | { type: 'DataViewUnloaded', entityType: string, viewName: string, entityId: string };

export type DataCacheMsg = UiPubSubMsg & (DataRequest | DataEvent);

// ============================================================================
// Cache Storage
// ============================================================================

type CacheKey = string; // serialized: `${entityType}|${viewName}|${entityId}`
type CachedView = {
  entityType: string;
  viewName: string;
  entityId: string;
  data: any;
  loadedAt: number;
  locked?: boolean;
};

function toCacheKey(entityType: string, viewName: string, entityId: string): CacheKey {
  return `${entityType}|${viewName}|${entityId}`;
}

function fromDataIdentifier(id: DataIdentifier): CacheKey {
  return toCacheKey(id.domain, id.view, id.eid);
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
  queryData: (entityType: string, viewName: string, entityId: string) => any | undefined;
  queryDataByIdentifier: (id: DataIdentifier) => any | undefined;
  isLocked: (entityType: string, viewName: string, entityId: string) => boolean;
  
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

  // Subscribe to requests and handle them
  const requestSubIdRef = useRef<string | undefined>(undefined);
  if (!requestSubIdRef.current) {
    requestSubIdRef.current = requestPubSubRef.current.subscribe({
      callback: handleDataRequest,
    });
  }

  async function loadData(entityType: string, viewName: string, entityId: string, forceRefresh = false): Promise<void> {
    const key = toCacheKey(entityType, viewName, entityId);
    
    // Check if already in flight - prevent duplicate requests from over-clicky users
    if (inFlightRequests.has(key)) {
      console.log(`Load already in flight for ${key}, skipping duplicate request`);
      return; // The in-flight request will publish the event when done
    }

    // Check if already loaded (and not forcing refresh)
    if (!forceRefresh && cache.has(key)) {
      const cached = cache.get(key)!;
      eventPubSubRef.current.publish({
        messageType: 'DataViewLoaded',
        type: 'DataViewLoaded',
        entityType,
        viewName,
        entityId,
        data: cached.data,
        payload: cached.data,
      } as any);
      return;
    }

    // Mark as in-flight
    const loadPromise = (async () => {
      try {
        // TODO: Dispatch async load to service layer
        // For now, respond with mock data
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const mockData = { id: entityId, type: entityType, view: viewName, loadedAt: Date.now() };
        
        // Store in cache
        cache.set(key, {
          entityType,
          viewName,
          entityId,
          data: mockData,
          loadedAt: Date.now(),
        });

        // Update entity index
        if (!entityIndex.has(entityId)) {
          entityIndex.set(entityId, new Set());
        }
        entityIndex.get(entityId)!.add(key);

        // Publish loaded event
        eventPubSubRef.current.publish({
          messageType: 'DataViewLoaded',
          type: 'DataViewLoaded',
          entityType,
          viewName,
          entityId,
          data: mockData,
          payload: mockData,
        } as any);
      } catch (error: any) {
        // Publish load failed event
        eventPubSubRef.current.publish({
          messageType: 'DataViewLoadFailed',
          type: 'DataViewLoadFailed',
          entityType,
          viewName,
          entityId,
          error: error?.message || 'Load failed',
          payload: { error: error?.message || 'Load failed' },
        } as any);
      } finally {
        // Remove from in-flight tracking
        inFlightRequests.delete(key);
      }
    })();

    inFlightRequests.set(key, loadPromise);
    await loadPromise;
  }

  function handleDataRequest(msg: DataCacheMsg) {
    if (msg.type === 'LoadDataView') {
      loadData(msg.entityType, msg.viewName, msg.entityId, false);
    } else if (msg.type === 'RefreshDataView') {
      loadData(msg.entityType, msg.viewName, msg.entityId, true);
    } else if (msg.type === 'UnloadDataView') {
      const key = toCacheKey(msg.entityType, msg.viewName, msg.entityId);
      cache.delete(key);
      
      const indexSet = entityIndex.get(msg.entityId);
      if (indexSet) {
        indexSet.delete(key);
        if (indexSet.size === 0) {
          entityIndex.delete(msg.entityId);
        }
      }

      eventPubSubRef.current.publish({
        messageType: 'DataViewUnloaded',
        type: 'DataViewUnloaded',
        entityType: msg.entityType,
        viewName: msg.viewName,
        entityId: msg.entityId,
        payload: undefined,
      } as any);
    } else if (msg.type === 'PublishChange') {
      const key = toCacheKey(msg.entityType, msg.viewName, msg.entityId);
      const cached = cache.get(key);
      
      if (cached) {
        // Apply change to cached data (simple path-based update)
        if (msg.changePath && msg.changeValue !== undefined) {
          let target = cached.data;
          for (let i = 0; i < msg.changePath.length - 1; i++) {
            target = target[msg.changePath[i]];
          }
          target[msg.changePath[msg.changePath.length - 1]] = msg.changeValue;
        }

        // Publish change event
        eventPubSubRef.current.publish({
          messageType: 'DataViewChanged',
          type: 'DataViewChanged',
          entityType: msg.entityType,
          viewName: msg.viewName,
          entityId: msg.entityId,
          changeType: 'updated',
          path: msg.changePath,
          payload: cached.data,
        } as any);
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
    publishEvent: (event) => 
      eventPubSubRef.current.publish({ messageType: event.type, payload: event, ...event } as any),
    
    queryData: (entityType, viewName, entityId) => {
      const key = toCacheKey(entityType, viewName, entityId);
      return cache.get(key)?.data;
    },
    queryDataByIdentifier: (id) => {
      const key = fromDataIdentifier(id);
      return cache.get(key)?.data;
    },
    isLocked: (entityType, viewName, entityId) => {
      const key = toCacheKey(entityType, viewName, entityId);
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
