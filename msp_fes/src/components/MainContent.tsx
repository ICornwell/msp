import { FunctionalComponent } from 'preact';
import { Box, Typography } from '@mui/material';
import { Tab } from '../types.ts';

interface MainContentProps {
  tabs: Tab[];
  activeTabId: string | null;
}

export const MainContent: FunctionalComponent<MainContentProps> = ({
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
          <Typography color="text.secondary">
            No content to display. Please select a tab.
          </Typography>
        </Box>
      )}
    </Box>
  );
};