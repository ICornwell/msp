import React from 'react';
import { Tab } from '../contexts/PresentationDispatchContext.js';

export interface NavItem {
  eventName: string;
  id: string;
  label: string;
  icon: React.ReactNode;
  tabId?: string;
  bladeId?: string;
  disabled?: boolean;
}
export interface NavItemSubItem {
  containerNavItem: string;
  eventName: string;
  id: string;
  label: string;
  icon: React.ReactNode;
  tabId?: string;
  bladeId?: string;
  disabled?: boolean;
}

export interface ContextItem {
  id: string;
  eventName: string;
  uid: string;
  entityId: string;
  entityType: string;
  entityTypeLabel?: string;
  label: string;
  businessKey: string;
}
export interface ContextSubItem {
  id: string;
  uid: string;
  containerContextId: string;
  eventName: string;
  label: string;
  businessKey?: string;
  index?: number;
}

export interface ContextRelatedContext {
  id: string;
  uid: string;
  entityId: string;
  entityType: string;
  entityTypeLabel?: string;
  containerContextId: string;
  eventName: string;
  label: string;
  businessKey: string;
  index?: number;
}

// export interface Tab {
//   id: string;
//   label: string;
//   eventName: string;
//   icon?: React.ReactNode;
//   content: React.ReactNode;
//   closable?: boolean;
// }

export interface MenuItem {
  id: string;
  isContainer?: boolean;
  containerMenuId?: string;
  label: string;
  icon?: React.ReactNode;
  bladeId?: string;
  eventName: string;
  action?: string | (() => void);
  disabled?: boolean;
  hidden?: boolean;
  groupId?: string;
  menuTarget?: string;
  context?: any;
}

export interface AppEvent {
  type: string;
  data: any;
}

export interface EventState {
  navItems: NavItem[];
  contextItems: ContextItem[];
}

export type EventMsg = NavItem | NavItemSubItem | ContextSubItem | ContextRelatedContext | MenuItem;

export type UiContentChangeEventType = 'NAVIGATION_HOST' | 'CONTEXT_HOST';
export type UiContentChangeAction = 'ADD' | 'REMOVE';

export type UiContentChangeEventNavigationTarget = 'MENU' | 'SIDEBAR' | 'PROFILE' | 'CONTEXT_MENU' | 'QUICK_ACTIONS';

export type UiContentChangeEventContextTarget = 'TAB' | 'PAGE' | 'BLADE';

export type UiChangeEventName = UiContentChangeEventNavigationTarget | UiContentChangeEventContextTarget

export const EventMessageTypeMapping: Record<UiChangeEventName, Partial<EventMsg>> = {
  'MENU': { eventName: 'MENU' } as Partial<MenuItem>,
  'SIDEBAR': {eventName: 'SIDEBAR'} as Partial<NavItem>,
  'PROFILE': { eventName: 'PROFILE' } as Partial<NavItem>,
  'QUICK_ACTIONS': { eventName: 'QUICK_ACTIONS' } as Partial<NavItem>,
  'CONTEXT_MENU': { eventName: 'CONTEXT_MENU' } as Partial<ContextItem>,
  'TAB': { eventName: 'TAB' } as Partial<Tab>,
  'BLADE': { eventName: 'BLADE' } as Partial<Tab>,
  'PAGE': { eventName: 'PAGE' } as Partial<Tab>,
}

export type EventMsgForName<T extends UiChangeEventName> = 
  typeof EventMessageTypeMapping[T] extends Partial<infer U> ? U : never;

export type UiContentChangeEvent =
  {
    type: 'PROFILE_HOST';
    action: UiContentChangeAction;
    payload: MenuItem
  }
  |{
    type: 'NAVIGATION_HOST';
    action: UiContentChangeAction;
    preferredTarget: UiContentChangeEventNavigationTarget | string
    fallbackTarget?: UiContentChangeEventNavigationTarget
    payload: NavItem
  }
  | {
    type: 'CONTEXT_HOST';
    action: UiContentChangeAction;
    preferredTarget: UiContentChangeEventContextTarget | string
    fallbackTarget?: UiContentChangeEventContextTarget
    payload: ContextItem
  }