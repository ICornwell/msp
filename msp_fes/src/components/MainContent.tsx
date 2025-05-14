import React from 'react';
import { Box } from '@mui/material';
import { Tab } from '../types.ts';

import { ReEngine } from '../renderEngine/components/ReEngine.tsx';
import { UserInfoLayout } from '../renderEngine/tests/userInfo/layout.tsx';

import { userData } from '../renderEngine/tests/userInfo/userData.ts';


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
      backgroundColor: (theme) => theme.palette.background.default
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
          <ReEngine UiPlan={UserInfoLayout().build()} sourceData={userData} />
        </Box>
      )}
    </Box>
  );
};