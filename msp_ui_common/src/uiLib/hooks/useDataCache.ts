import { useEffect, useRef } from 'react';
import { useDataCacheContext, DataCacheMsg, DataRequest, DataEvent } from '../contexts/DataCacheContext.js';
import { ViewDataQueryIdentifier, ViewDataContent } from 'msp_common';

export type DataCacheOperations = {
  // Request operations (async via pub-sub)
  loadData: (viewDataQueryIdentifier: ViewDataQueryIdentifier) => void;
  refreshData: (viewDataContent: ViewDataContent) => void;
  unloadData: (viewDataContent: ViewDataContent) => void;
  publishChange: (viewDataContent: ViewDataContent, changePath?: string[], changeValue?: any) => void;
  
  // Query operations (sync from cache)
  queryData: (viewDataQueryIdentifier: ViewDataQueryIdentifier) => any | undefined;
  queryDataByIdentifier: (id: ViewDataQueryIdentifier) => any | undefined;
  isLocked: (viewDataQueryIdentifier: ViewDataQueryIdentifier) => boolean;
  
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
  eventFilter?: (event: DataCacheMsg) => boolean,
  deps?: any[],
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
  }, deps); // Use provided deps for effect

  return {
    // Request operations
    loadData: (viewDataQueryIdentifier: ViewDataQueryIdentifier) => {
      // Defer the publish to ensure it's not called during rendering,
      // which can cause issues with state updates in React
      setTimeout(() => { // Defer to avoid potential state update issues if called during render
        context.publishRequest({ type: 'LoadDataView', viewDataQueryIdentifier });
      }, 0);
    },
    
    refreshData: (viewDataContent) => {
      context.publishRequest({ type: 'RefreshDataView', viewDataContent });
    },
    
    unloadData: (viewDataContent) => {
      context.publishRequest({ type: 'UnloadDataView', viewDataContent });
    },
    
    publishChange: (viewDataContent, changePath, changeValue) => {
      context.publishRequest({ type: 'PublishChange', viewDataContent, changePath, changeValue });
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
