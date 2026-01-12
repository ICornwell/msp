import { useContext, createContext, useRef } from 'react';
import PubSub, { UiSubscription } from './UiPubSub.js'

export type UiEventContextType = {
  subscribe: (subscription:UiSubscription) => string;
  unsubscribe: (subscriptionId: string) => void
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

// Custom hook to access the context
export const useUiEventContext: () => UiEventContextType = () => useContext(UiEventContext);