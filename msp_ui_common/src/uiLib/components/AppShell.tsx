import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import { TopBar } from './TopBar.js';
import { Sidebar } from './Sidebar.js';
import { Blade } from './Blade.js';
import { TabStrip } from './TabStrip.js';
import { MainContent } from './MainContent.js';
import { useEventContext } from '../contexts/UiContentContext.js';
import EngineComponents from './engineComponents.js';
import { ReProvider } from '../renderEngine/contexts/ReEngineContext.js';
import { EngineComponentProvider } from '../renderEngine/contexts/ReComponentsContext.js';
import { ContextItem } from '../contexts/uiEventTypes.js';

const MainContainer = styled(Box)(({  }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  overflow: 'hidden',
  width: '100%',
}));

const ContentContainer = styled(Box)(({  }) => ({
  display: 'flex',
  flex: 1,
  overflow: 'hidden',
}));

export const AppShell: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  // const [isBladeOpen, setIsBladeOpen] = useState<boolean>(false);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  // const [configContent, setConfigContent] = useState<string | null>(null);

  const { state } = useEventContext();
  const { navItems, contextItems } = state;

  const tabs = contextItems.map((ci: ContextItem) => ({
    id: ci.id,
    label: ci.label,
    eventName: ci.eventName || 'TAB',
    content: null,
  }));

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // const openBlade = (contentId: string) => {
  //   setConfigContent(contentId);
  //   setIsBladeOpen(true);
  // };

  // const closeBlade = () => {
  //   setIsBladeOpen(false);
  //   setConfigContent(null);
  // };

  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
  };

  useEffect(() => {
    // Set first tab as active if tabs exist and no active tab
    if (tabs.length > 0 && !activeTabId) {
      setActiveTabId(tabs[0].id);
    }
  }, [tabs, activeTabId]);

  return (
    <ReProvider>
      <EngineComponentProvider>
        <EngineComponents />
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden'
        }}>
          <TopBar
            toggleSidebar={toggleSidebar}
            sidebarCollapsed={isSidebarCollapsed}
          />

          <ContentContainer>
            <Sidebar
              navItems={navItems}
              isCollapsed={isSidebarCollapsed}
              activeTabId={activeTabId}
              onTabSelect={handleTabChange}
              
            />

            <MainContainer>
              <TabStrip

              />

              <MainContent

              />
            </MainContainer>

            <Blade />
          </ContentContainer>
        </Box>
      </EngineComponentProvider>
    </ReProvider>
  );
};