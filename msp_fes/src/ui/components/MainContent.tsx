import React from 'react';
import { Box } from '@mui/material';
import { Tab } from '../types.ts';

import { ReEngine } from '../renderEngine/components/ReEngine.tsx';
import { UserInfoLayout } from '../renderEngine/tests/userInfo/layoutVColumns.tsx';

import { userData } from '../renderEngine/tests/userInfo/userData.ts';
import { sampleVehicles } from '../components/tables/testData.ts';

import {TableDemoLayouts} from './tables/TableDemoLayouts.ts'


interface MainContentProps {
  tabs: Tab[];
  activeTabId: string | null;
}

export const MainContent: React.FC<MainContentProps> = ({
  tabs,
  activeTabId
}) => {
  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <Box sx={{
      flex: 1,
      p: 3,
      overflow: 'auto',
      backgroundColor: (theme) => {
        console.log(theme);
        return theme.palette.background.default;}
    }}>
      {activeTab ? (
        <Box className="tab-content">
          {activeTab.content}
        </Box>
      ) : (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'
        }}>
          <ReEngine UiPlan={UserInfoLayout()} sourceData={ sampleVehicles } />
          {/* <ReEngine UiPlan={TableDemoLayouts.VehicleFleet.layout()} sourceData={TableDemoLayouts.VehicleFleet.testData} /> */}
         {/*  <ReEngine UiPlan={TableDemoLayouts.TaskList.layout()} sourceData={TableDemoLayouts.TaskList.testData} />
          <ReEngine UiPlan={TableDemoLayouts.LayerPricing.layout()} sourceData={TableDemoLayouts.LayerPricing.testData} /> */}
          

        </Box>
      )}
    </Box>
  );
};