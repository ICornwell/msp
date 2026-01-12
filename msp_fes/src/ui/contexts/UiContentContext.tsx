import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { NavItem, EventState, UiContentChangeEvent, ContextItem, MenuItem } from './uiEventTypes.ts';

const initialState: EventState = {
  navItems: [],
  contextItems: [],
  profileItems: [],
};

// Event reducer to handle state changes
const eventReducer = (state: EventState, action: UiContentChangeEvent): EventState => {
  switch (action.type) {
    case 'PROFILE_HOST':
      switch (action.action) {
        case 'ADD':
          // Check if tab already exists
          if (state.profileItems.some((pi) => pi.id === action.payload.id)) {
            return state;
          }
          return {
            ...state,
            profileItems: [...state.profileItems, action.payload as MenuItem]
          };
        case 'REMOVE':
          return {
            ...state,
            profileItems: state.profileItems.filter((pi) => pi.id !== action.payload.id)
          };
      }
    case 'NAVIGATION_HOST':
      switch (action.action) {
        case 'ADD':
          // Check if tab already exists
          if (state.navItems.some((ni) => ni.id === action.payload.id)) {
            return state;
          }
          return {
            ...state,
            navItems: [...state.navItems, action.payload as NavItem]
          };
        case 'REMOVE':
          return {
            ...state,
            navItems: state.navItems.filter((ni) => ni.id !== action.payload.id)
          };
      }
    case 'CONTEXT_HOST': 
    switch (action.action) {
      case 'ADD':
          // Check if tab already exists
          if (state.contextItems.some((ci) => ci.id === action.payload.id)) {
            return state;
          }
          return {
            ...state,
            contextItems: [...state.contextItems, action.payload as ContextItem

            ]
          };
        case 'REMOVE':
          return {
            ...state,
            contextItems: state.contextItems.filter((ci) => ci.id !== action.payload.id)
          };
      };


    default:
      return state;
  }
};

// Create context
export const UiContentContext = createContext<{
  state: EventState;
  dispatch: React.Dispatch<UiContentChangeEvent>;
}>({
  state: initialState,
  dispatch: () => null
});

// Create provider component
interface UiContentProviderProps {
  children: ReactNode;
}

export const UiContentProvider: React.FC<UiContentProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(eventReducer, initialState);

  return (
    <UiContentContext.Provider value={{ state, dispatch }}>
      {children}
    </UiContentContext.Provider>
  );
};

// Create context hook
export const useEventContext = () => useContext(UiContentContext);