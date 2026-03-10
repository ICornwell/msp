// UI Event Messages - published by UI components and subsystems

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
    messageType: 'UserChanged',
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
    messageType: 'DataLoaded',
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
    messageType: 'MenuItemClick',
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

export function createInteractionEvent<T>(interactionType: string, target?: string, data?: T): InteractionEvent<T> {
  return {
    messageType: 'Interaction',
    payload: { interactionType, target, data },
    timestamp: Date.now(),
  };
}
