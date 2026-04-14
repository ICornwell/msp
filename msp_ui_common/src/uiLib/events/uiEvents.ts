// UI Event Messages - published by UI components and subsystems

import { eventTypes } from "../index.js";

// TODO: move to ui_common as this is only for UI events
export type UiEventMessage<T = any> = {
  messageType: string;
  payload: T;
  correlationId?: string;
  timestamp?: number;
};

// User/session change events
export type UserChangedEvent = UiEventMessage<{
  userId: string;
  userName?: string;
  sessionId?: string;
}>;

export function createUserChangedEvent(userId: string, userName?: string, sessionId?: string): UserChangedEvent {
  return {
    messageType: eventTypes.UserSession.USER_LOGGED_IN,
    payload: { userId, userName, sessionId },
    timestamp: Date.now(),
  };
}

// Data loaded events
export type DataLoadedEvent<T = any> = UiEventMessage<{
  dataType: string;
  dataKey: string;
  data: T;
  fromCache?: boolean;
}>;

export function createDataLoadedEvent<T>(dataType: string, dataKey: string, data: T, fromCache = false): DataLoadedEvent<T> {
  return {
    messageType: eventTypes.DataCache.DATA_LOADED,
    payload: { dataType, dataKey, data, fromCache },
    timestamp: Date.now(),
  };
}

// Menu/UI interaction events
export type MenuItemClickEvent = UiEventMessage<{
  menuId: string;
  label: string;
  context?: any;
}>;

export function createMenuItemClickEvent(menuId: string, label: string, context?: any): MenuItemClickEvent {
  return {
    messageType: eventTypes.Navigation.ITEM_CLICK,
    payload: { menuId, label, context },
    timestamp: Date.now(),
  };
}

// Generic interaction event
export type InteractionEvent<T = any> = UiEventMessage<{
  interactionType: string;
  target?: string;
  data?: T;
}>;



// Link click event - raised by linkClick strategy in UniversalInput
// Payload carries a named link identity and the data identifier to open
export type LinkClickEvent = UiEventMessage<{
  /** Logical name of the link — matched in Behaviour DSL .whenEventSatisfies() */
  linkName: string;
  /** Value that identifies the record to view — typically the cell's field value */
  viewDataIdentifier: string;
}>;

export function createLinkClickEvent(linkName: string, viewDataIdentifier: string): LinkClickEvent {
  return {
    messageType: eventTypes.Navigation.ITEM_CLICK,
    payload: { linkName, viewDataIdentifier },
    timestamp: Date.now(),
  };
}
