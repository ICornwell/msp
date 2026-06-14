import React from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import { NavTreeItem } from '../contexts/uiEventTypes.js'
import NavigationTree from './trees/NavigationTree.js';
import IconButton from '@mui/material/IconButton';
import { AppMenu } from './AppMenu.js';
import SettingsIcon from '@mui/icons-material/Settings';

interface SidebarProps {
  navItems: NavTreeItem[];
  isCollapsed: boolean;
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
//  openBlade: (contentId: string) => void;
}



const drawerWidth = 240;
const drawerCollapsedWidth = 56;

export const Sidebar: React.FC<SidebarProps> = ({
//  navItems,
  isCollapsed,
//  activeTabId,
//  onTabSelect,
//  openBlade
}) => {
  const [settingsMenuAnchorEl, setSettingsMenuAnchorEl] = React.useState<HTMLElement | null>(null);

  const handleSettingsMenuOpen = (event: Partial<MouseEvent>) => {
    console.log('Settings menu open', event.currentTarget, settingsMenuAnchorEl, event.currentTarget == settingsMenuAnchorEl);
    setSettingsMenuAnchorEl(event.currentTarget as HTMLElement);
  };

   const handleSettingsMenuClose = () => {
    setSettingsMenuAnchorEl(null);
  };


  return (
    <div style={{ marginTop: '64px' }}>
    <Drawer
      variant="permanent"
      sx={{
        
        height: 'calc(100% - 64px)',
        zIndex: 1200,
        width: isCollapsed ? drawerCollapsedWidth : drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isCollapsed ? drawerCollapsedWidth : drawerWidth,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          transition: theme => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      <Box sx={{ 
        overflow: 'auto',
        marginTop: '64px', // Height of the AppBar
      }}>
        <NavigationTree />
      </Box>
      <Box sx={{alignSelf: 'flex-end', padding: 1 }}>
          <IconButton
            key ="menu-button"
            edge="start"
            color="inherit"
            aria-label="toggle menu"
            onClick={(e) => handleSettingsMenuOpen(e as unknown as MouseEvent)}
            sx={{ mr: 2 }}
          >
            <SettingsIcon sx={{ display: { xs: 'block' } }} />
          </IconButton>
          <AppMenu
              nameTag='Settings Menu'
              key='menu1'
              anchorEl={settingsMenuAnchorEl}
              menuTarget='settings'
              open={Boolean(settingsMenuAnchorEl)}
              onClose={handleSettingsMenuClose} />
        </Box>
    </Drawer>
    </div>
  );
};