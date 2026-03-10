import { useEffect, useRef } from 'react';
import {
  Tabs,
  Tab as MuiTab,
  Box,
  IconButton,
  styled
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Tab } from '../contexts/uiEventTypes.js';

interface TabStripProps {
  tabs: Tab[];
  activeTabId: string | null;
  onTabChange: (tabId: string) => void;
}

// Custom styled Tab component that includes close button for closable tabs
const StyledTab = styled((props: any) => {
  const { icon, label, closable, onClose, ...other } = props;
  return (
    <MuiTab
      {...other}
      icon={icon ? <Box component="span" sx={{ mr: 1, display: 'inline-flex' }}>{icon}</Box> : undefined}
      iconPosition="start"
      label={
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {label}
          {closable && (
            <IconButton
              size="small"
              sx={{ ml: 1, p: 0.5 }}
              onClick={(e) => {
                e.stopPropagation();
                if (onClose) onClose();
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      }
    />
  );
})({
  minHeight: 48,
  textTransform: 'none',
});

export const TabStrip: React.FC<TabStripProps> = ({
  tabs,
  activeTabId,
  onTabChange
}) => {
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (_event: any, newValue: string) => {
    onTabChange(newValue);
  };

  const handleCloseTab = (tabId: string) => {
    // Handle closing a tab here
    console.log('Close tab:', tabId);
    // In a real implementation, you would dispatch a REMOVE_TAB action
  };

  // Scroll to active tab if not visible
  useEffect(() => {
    if (tabsRef.current && activeTabId) {
      const tabElement = tabsRef.current.querySelector(`[data-tab-id="${activeTabId}"]`) as HTMLElement;
      if (tabElement) {
        tabElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    }
  }, [activeTabId]);

  if (tabs.length === 0) {
    return null;
  }

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs
        value={activeTabId || false}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        ref={tabsRef}
      >
        {tabs.map((tab) => (
          <StyledTab
            key={tab.id}
            value={tab.id}
            label={tab.label}
            icon={tab.icon}
            closable={tab.closable}
            onClose={() => handleCloseTab(tab.id)}
            data-tab-id={tab.id}
          />
        ))}
      </Tabs>
    </Box>
  );
};
