import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  tabId?: string;
  bladeId?: string;
  disabled?: boolean;
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
  tabs: Tab[];
  menuItems: MenuItem[];
  profileMenuItems: MenuItem[];
}

export type EventAction = 
  | { type: 'ADD_NAV_ITEM'; payload: NavItem }
  | { type: 'REMOVE_NAV_ITEM'; payload: string }
  | { type: 'ADD_TAB'; payload: Tab }
  | { type: 'REMOVE_TAB'; payload: string }
  | { type: 'ADD_MENU_ITEM'; payload: MenuItem }
  | { type: 'REMOVE_MENU_ITEM'; payload: string }
  | { type: 'ADD_PROFILE_MENU_ITEM'; payload: MenuItem }
  | { type: 'REMOVE_PROFILE_MENU_ITEM'; payload: string };