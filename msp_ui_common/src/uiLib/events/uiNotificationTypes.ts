import { NotificationEnvelope } from "../transports.js";
import { UiEventMessage } from "./uiEvents.js";

export type NotificationEventsType = {
  NOTIFICATION: 'NOTIFICATION',
} 

export type UiMsgNotificationNames = 'NOTIFICATION';

export type UiNotificationEvent = UiEventMessage<{
  notification: NotificationEnvelope;
}>;