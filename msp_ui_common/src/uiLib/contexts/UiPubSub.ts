import { v4 } from 'uuid';

export type UiSPubSub<MsgType = UiPubSubMsg> = {
  subscribe: (subscription: UiSubscription<MsgType>) => string;
  unsubscribe: (subscriberId: string) => void;
  publish: (msg: MsgType) => void;
}

export type UiPubSubMsg = {
  messageType: string,
  payload: any
}

export type UiSubscription<MsgType = UiPubSubMsg> = {
  callback: (msg: MsgType) => void,
  msgTypeFilter?: (msg: MsgType) => boolean
}

export default function <MsgType = UiPubSubMsg>(): UiSPubSub<MsgType> {
  const subscribers = new Map<string, {
    callback: (msg: MsgType) => void,
    msgTypeFilter?: (msg: MsgType) => boolean
  }>();

  function subscribe(subscription: UiSubscription<MsgType>): string {
    const subscriberId = v4();
    const { callback, msgTypeFilter } = subscription;
    subscribers.set(subscriberId, { callback, msgTypeFilter });
    return subscriberId;
  }

  function unsubscribe(subscriberId: string) {
    const subscriberIdSubscribers = subscribers.get(subscriberId);
    if (subscriberIdSubscribers) {
      subscribers.delete(subscriberId);
    }
  }

  function publish(msg: MsgType) {
    subscribers.forEach(({ callback, msgTypeFilter }) => {
      try {
        if (!msgTypeFilter || msgTypeFilter(msg))
          callback(msg);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  return {
    subscribe,
    unsubscribe,
    publish,
  };
}