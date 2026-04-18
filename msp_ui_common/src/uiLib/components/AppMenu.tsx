import React, { useState, useEffect } from 'react';
import Menu from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import { MenuItem as AppMenuItem } from '../contexts/uiEventTypes.js';
import { useMenuDispatch } from '../contexts/MenuDispatchContext.js';
import { useUiEventPublisher } from '../contexts/UiEventContext.js';
import { NavigationEvents } from '../events/uiNavEventMsgTypes.js';

interface MenuProps {
  nameTag?: string;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  menuTarget?: string;
}

export const AppMenu: React.FC<MenuProps> = ({ anchorEl, open, onClose, menuTarget }) => {
  const [isOpen, setIsOpen] = useState(open);
  const { items } = useMenuDispatch();
  const { raiseUiEvent } = useUiEventPublisher();

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const visibleItems = items.filter(i =>
    !i.hidden &&
    i.menuTarget === menuTarget,
  );

  // Sequential-run grouping: consecutive items with the same groupId form a visual group.
  // A <Divider> is inserted between groups — never at the top or bottom.
  const groups: AppMenuItem[][] = [];
  let currentKey: string | null | undefined = undefined;
  for (const item of visibleItems) {
    const key = item.groupId ?? null;
    if (groups.length === 0 || key !== currentKey) {
      groups.push([item]);
      currentKey = key;
    } else {
      groups[groups.length - 1].push(item);
    }
  }

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const handleItemClick = (item: AppMenuItem) => {
    raiseUiEvent({
      messageType: NavigationEvents.ITEM_CLICK,
      payload: {
        menuId: item.id,
        label: item.label,
        action: typeof item.action === 'string' ? item.action : undefined,
        context: item.context,
      },
      timestamp: Date.now(),
    });
    handleClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={isOpen}
      onClose={handleClose}
      keepMounted
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {groups.map((group, gi) => (
        <div key={group[0].groupId ?? `__g${gi}`}>
          {gi > 0 && <Divider />}
          {group.map(item => (
            <MuiMenuItem
              key={item.id}
              disabled={item.disabled}
              onClick={() => handleItemClick(item)}
            >
              {item.icon && (
                <Box component="span" sx={{ mr: 1, display: 'inline-flex' }}>
                  {item.icon}
                </Box>
              )}
              {item.label}
            </MuiMenuItem>
          ))}
        </div>
      ))}
    </Menu>
  );
};