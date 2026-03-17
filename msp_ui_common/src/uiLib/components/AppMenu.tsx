import { useState, useEffect } from 'react';
import Menu from '@mui/material/Menu';

import MenuItem from '@mui/material/MenuItem';

import Box from '@mui/material/Box';

import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';

import FlightLandIcon from '@mui/icons-material/FlightLand';

import FlightIcon from '@mui/icons-material/Flight';

import { MenuItem as AppMenuItem } from '../contexts/uiEventTypes.js';

interface MenuProps {
  nameTag: string;
  anchorEl: HTMLElement | null;
  menuItems: AppMenuItem[];
  open: boolean;
  onClose: () => void;
  onMenuItemClick: (menuItem: AppMenuItem) => void;
}



export const AppMenu: React.FC<MenuProps> = ({
  nameTag, menuItems, anchorEl, open, onClose, onMenuItemClick
}) => {
  const [isOpen, setIsOpen] = useState(open);
  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  console.log('AppMenu', nameTag, anchorEl, open, isOpen);

  const handleProfileMenuClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const handleMenuItemClick = (menuItem: AppMenuItem) => {
    if (menuItem.bladeId) {
      // openBlade(menuItem.bladeId);
    }
    if (menuItem.action) {
      menuItem.action();
    }
    if (onMenuItemClick) {
      onMenuItemClick(menuItem);
    }
    handleProfileMenuClose();
  };

  const onLogout = () => {
    // Implement logout functionality
    console.log('Logout clicked');
  };


  return (
    <Menu
      anchorEl={anchorEl}
      open={isOpen}
      onClose={handleProfileMenuClose}
      keepMounted
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {(menuItems ?? []).map((item) => (
        <MenuItem
          key={item.id}
          onClick={() => handleMenuItemClick(item)}
        >
          {item.icon && (
            <Box component="span" sx={{ mr: 1, display: 'inline-flex' }}>
              {item.icon}
            </Box>
          )}
          {item.label}
        </MenuItem>
      ))}
      <MenuItem>
        <Box component="span" sx={{ mr: 1, display: 'inline-flex' }}>
          <FlightTakeoffIcon />
        </Box>
        'Test 1'
      </MenuItem>
      <MenuItem>
        <Box component="span" sx={{ mr: 1, display: 'inline-flex' }}>
          <FlightLandIcon />
        </Box>
        'Test 2'
      </MenuItem>
      <MenuItem onClick={() => onLogout}>
        <Box component="span" sx={{ mr: 1, display: 'inline-flex' }}>
          <FlightIcon />
        </Box>
        'Test 3'
      </MenuItem>
    </Menu>
  )
}