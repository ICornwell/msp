import { useContext, createContext, useRef } from 'react';
import PubSub, { UiSubscription, UiPubSubMsg } from './UiPubSub.js'

export type UiEventContextType = {
  subscribe: (subscription:UiSubscription) => string;
  unsubscribe: (subscriptionId: string) => void
  /** @internal use raiseUiEvent / useUiEventPublisher from leaf components and subsystems */
  publish: (msg: any) => void
}

// Create context
export const UiEventContext = createContext<UiEventContextType>({
  subscribe:  (_subscription: UiSubscription) => '',
  unsubscribe: (_subscriptionId: string) => {},
  publish: (_msg: any) => { }
});

// UserSession provider component
export const UiEventProvider = ({ children }: { children: any }) => {
  const pubSubRef = useRef<UiEventContextType>(PubSub());

  return (
    <UiEventContext.Provider value={
      {
        subscribe: pubSubRef.current.subscribe,
        unsubscribe: pubSubRef.current.unsubscribe,
        publish: pubSubRef.current.publish
      }}>
     
        {children}
 
    </UiEventContext.Provider>
  );
};

// Custom hook to access the context — internal use only (Behaviour component)
export const useUiEventContext: () => UiEventContextType = () => useContext(UiEventContext);

/**
 * Hook for leaf UI components and subsystems to publish UIEvents.
 * This is the only publish surface outside of the Behaviour component.
 */
export function useUiEventPublisher(): { raiseUiEvent: (event: UiPubSubMsg) => void } {
  const { publish } = useContext(UiEventContext);
  return { raiseUiEvent: publish };
}