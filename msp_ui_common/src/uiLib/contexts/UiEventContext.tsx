import { useContext, createContext, useRef } from 'react';
import PubSub, { UiSubscription, UiPubSubMsg } from './UiPubSub.js'
import { UiEventMessage } from '../events/uiEvents.js';

export type UiEventContextType<ET = any> = {
  subscribe: (subscription:UiSubscription<UiEventMessage<ET>>) => string;
  unsubscribe: (subscriptionId: string) => void
  /** @internal use raiseUiEvent / useUiEventPublisher from leaf components and subsystems */
  publish: (msg: UiEventMessage<ET>) => void
  active: boolean; // indicates if the context is active (i.e. if the provider is mounted)
}

// Create context
export const UiEventContext = createContext<UiEventContextType>({
  subscribe:  (_subscription: UiSubscription<UiEventMessage>) => '',
  unsubscribe: (_subscriptionId: string) => {},
  publish: (_msg: UiEventMessage) => {},
  active: false
});

// UserSession provider component
export const UiEventProvider = ({ uiEventEnricher, children }
    : { uiEventEnricher?: (msg: any) => any, children: any }) => {
  if (!uiEventEnricher) {
    uiEventEnricher = (msg: any) => msg; // default to identity function if no enricher provided
    }
  const pubSubRef = useRef<UiEventContextType>(PubSub<UiEventMessage<any>>());

  const outerContext = useUiEventContext();
  if (outerContext && outerContext.active) {
    // pass through to the outer context, if there is one
    // and use the message enricher to add additional context to the messages
    //  (e.g. the viewDataIdentifier for the component that raised the event)
    pubSubRef.current.subscribe = outerContext.subscribe;
    pubSubRef.current.unsubscribe = outerContext.unsubscribe;
    pubSubRef.current.publish = (msg: any) => outerContext.publish(uiEventEnricher(msg));
  }

  return (
    <UiEventContext.Provider value={
      {
        subscribe: pubSubRef.current.subscribe,
        unsubscribe: pubSubRef.current.unsubscribe,
        publish: pubSubRef.current.publish,
        active: true
      }}>
     
        {children}
 
    </UiEventContext.Provider>
  );
};

// Custom hook to access the context — internal use only (Behaviour component)
export const useUiEventContext: <ET = any>() => UiEventContextType<ET> = () => useContext(UiEventContext);

/**
 * Hook for leaf UI components and subsystems to publish UIEvents.
 * This is the only publish surface outside of the Behaviour component.
 */
export function useUiEventPublisher<ET extends UiPubSubMsg>(): { raiseUiEvent: (event: ET) => void } {
  const { publish }: {publish: (msg: UiEventMessage<ET>) => void} = useContext(UiEventContext);
  return { raiseUiEvent: publish } as { raiseUiEvent: (event: ET) => void };
}