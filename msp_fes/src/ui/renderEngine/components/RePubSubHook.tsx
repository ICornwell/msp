import { useEffect, useRef } from 'react';
import { ReSubscription } from '../data/ReEnginePubSub';

export type ReSubscriptionHandler = {
  subscribeToPubSub: (subscription: ReSubscription) => string;
  unsubscribeFromPubSub: (subscriberId: string) => void;
  unsubscribeFromAllPubSub: () => void;
}

export function useRePubSub() {
  const handlers = useRef<Set<ReSubscriptionHandler>>(new Set());

function createSubscriptionHandler(subscriptionHandler: ReSubscriptionHandler): ReSubscriptionHandler {

const subscriptions = useRef<Set<string>>(new Set());

  function subscribeToPubSub(subscription: ReSubscription): string {
    const id = subscriptionHandler.subscribeToPubSub(subscription);
    subscriptions.current.add(id);
    return id;
  }

  function unsubscribeFromPubSub(subscriberId: string) {
    subscriptionHandler.unsubscribeFromPubSub(subscriberId);
    subscriptions.current.delete(subscriberId);
  }

  function unsubscribeFromAllPubSub() {
    
      subscriptionHandler.unsubscribeFromAllPubSub();
    
      subscriptions.current.forEach((subscriberId) => {
        subscriptionHandler.unsubscribeFromPubSub(subscriberId);
      });
    
    subscriptions.current.clear();
  }

  const handler: ReSubscriptionHandler = {
    subscribeToPubSub,
    unsubscribeFromPubSub,
    unsubscribeFromAllPubSub
  };

  handlers.current.add(handler);

  return handler;
}

function unsubscribeAllHandlers() {
    
      handlers.current.forEach((handler) => {
        handler.unsubscribeFromAllPubSub();
      });
    
    handlers.current.clear();
  }

  useEffect(() => {
    return () => {
      unsubscribeAllHandlers();
    };
  }, []);

  return {
    createSubscriptionHandler,
    unsubscribeAllHandlers
  };
}