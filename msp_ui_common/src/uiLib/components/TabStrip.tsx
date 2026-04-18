import { useEffect, useRef } from 'react';
import Tabs from '@mui/material/Tabs';
import MuiTab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { Tab, usePresentationTabSet } from '../contexts/PresentationDispatchContext.js';

interface TabStripProps {
  // All tab state is driven by usePresentationTabSet context.
  // These props are optional fallbacks for standalone/storybook use only.
  tabs?: Tab[];
  activeTabId?: string | null;
  onTabChange?: (tabId: string) => void;
  onCloseTab?: (tabId: string) => void;
}

// Styled directly on MuiTab so MUI class specificity works correctly
const StyledMuiTab = styled(MuiTab)(({ theme }) => ({
  minHeight: 38,
  textTransform: 'none',
  fontWeight: 500,
  fontSize: theme.typography.fontSize,
  borderRadius: '8px 8px 0 0',
  marginRight: theme.spacing(0),
  padding: '0px', // `${theme.spacing(0.5)} ${theme.spacing(2)}`,
  color: theme.palette.text.secondary,
  backgroundColor: theme.palette.secondary.main,
  outline: `1px solid ${theme.palette.text.secondary}`,
  zIndex: 10,
  transition: 'background-color 0.15s ease, color 0.15s ease',
  '&:hover': {
    backgroundColor: `${theme.palette.primary.main}`,
    color: theme.palette.secondary.contrastText,
    zIndex: 1000,
  },
  '&&.Mui-selected': {
    color: theme.palette.secondary.contrastText,
    fontWeight: 600,
    backgroundColor: theme.palette.secondary.dark,
    boxShadow: `inset 0 -3px 0 ${theme.palette.primary.main}`,
    outline: `2px solid ${theme.palette.text.primary}`,
    outlineOffset: '-2px',
    zIndex: 100,
  },
}));

// Composed tab — close affordance uses a span, not a button, to avoid button-in-button
const StyledTab = (props: any) => {
  const { icon, label, closable, onClose, ...other } = props;
  return (
    <StyledMuiTab
      {...other}
      icon={icon ? <Box component="span" sx={{ mr: 1, display: 'inline-flex' }}>{icon}</Box> : undefined}
      iconPosition="start"
      label={
        <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
          {label}
          {closable && (
            <Box
              component="span"
              role="button"
              tabIndex={0}
              sx={{
                ml: 1,
                p: 0.25,
                display: 'inline-flex',
                borderRadius: '50%',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                if (onClose) onClose();
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  if (onClose) onClose();
                }
              }}
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </Box>
          )}
        </Box>
      }
    />
  );
};

export const TabStrip: React.FC<TabStripProps> = ({
  tabs: propTabs,
  activeTabId: propActiveTabId,
  onTabChange: propOnTabChange,
  onCloseTab: propOnCloseTab,
}) => {
  const tabset = usePresentationTabSet();

  const tabs = tabset.tabs.length > 0 ? tabset.tabs : (propTabs ?? []);
  const activeTabId = tabset.tabs.length > 0
    ? (tabset.tabs.find(tab => tab.isActive)?.id ?? null)
    : (propActiveTabId ?? null);
  const handleTabChange = (_event: any, newValue: string) => {
    tabset.activateTab(newValue);
    propOnTabChange?.(newValue);
  };
  const handleCloseTab = (tabId: string) => {
    tabset.closeTab(tabId);
    propOnCloseTab?.(tabId);
  };

  const tabsRef = useRef<HTMLDivElement>(null);

  // Scroll to active tab if not visible
  useEffect(() => {
    if (tabsRef.current && activeTabId) {
      const tabElement = tabsRef.current.querySelector(`[data-tab-id="${activeTabId}"]`) as HTMLElement;
      if (tabElement) {
        tabElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    }
  }, [activeTabId]);

  if (!tabs ||tabs.length === 0) {
    return null;
  }

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', minHeight: '38px' }}>
      <Tabs
        sx={{minHeight:'38px'}}
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
            label={tab.title}
            icon={tab.icon}
            closable={tab.isClosable}
            onClick={() => handleTabChange(null, tab.id)}
            onClose={() => handleCloseTab(tab.id)}
            data-tab-id={tab.id}
          />
        ))}
      </Tabs>
    </Box>
  );
};
