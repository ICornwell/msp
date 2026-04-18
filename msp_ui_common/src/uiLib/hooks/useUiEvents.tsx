import { useEffect } from 'react';
import { useUiEventContext } from '../contexts/UiEventContext.js';
import { UiSubscription } from '../contexts/UiPubSub.js';
import { UiEventMessage } from '../events/uiEvents.js';

export type UiEventUnsubscribe = {
  unsubscribe: () => void;
}

export function useUiEventSubscriber(subscription: UiSubscription<UiEventMessage<any>>): UiEventUnsubscribe {
  
  const {subscribe, unsubscribe} = useUiEventContext();

  const subscriptionId =subscribe(subscription);

  useEffect(() => {
    return () => {
      unsubscribe(subscriptionId);
    };
  }, []);

  return {
    
    unsubscribe: () => {
      unsubscribe(subscriptionId);
    }
  };
}