import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';
import { MenuItem } from './uiEventTypes.js';

export type MenuDispatchRequest = {
  requestType: 'add' | 'remove' | 'enable' | 'disable' | 'hide' | 'unhide' | 'update';
  menuId: string;
  label?: string;
  action?: string;
  enabled?: boolean;
  hidden?: boolean;
  groupId?: string;
  menuTarget?: string;
  context?: any;
};

export type MenuDispatchContextType = {
  dispatch: (request: MenuDispatchRequest) => void;
  items: MenuItem[];
};

export const MenuDispatchContext = createContext<MenuDispatchContextType>({
  dispatch: () => {},
  items: [],
});

export function MenuDispatchProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<MenuItem[]>([]);

  const dispatch = useCallback((request: MenuDispatchRequest) => {
    setItems(prev => {
      switch (request.requestType) {
        case 'add': {
          const newItem: MenuItem = {
            id: request.menuId,
            label: request.label ?? request.menuId,
            eventName: 'MENU',
            action: request.action,
            disabled: request.enabled === false,
            hidden: request.hidden ?? false,
            groupId: request.groupId,
            menuTarget: request.menuTarget,
            context: request.context,
          };
          return prev.some(i => i.id === request.menuId)
            ? prev.map(i => i.id === request.menuId ? newItem : i)
            : [...prev, newItem];
        }
        case 'remove':
          return prev.filter(i => i.id !== request.menuId);
        case 'enable':
          return prev.map(i => i.id === request.menuId ? { ...i, disabled: false } : i);
        case 'disable':
          return prev.map(i => i.id === request.menuId ? { ...i, disabled: true } : i);
        case 'hide':
          return prev.map(i => i.id === request.menuId ? { ...i, hidden: true } : i);
        case 'unhide':
          return prev.map(i => i.id === request.menuId ? { ...i, hidden: false } : i);
        case 'update':
          return prev.map(i => i.id === request.menuId ? {
            ...i,
            ...(request.label !== undefined && { label: request.label }),
            ...(request.action !== undefined && { action: request.action }),
            ...(request.enabled !== undefined && { disabled: !request.enabled }),
            ...(request.hidden !== undefined && { hidden: request.hidden }),
            ...(request.groupId !== undefined && { groupId: request.groupId }),
            ...(request.context !== undefined && { context: request.context }),
          } : i);
        default:
          return prev;
      }
    });
  }, []);

  return (
    <MenuDispatchContext.Provider value={{ dispatch, items }}>
      {children}
    </MenuDispatchContext.Provider>
  );
}

/**
 * Used exclusively by Behaviours (via BehaviourDispatchProvider) to
 * dispatch menu calls. Not for use in leaf UI components.
 */
export function useMenuDispatch(): MenuDispatchContextType {
  return useContext(MenuDispatchContext);
}
