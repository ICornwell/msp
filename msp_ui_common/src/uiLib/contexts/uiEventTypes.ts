import React from 'react';
import { Tab } from '../contexts/PresentationDispatchContext.js';

export interface ContextOwnedElement {
  contextOwnerId: string;
}

export interface EventState {
  navItems: NavTreeItem[];
  contextItems: ContextItem[];
}

export interface NavTreeItem extends ContextOwnedElement {
  containerNavItem?: string;
  eventName: string;
  id: string;
  label: string;
  icon: React.ReactNode;
  action?: string | (() => void);
  tabId?: string;
  bladeId?: string;
  disabled?: boolean;
  hidden?: boolean;
  groupId?: string;
  navItemTarget?: string;
  context?: any;
  children: NavTreeItem[];
}

export interface ContextItem extends ContextOwnedElement {
  id: string;
  eventName: string;
  uid: string;
  entityId: string;
  entityType: string;
  entityTypeLabel?: string;
  label: string;
  businessKey: string;
}
export interface ContextSubItem extends ContextOwnedElement {
  id: string;
  uid: string;
  containerContextId: string;
  eventName: string;
  label: string;
  businessKey?: string;
  index?: number;
}

export interface ContextRelatedContext extends ContextOwnedElement {
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

export interface MenuItem extends ContextOwnedElement {
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



export type EventMsg = NavTreeItem | ContextSubItem | ContextRelatedContext | MenuItem;

export type UiContentChangeAction = 'ADD' | 'REMOVE';

export type UiContentChangeEventNavigationTarget = 'MENU' | 'NAVTREE' | 'PROFILE' | 'CONTEXT_MENU' | 'QUICK_ACTIONS';

export type UiContentChangeEventContextTarget = 'TAB' | 'PAGE' | 'BLADE';

export type UiChangeEventName = UiContentChangeEventNavigationTarget | UiContentChangeEventContextTarget

export const EventMessageTypeMapping: Record<UiChangeEventName, Partial<EventMsg>> = {
  'MENU': { eventName: 'MENU' } as Partial<MenuItem>,
  'NAVTREE': { eventName: 'NAVTREE' } as Partial<NavTreeItem>,
  'PROFILE': { eventName: 'PROFILE' } as Partial<NavTreeItem>,
  'QUICK_ACTIONS': { eventName: 'QUICK_ACTIONS' } as Partial<NavTreeItem>,
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
  | {
    type: 'NAVIGATION_HOST';
    action: UiContentChangeAction;
    preferredTarget: UiContentChangeEventNavigationTarget | string
    fallbackTarget?: UiContentChangeEventNavigationTarget
    payload: NavTreeItem
  }
  | {
    type: 'CONTEXT_HOST';
    action: UiContentChangeAction;
    preferredTarget: UiContentChangeEventContextTarget | string
    fallbackTarget?: UiContentChangeEventContextTarget
    payload: ContextItem
  }
