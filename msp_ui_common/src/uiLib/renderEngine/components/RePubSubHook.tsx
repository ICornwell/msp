import { useEffect, useRef } from 'react';
import { ReSubscription } from '../data/ReEnginePubSub.js';

export type ReSubscriptionHandler = {
  subscribeToPubSub: (subscription: ReSubscription) => string;
  unsubscribeFromPubSub: (subscriberId: string) => void;
  unsubscribeFromAllPubSub: () => void;
}

export function useRePubSub() {
  const handlers = useRef<Set<ReSubscriptionHandler>>(new Set());
  const subscriptionSets = useRef<Record<string, Set<string>>>({});

  function createSubscriptionHandler(subscriptionHandler: ReSubscriptionHandler, hid: string): ReSubscriptionHandler {

    if (!subscriptionSets.current[hid]) {
      subscriptionSets.current[hid] = new Set();
    }
    const subscriptions = subscriptionSets.current[hid];

    function subscribeToPubSub(subscription: ReSubscription): string {
      const id = subscriptionHandler.subscribeToPubSub(subscription);
      subscriptions.add(id);
      return id;
    }

    function unsubscribeFromPubSub(subscriberId: string) {
      subscriptionHandler.unsubscribeFromPubSub(subscriberId);
      subscriptions.delete(subscriberId);
    }

    function unsubscribeFromAllPubSub() {

      subscriptionHandler.unsubscribeFromAllPubSub();

      subscriptions.forEach((subscriberId) => {
        subscriptionHandler.unsubscribeFromPubSub(subscriberId);
      });

      subscriptions.clear();
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