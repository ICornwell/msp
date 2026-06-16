import React from 'react'

import { useDataCache } from '../hooks/useDataCache.js';
import { DataCacheMsg } from '../contexts/DataCacheContext.js';
import { isViewDataContent_Matching_ViewDataIdentifier, ViewDataIdentifier,
  viewDataIdentifier_Match } from 'msp_common';

export type DataLoadingResult = {
  loadedData: any;
  isLoading: boolean;
  clearState: () => void;
}

export function useDataLoading(
  viewDataIdentifier?: ViewDataIdentifier,
  callback?: (data: any) => void,
  updateWhenDataChanges: boolean = false,
) {
  const { loadData } = useDataCache();
  const [loadedData, setLoadedData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [currentViewDataIdentifier, setCurrentViewDataIdentifier] = React.useState<ViewDataIdentifier | undefined>(undefined);

  function clearState() {
    setLoadedData(null);
    setIsLoading(false);
  }

  if (!viewDataIdentifier_Match(viewDataIdentifier, currentViewDataIdentifier)) {
    setCurrentViewDataIdentifier(viewDataIdentifier);
    clearState();
  }

  useDataCache((datamsg: DataCacheMsg) => {
    if (datamsg.type === 'DataViewLoaded' || (updateWhenDataChanges && datamsg.type === 'DataViewChanged')) {
      setLoadedData(datamsg.viewDataContent);
      setIsLoading(false);
      if (callback) {
        setTimeout(() => callback(datamsg.viewDataContent), 0); // Ensure callback
        // is called after state updates

      }
    }

  }, (dataMsg: DataCacheMsg) =>
    (dataMsg.type === 'DataViewLoaded' || (updateWhenDataChanges && dataMsg.type === 'DataViewChanged'))
    && isViewDataContent_Matching_ViewDataIdentifier(dataMsg.viewDataContent, viewDataIdentifier),
    [viewDataIdentifier, updateWhenDataChanges]); // Re-subscribe if binding mode changes

  if (!isLoading && !loadedData && viewDataIdentifier) {
    setIsLoading(true);
    // Request the data view to be loaded - this will trigger a DataViewLoaded event that we subscribe to below
    loadData(viewDataIdentifier);
  }
  return { loadedData, isLoading, clearState };
}