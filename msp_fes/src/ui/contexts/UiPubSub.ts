import { v4 } from 'uuid';

export type UiSPubSub = {
  subscribe: (subscription: UiSubscription) => string;
  unsubscribe: (subscriberId: string) => void;
  publish: (msg: UiPubSubMsg) => void;
}

export type UiPubSubMsg = {
  messageType: string,
  payload: any
}

export type UiSubscription = {
  callback: (msg: UiPubSubMsg) => void,
  msgTypeFilter?: (msg: UiPubSubMsg) => boolean
}

export default function PubSub(): UiSPubSub {
  const subscribers = new Map<string, {
    callback: (msg: UiPubSubMsg) => void,
    msgTypeFilter?: (msg: UiPubSubMsg) => boolean
  }>();

  function subscribe(subscription) {
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

  function publish(msg: UiPubSubMsg) {
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