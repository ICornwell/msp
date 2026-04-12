import React from 'react'

import { useDataCache } from '../hooks/useDataCache.js';
import { DataCacheMsg } from '../contexts/DataCacheContext.js';
import { isViewDataContent_Matching_ViewDataIndentifier, ViewDataIdentifier } from 'msp_common';

export type DataLoadingResult = {
  loadedData: any;
  isLoading: boolean;
  clearState: () => void;
}

export function useDataLoading(viewDataIdentifier?: ViewDataIdentifier, callback?:(data:any) => void) {
        const { loadData } = useDataCache();
        const [loadedData, setLoadedData] = React.useState<any>(null);
        const [isLoading, setIsLoading] = React.useState<boolean>(false);

        function clearState() {
          setLoadedData(null);
          setIsLoading(false);
        }
    
      useDataCache((datamsg: DataCacheMsg) => {
          if (datamsg.type === 'DataViewLoaded') {
            console.log('DataViewLoaded event received in Blade:', datamsg);
            setLoadedData(datamsg.viewDataContent);
            setIsLoading(false);
            if (callback) {
              setTimeout(() => callback(datamsg.viewDataContent), 0); // Ensure callback
              // is called after state updates
              
            }
          }
          
        }, (dataMsg: DataCacheMsg) => dataMsg.type === 'DataViewLoaded'
         && isViewDataContent_Matching_ViewDataIndentifier(dataMsg.viewDataContent, viewDataIdentifier),
        [viewDataIdentifier]); // Re-subscribe if the blade's viewDataIdentifier changes
    
        if (!isLoading && !loadedData && viewDataIdentifier) {
        setIsLoading(true);
        // Request the data view to be loaded - this will trigger a DataViewLoaded event that we subscribe to below
        loadData(viewDataIdentifier);
      }
      return { loadedData, isLoading, clearState };
    }