import React from 'react';
import Box from '@mui/material/Box';
import { Tab } from '../contexts/PresentationDispatchContext.js';

import { ReEngine } from '../renderEngine/components/ReEngine.js';

import { usePresentationCurrentTab } from '../contexts/PresentationDispatchContext.js';

import { useDataLoading } from '../hooks/useDataLoading.js';


interface MainContentProps {
  tabs?: Tab[];
  activeTabId?: string | null;
}

export const MainContent: React.FC<MainContentProps> = ({
  tabs,
  activeTabId
}) => {

  const contextTab = usePresentationCurrentTab();
  // can support supplied as well as context tabs - if both supplied, context takes precedence
  const { tab: currentTab, setTabTitle } = contextTab 
  || {currentTab :(tabs ?  tabs.find(tab => tab.id === activeTabId): undefined ),setTabTitle: () => null};

  let { isLoading, loadedData } = useDataLoading(currentTab?.content.viewDataIdentifier, setTitle);

  function setTitle(data:any) {
    loadedData = data; // ensure we have the latest data for title generation - this is needed because the currentTab content may not have had the data when it was rendered, but will have it by the time we get here after loading  
    isLoading = false; // ensure loading state is updated in case it was still true when we got here - this can happen if the data loads after the initial render but before we get here, so we need to make sure we reflect that in the state for correct rendering of the content and title
    if(setTabTitle)
      if (typeof currentTab?.title === 'function') {
        const newTitle = currentTab.title(data);
        setTabTitle(newTitle);
      } else if (typeof currentTab?.title === 'string') {
        setTabTitle(currentTab.title);
      } else {
        setTabTitle('Untitled');
      }
  }

  return (
    <Box sx={{
      flex: 1,
      p: 3,
      overflow: 'auto',
      backgroundColor: (theme) => {
        console.log(theme);
        return theme.palette.background.default;
      }
    }}>
      {isLoading}
      {(!currentTab || isLoading) ? (
        <Box className="tab-content">
          {isLoading ? 'Loading...' : 'No content to display'}
        </Box>
      ) : ( (!loadedData?.content)?(
        <Box className="tab-content">
          {`No data`}
        </Box>
      ) : (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'
        }}>
          <ReEngine UiPlan={currentTab?.content.uiPlan} sourceData={loadedData.content} />
          {/* <ReEngine UiPlan={TableDemoLayouts.VehicleFleet.layout()} sourceData={TableDemoLayouts.VehicleFleet.testData} /> */}
          {/*  <ReEngine UiPlan={TableDemoLayouts.TaskList.layout()} sourceData={TableDemoLayouts.TaskList.testData} />
          <ReEngine UiPlan={TableDemoLayouts.LayerPricing.layout()} sourceData={TableDemoLayouts.LayerPricing.testData} /> */}


        </Box>
      ))}
    </Box>
  );
};