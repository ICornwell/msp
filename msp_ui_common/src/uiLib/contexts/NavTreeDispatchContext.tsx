import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';
import { NavTreeItem } from './uiEventTypes.js';
import { ContextOwnedItem } from './contextOwnedItem.js';
import { v4 as uuidv4 } from 'uuid';


export type NavTreeDispatchRequest = {
  requestType: 'add' | 'remove' | 'enable' | 'disable' | 'hide' | 'unhide' | 'update'| 'clearContextOwner';
  navItemId?: string;
  label?: string;
  action?: string;
  enabled?: boolean;
  hidden?: boolean;
  groupId?: string;
  navItemTarget?: string;
  icon?: React.ReactNode;
  containerNavItem?: string;
  context?: any;
} & ContextOwnedItem;

export type NavTreeDispatchContextType = {
  dispatch: (request: NavTreeDispatchRequest) => void;
  items: NavTreeItem[];
};

export const NavTreeDispatchContext = createContext<NavTreeDispatchContextType>({
  dispatch: () => {},
  items: [],
});

export function NavTreeDispatchProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NavTreeItem[]>([]);

  const dispatch = useCallback((request: NavTreeDispatchRequest) => {
    setItems(prev => {
      switch (request.requestType) {
        case 'clearContextOwner':
          return recursiveClearContextOwner(prev, request.contextOwnerId);
        case 'add': {
          const newItem: NavTreeItem = {
            contextOwnerId: request.contextOwnerId,
            containerNavItem: request.containerNavItem,
            id: request.navItemId ?? uuidv4(),
            label: request.label ?? request.navItemId ?? 'Unnamed Nav Item',
            eventName: 'MENU',
            icon: request.icon,
            action: request.action,
            disabled: request.enabled === false,
            hidden: request.hidden ?? false,
            groupId: request.groupId,
            navItemTarget: request.navItemTarget,
            context: request.context,
            children: [],
          };
          return recursiveAddNavItem(prev, newItem);
        }
        case 'remove':
          if (!request.navItemId) return prev;
          return recursiveRemoveNavItem(prev, request.navItemId);
        case 'enable':
          if (!request.navItemId) return prev;
          return prev.map(i => i.id === request.navItemId ? { ...i, disabled: false } : i);
        case 'disable':
          if (!request.navItemId) return prev;
          return prev.map(i => i.id === request.navItemId ? { ...i, disabled: true } : i);
        case 'hide':
          if (!request.navItemId) return prev;
          return prev.map(i => i.id === request.navItemId ? { ...i, hidden: true } : i);
        case 'unhide':
          if (!request.navItemId) return prev;
          return prev.map(i => i.id === request.navItemId ? { ...i, hidden: false } : i);
        case 'update':
          if (!request.navItemId) return prev;
          return prev.map(i => i.id === request.navItemId ? {
            ...i,
            ...(request.label !== undefined && { label: request.label }),
            ...(request.action !== undefined && { action: request.action }),
            ...(request.enabled !== undefined && { disabled: !request.enabled }),
            ...(request.hidden !== undefined && { hidden: request.hidden }),
            ...(request.groupId !== undefined && { groupId: request.groupId }),
            ...(request.context !== undefined && { context: request.context }),
            ...(request.icon !== undefined && { icon: request.icon }),
          } : i);
        default:
          return prev;
      }
    });
  }, []);

  return (
    <NavTreeDispatchContext.Provider value={{ dispatch, items }}>
      {children}
    </NavTreeDispatchContext.Provider>
  );
}

function recursiveAddNavItem(items: NavTreeItem[], newItem: NavTreeItem): NavTreeItem[] {
  return items.map(i => {
    if (i.id === newItem.containerNavItem) {
      const children = i.children ? [...i.children, newItem] : [newItem];
      return { ...i, children };
    } else if (i.children) {
      return { ...i, children: recursiveAddNavItem(i.children, newItem) };
    } else {
      return i;
    }
  });
}

function recursiveRemoveNavItem(items: NavTreeItem[], id: string): NavTreeItem[] {
  return items
    .filter(i => i.id !== id)
    .map(i => i.children ? { ...i, children: recursiveRemoveNavItem(i.children, id) } : i);
}

function recursiveClearContextOwner(items: NavTreeItem[], contextOwnerId: string): NavTreeItem[] {
  return items
    .filter(i => i.contextOwnerId !== contextOwnerId)
    .map(i => i.children ? { ...i, children: recursiveClearContextOwner(i.children, contextOwnerId) } : i);
}

/**
 * Used exclusively by Behaviours (via BehaviourDispatchProvider) to
 * dispatch menu calls. Not for use in leaf UI components.
 */
export function useNavTreeDispatch(): NavTreeDispatchContextType {
  return useContext(NavTreeDispatchContext);
}
