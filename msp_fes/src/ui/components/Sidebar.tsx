import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Tooltip
} from '@mui/material';
import { NavItem } from '../types'

interface SidebarProps {
  navItems: NavItem[];
  isCollapsed: boolean;
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  openBlade: (contentId: string) => void;
}

const drawerWidth = 240;
const drawerCollapsedWidth = 56;

export const Sidebar: React.FC<SidebarProps> = ({
  navItems,
  isCollapsed,
  activeTabId,
  onTabSelect,
  openBlade
}) => {
  const handleNavItemClick = (item: NavItem) => {
    if (item.tabId) {
      onTabSelect(item.tabId);
    }
    if (item.bladeId) {
      openBlade(item.bladeId);
    }
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
        <List>
          {navItems.map((item) => (
            <ListItem 
              key={item.id} 
              disablePadding
              sx={{ display: 'block' }}
            >
              {isCollapsed ? (
                <Tooltip title={item.label} placement="right">
                  <ListItemButton
                    onClick={() => handleNavItemClick(item)}
                    selected={item.tabId === activeTabId}
                    sx={{
                      minHeight: 48,
                      justifyContent: 'center',
                      px: 2.5,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: 0,
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                  </ListItemButton>
                </Tooltip>
              ) : (
                <ListItemButton
                  onClick={() => handleNavItemClick(item)}
                  selected={item.tabId === activeTabId}
                  disabled={item.disabled}
                >
                  {item.icon && (
                    <ListItemIcon>
                      {item.icon}
                    </ListItemIcon>
                  )}
                  <ListItemText primary={item.label} />
                </ListItemButton>
              )}
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
    </div>
  );
};