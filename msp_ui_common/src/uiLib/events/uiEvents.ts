// UI Event Messages - published by UI components and subsystems

import { UiMsgNames } from "../contexts/eventTypes.js";

//import { eventTypes } from "../contexts/index.js";

// TODO: move to ui_common as this is only for UI events
export type UiEventMessage<T = any> = {
  domain?: string
  messageType: UiMsgNames;
  payload: T;
  correlationId?: string;
  timestamp: number;
};

// User/session change events
export type UiUserSessionEvent = UiEventMessage<{
  userId: string;
  userName?: string;
  sessionId?: string;
}>;


// Data loaded events
export type UiDataCacheEvent<T = any> = UiEventMessage<{
  viewDataIdentifier: string;
  content: T;
  fromCache?: boolean;
}>;

export type UiNavigationEvent<T = any, C = any> = UiEventMessage<{
  viewDataIdentifier: string;
  viewDataContent: T;
  context?: C;
}>;

export type UiActivityEvent<T = any> = UiEventMessage<{
  namespace: string;
  activityName: string;
  version: string;
  result: T;
}>;

// Menu/UI interaction events
export type MenuItemClickEvent = UiEventMessage<{
  menuId: string;
  label: string;
  context?: any;
}>;


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


