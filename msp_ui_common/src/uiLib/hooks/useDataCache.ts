import { useEffect, useRef } from 'react';
import { useDataCacheContext, DataCacheMsg, DataRequest, DataEvent } from '../contexts/DataCacheContext.js';
import { DataIdentifier } from '../contexts/Data.js';

export type DataCacheOperations = {
  // Request operations (async via pub-sub)
  loadData: (entityType: string, viewName: string, entityId: string) => void;
  refreshData: (entityType: string, viewName: string, entityId: string) => void;
  unloadData: (entityType: string, viewName: string, entityId: string) => void;
  publishChange: (entityType: string, viewName: string, entityId: string, changePath?: string[], changeValue?: any) => void;
  
  // Query operations (sync from cache)
  queryData: (entityType: string, viewName: string, entityId: string) => any | undefined;
  queryDataByIdentifier: (id: DataIdentifier) => any | undefined;
  isLocked: (entityType: string, viewName: string, entityId: string) => boolean;
  
  // Direct pub-sub access (for advanced use)
  publishRequest: (request: DataRequest) => void;
  publishEvent: (event: DataEvent) => void;
  
  // Manual unsubscribe
  unsubscribe: () => void;
};

/**
 * Functional hook for interacting with the data cache.
 * 
 * @param onDataEvent - Callback invoked when data events are published (DataViewLoaded, DataViewChanged, etc.)
 * @param eventFilter - Optional filter to limit which events trigger the callback
 * @returns Operations for requesting, querying, and modifying cached data
 */
export function useDataCache(
  onDataEvent?: (event: DataCacheMsg) => void,
  eventFilter?: (event: DataCacheMsg) => boolean
): DataCacheOperations {
  const context = useDataCacheContext();
  const subscriptionIdRef = useRef<string | null>(null);

  // Subscribe to data events on mount
  useEffect(() => {
    if (onDataEvent) {
      subscriptionIdRef.current = context.subscribeToEvents(onDataEvent, eventFilter);
    }

    // Auto-unsubscribe on unmount
    return () => {
      if (subscriptionIdRef.current) {
        context.unsubscribeFromEvents(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
    };
  }, []); // Empty deps - subscribe once on mount

  return {
    // Request operations
    loadData: (entityType, viewName, entityId) => {
      context.publishRequest({ type: 'LoadDataView', entityType, viewName, entityId });
    },
    
    refreshData: (entityType, viewName, entityId) => {
      context.publishRequest({ type: 'RefreshDataView', entityType, viewName, entityId });
    },
    
    unloadData: (entityType, viewName, entityId) => {
      context.publishRequest({ type: 'UnloadDataView', entityType, viewName, entityId });
    },
    
    publishChange: (entityType, viewName, entityId, changePath, changeValue) => {
      context.publishRequest({ type: 'PublishChange', entityType, viewName, entityId, changePath, changeValue });
    },
    
    // Query operations (sync)
    queryData: context.queryData,
    queryDataByIdentifier: context.queryDataByIdentifier,
    isLocked: context.isLocked,
    
    // Direct access
    publishRequest: context.publishRequest,
    publishEvent: context.publishEvent,
    
    // Manual control
    unsubscribe: () => {
      if (subscriptionIdRef.current) {
        context.unsubscribeFromEvents(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
    },
  };
}
