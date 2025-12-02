import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { NavItem, Tab, MenuItem, AppEvent, EventState, EventAction } from '../types.ts';

const initialState: EventState = {
  navItems: [],
  tabs: [],
  menuItems: [],
  profileMenuItems: []
};

// Event reducer to handle state changes
const eventReducer = (state: EventState, action: EventAction): EventState => {
  switch (action.type) {
    case 'ADD_NAV_ITEM':
      return {
        ...state,
        navItems: [...state.navItems, action.payload as NavItem]
      };
    case 'REMOVE_NAV_ITEM':
      return {
        ...state,
        navItems: state.navItems.filter((item) => item.id !== action.payload)
      };
    case 'ADD_TAB':
      // Check if tab already exists
      if (state.tabs.some((tab) => tab.id === (action.payload as Tab).id)) {
        return state;
      }
      return {
        ...state,
        tabs: [...state.tabs, action.payload as Tab]
      };
    case 'REMOVE_TAB':
      return {
        ...state,
        tabs: state.tabs.filter((tab) => tab.id !== action.payload)
      };
    case 'ADD_MENU_ITEM':
      return {
        ...state,
        menuItems: [...state.menuItems, action.payload as MenuItem]
      };
    case 'REMOVE_MENU_ITEM':
      return {
        ...state,
        menuItems: state.menuItems.filter((item) => item.id !== action.payload)
      };
      case 'ADD_PROFILE_MENU_ITEM':
        return {
          ...state,
          profileMenuItems: [...state.profileMenuItems, action.payload as MenuItem]
        };
      case 'REMOVE_PROFILE_MENU_ITEM':
        return {
          ...state,
          profileMenuItems: state.profileMenuItems.filter((item) => item.id !== action.payload)
        };
    default:
      return state;
  }
};

// Create context
export const EventContext = createContext<{
  state: EventState;
  dispatch: React.Dispatch<EventAction>;
}>({
  state: initialState,
  dispatch: () => null
});

// Create provider component
interface EventProviderProps {
  children: ReactNode;
}

export const EventProvider: React.FC<EventProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(eventReducer, initialState);

  return (
    <EventContext.Provider value={{ state, dispatch }}>
      {children}
    </EventContext.Provider>
  );
};

// Create context hook
export const useEventContext = () => useContext(EventContext);