import { v4 } from 'uuid';
import { ReSubscriptionHandler } from '../components/RePubSubHook';

export type RePubSub = {
  subscribe: (subscription: ReSubscription) => string;
  unsubscribe: (subscriberId: string) => void;
  publish: (msg: RePubSubMsg) => void;
}

export type RePubSubMsg = {
        messageType: string,
        recordSubscriberId: string,
        path: string
        propertyKey: string | number | symbol,
        newValue: any,
        oldValue: any,
        subscriptionHandler: ReSubscriptionHandler,
        setter: (newValue: any) => void
  }

export type ReSubscription = {
  callback: (msg: RePubSubMsg) => void, 
  msgTypeFilter?: (msg: RePubSubMsg) => boolean
}

export default function PubSub(): RePubSub {
  const subscribers = new Map<string, {callback: (msg: RePubSubMsg) => void,
     msgTypeFilter?: (msg: RePubSubMsg) => boolean}>();

  function subscribe(subscription) {
    const subscriberId = v4();
    const {callback, msgTypeFilter} = subscription;
    subscribers.set(subscriberId, {callback, msgTypeFilter});
    return subscriberId;
  }

  function unsubscribe(subscriberId: string) {
    const subscriberIdSubscribers = subscribers.get(subscriberId);
    if (subscriberIdSubscribers) {
      subscribers.delete(subscriberId);
    }
  }

  function publish(msg: RePubSubMsg) {

        subscribers.forEach(({callback, msgTypeFilter}) => {
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