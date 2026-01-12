import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  tabId?: string;
  bladeId?: string;
  disabled?: boolean;
}
export interface NavItemSubItem {
  containerNavItem: string;
  id: string;
  label: string;
  icon: React.ReactNode;
  tabId?: string;
  bladeId?: string;
  disabled?: boolean;
}

export interface ContextItem {
  id: string;
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
  label: string;
  businessKey: string;
  index?: number;
}

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  closable?: boolean;
}

export interface MenuItem {
  id: string;
  isContainer?: boolean;
  containerMenuId?: string;
  label: string;
  icon?: React.ReactNode;
  bladeId?: string;
  action?: () => void;
  disabled?: boolean;
}

export interface AppEvent {
  type: string;
  data: any;
}

export interface EventState {
  navItems: NavItem[];
  contextItems: ContextItem[];
  profileItems: MenuItem[];
}

export type UiContentChangeEventType = 'PROFILE_HOST' |'NAVIGATION_HOST' | 'CONTEXT_HOST';
export type UiContentChangeAction = 'ADD' | 'REMOVE';

export type UiContentChangeEventNavigationTarget = 'MENU' | 'SIDEBAR' | 'PROFILE' | 'CONTEXT_MENU' | 'QUICK_ACTIONS';

export type UiContentChangeEventContextTarget = 'TAB' | 'PAGE' | 'BLADE';

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