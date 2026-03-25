import { useEffect } from 'react';
import { useUiEventContext } from '../contexts/UiEventContext.js';
import { useEventContext } from '../contexts/UiContentContext.js';
import { MenuItem } from '../contexts/uiEventTypes.js';

/**
 * Bridges MenuRequest events from the UiEventBus into the UiContentContext
 * reducer, making behaviours' menu additions visible in the AppShell.
 *
 * Additions are tracked per-mount and automatically removed on unmount, so
 * unmounting a feature removes the menu items it added.
 *
 * The action closure captures `publish` so the existing TopBar/AppMenu
 * menuItem.action() call fires a MenuItemClick event back onto the bus.
 */
export function UiEventMenuBridge() {
  const { subscribe, unsubscribe, publish } = useUiEventContext();
  const { dispatch } = useEventContext();

  useEffect(() => {
    const added: string[] = [];

    const subscriptionId = subscribe({
      msgTypeFilter: (msg) => msg.messageType === 'MenuRequest',
      callback: (msg) => {
        const { requestType, menuId, label, enabled } = msg.payload ?? {};

        if (!menuId) return;

        switch (requestType) {
          case 'add': {
            const menuItem: MenuItem = {
              id: menuId,
              label: label ?? menuId,
              eventName: 'MENU',
              disabled: enabled === false,
              action: () =>
                publish({
                  messageType: 'MenuItemClick',
                  payload: { menuId, label: label ?? menuId },
                  timestamp: Date.now(),
                }),
            };
            dispatch({ type: 'PROFILE_HOST', action: 'ADD', payload: menuItem });
            if (!added.includes(menuId)) added.push(menuId);
            break;
          }
          case 'remove':
            dispatch({ type: 'PROFILE_HOST', action: 'REMOVE', payload: { id: menuId } as MenuItem });
            const idx = added.indexOf(menuId);
            if (idx >= 0) added.splice(idx, 1);
            break;

          case 'enable':
          case 'disable': {
            // Remove then re-add with updated disabled flag
            dispatch({ type: 'PROFILE_HOST', action: 'REMOVE', payload: { id: menuId } as MenuItem });
            const updatedItem: MenuItem = {
              id: menuId,
              label: label ?? menuId,
              eventName: 'MENU',
              disabled: requestType === 'disable',
              action: () =>
                publish({
                  messageType: 'MenuItemClick',
                  payload: { menuId, label: label ?? menuId },
                  timestamp: Date.now(),
                }),
            };
            dispatch({ type: 'PROFILE_HOST', action: 'ADD', payload: updatedItem });
            break;
          }

          case 'update': {
            dispatch({ type: 'PROFILE_HOST', action: 'REMOVE', payload: { id: menuId } as MenuItem });
            const updatedItem: MenuItem = {
              id: menuId,
              label: label ?? menuId,
              eventName: 'MENU',
              disabled: enabled === false,
              action: () =>
                publish({
                  messageType: 'MenuItemClick',
                  payload: { menuId, label: label ?? menuId },
                  timestamp: Date.now(),
                }),
            };
            dispatch({ type: 'PROFILE_HOST', action: 'ADD', payload: updatedItem });
            break;
          }
        }
      },
    });

    return () => {
      unsubscribe(subscriptionId);
      // Remove anything we added when this bridge unmounts
      for (const menuId of added) {
        dispatch({ type: 'PROFILE_HOST', action: 'REMOVE', payload: { id: menuId } as MenuItem });
      }
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
