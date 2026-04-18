import { UserSessionEvents, UserSessionEventsType } from './UserSessionContext.js';
import { DataCacheEvents, DataCacheEventsType} from './DataCacheContext.js';
import { ActivityEvents, ActivityEventsType } from './ActivityDispatchContext.js';
import { NavigationEvents, NavigationEventsType } from '../events/uiNavEventMsgTypes.js';
import { UiActivityEvent, UiDataCacheEvent, UiNavigationEvent, UiUserSessionEvent } from '../events/uiEvents.js';

// compound type acros all UI susbsystems for the event types that can be raised in the system
// used for strong typing of the messageType field in UiEventMessage
export const eventTypes = {
  UserSession: UserSessionEvents,
  DataCache: DataCacheEvents,
  Activity: ActivityEvents,
  Navigation: NavigationEvents,

}

// creaate union types for the messageType field of UiEventMessage for each event domain
//  based on the corresponding event type definitions
// this gives the combined benefit of using const strings as enums backed by strong typing
export type UiMsgUserSessionNames = {
  [K in keyof UserSessionEventsType]: K
}[keyof UserSessionEventsType];

export type UiMsgDataCacheNames = {
  [K in keyof DataCacheEventsType]: K
}[keyof DataCacheEventsType];

export type UiMsgActivityNames = {
  [K in keyof ActivityEventsType]: K
}[keyof ActivityEventsType];

export type UiMsgNavigationNames = {
  [K in keyof NavigationEventsType]: K
}[keyof NavigationEventsType];


// combined type for all message names across all event domains 
// this is the type that will be used for the messageType field in generic UiEventMessage
export type UiMsgNames = UiMsgUserSessionNames | UiMsgDataCacheNames | UiMsgActivityNames | UiMsgNavigationNames;

// for a given message name, look up the corresponding full event type
export type EventTypesByMsgName<T extends UiMsgNames> = 
  T extends UiMsgUserSessionNames ? UiUserSessionEvent :
  T extends UiMsgDataCacheNames ? UiDataCacheEvent :
  T extends UiMsgActivityNames ? UiActivityEvent :
  T extends UiMsgNavigationNames ? UiNavigationEvent :
  never;


