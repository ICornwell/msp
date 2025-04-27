import { createContext } from 'preact';
import { useContext, useReducer } from 'preact/hooks';
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
        navItems: state.navItems.filter((item:any) => item.id !== action.payload)
      };
    case 'ADD_TAB':
      // Check if tab already exists
      if (state.tabs.some((tab:any) => tab.id === (action.payload as Tab).id)) {
        return state;
      }
      return {
        ...state,
        tabs: [...state.tabs, action.payload as Tab]
      };
    case 'REMOVE_TAB':
      return {
        ...state,
        tabs: state.tabs.filter((tab:any) => tab.id !== action.payload)
      };
    case 'ADD_MENU_ITEM':
      return {
        ...state,
        menuItems: [...state.menuItems, action.payload as MenuItem]
      };
    case 'REMOVE_MENU_ITEM':
      return {
        ...state,
        menuItems: state.menuItems.filter((item: any) => item.id !== action.payload)
      };
      case 'ADD_PROFILE_MENU_ITEM':
        return {
          ...state,
          menuItems: [...state.profileMenuItems, action.payload as MenuItem]
        };
      case 'REMOVE_PROFILE_MENU_ITEM':
        return {
          ...state,
          menuItems: state.profileMenuItems.filter((item: any) => item.id !== action.payload)
        };
    default:
      return state;
  }
};

// Create context
export const EventContext = createContext<{
  state: EventState;
  dispatch: (action: EventAction) => void;
  publish: (event: AppEvent) => void;
  subscribe: (eventType: string, callback: (data: any) => void) => () => void;
}>({
  state: initialState,
  dispatch: () => {},
  publish: () => {},
  subscribe: () => () => {}
});

// Event provider component
export const EventProvider = ({ children }: { children: any }) => {
  const [state, dispatch] = useReducer(eventReducer, initialState);
  const eventListeners: Record<string, Array<(data: any) => void>> = {};

  // Publish an event to all subscribers
  const publish = (event: AppEvent) => {
    if (eventListeners[event.type]) {
      eventListeners[event.type].forEach(listener => listener(event.data));
    }
  };

  // Subscribe to an event type
  const subscribe = (eventType: string, callback: (data: any) => void) => {
    if (!eventListeners[eventType]) {
      eventListeners[eventType] = [];
    }
    eventListeners[eventType].push(callback);

    // Return unsubscribe function
    return () => {
      eventListeners[eventType] = eventListeners[eventType].filter(
        listener => listener !== callback
      );
    };
  };

  return (
    <EventContext.Provider value={{ state, dispatch, publish, subscribe }}>
      {children}
    </EventContext.Provider>
  );
};

// Custom hook to access the context
export const useEventContext = () => useContext(EventContext);