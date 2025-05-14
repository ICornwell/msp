import React, { useState, useEffect } from 'react';
import { Box, styled } from '@mui/material';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { Blade } from './Blade';
import { TabStrip } from './TabStrip';
import { MainContent } from './MainContent';
import { useEventContext } from '../contexts/EventContext';
import EngineComponents from './engineComponents';
import { ReProvider } from '../renderEngine/contexts/ReEngineContext';
import { EngineComponentProvider } from '../renderEngine/contexts/ReComponentsContext';

const MainContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  overflow: 'hidden',
  width: '100%',
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flex: 1,
  overflow: 'hidden',
}));

export const AppShell: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isBladeOpen, setIsBladeOpen] = useState<boolean>(false);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [configContent, setConfigContent] = useState<string | null>(null);

  const { state } = useEventContext();
  const { navItems, tabs, menuItems, profileMenuItems } = state;

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const openBlade = (contentId: string) => {
    setConfigContent(contentId);
    setIsBladeOpen(true);
  };

  const closeBlade = () => {
    setIsBladeOpen(false);
    setConfigContent(null);
  };

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
            menuItems={menuItems}
            profileMenuItems={profileMenuItems}
            openBlade={openBlade}
          />

          <ContentContainer>
            <Sidebar
              navItems={navItems}
              isCollapsed={isSidebarCollapsed}
              activeTabId={activeTabId}
              onTabSelect={handleTabChange}
              openBlade={openBlade}
            />

            <MainContainer>
              <TabStrip
                tabs={tabs}
                activeTabId={activeTabId}
                onTabChange={handleTabChange}
              />

              <MainContent
                tabs={tabs}
                activeTabId={activeTabId}
              />
            </MainContainer>

            <Blade
              isOpen={isBladeOpen}
              onClose={closeBlade}
              contentId={configContent}
            />
          </ContentContainer>
        </Box>
      </EngineComponentProvider>
    </ReProvider>
  );
};