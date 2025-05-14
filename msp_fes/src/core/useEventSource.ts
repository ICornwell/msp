import { v4 as uuidv4 } from 'uuid';
import { useRef, useEffect, } from 'preact/hooks';
import { options } from "preact";

export type subscribe<N,M> = (callback: ((msg: M) => void)) => N

export default function useEventSource<P, M>(
  subscribers: Map<string, ((msg: M) => void)>,
  notifiers: P) : subscribe<P,M> {
  const subscriberId = useRef<string>(uuidv4());
  const componentInstance = useRef<any>(null);
  
  // Store the current component instance during render
  // This captures the component context when the hook is invoked
  if (!componentInstance.current) {
    const currentOptions = options as any;
    const currentRender = currentOptions.__r;
    
    // We need to access the current component instance
    if (currentRender && currentRender.__c) {
      componentInstance.current = currentRender.__c;
    }
  }
  
  // Clean up subscription when component unmounts
  useEffect(() => {
    return () => {
      if (subscribers.has(subscriberId.current)) {
        subscribers.delete(subscriberId.current);
      }
    };
  }, [subscribers]);
  
  return function (callback: ((msg: M) => void)) {
    // Wrap the callback to ensure it runs with the proper component context
    const safeCallback = (msg: M) => {
      // Create a safe wrapper that preserves the component context
      const originalComponent = (options as any).__r?.__c;
      
      try {
        // Temporarily restore the component context
        if (componentInstance.current) {
          (options as any).__r = { __c: componentInstance.current };
        }
        
        // Call the original callback
        callback(msg);
      } finally {
        // Restore original context
        if (originalComponent) {
          (options as any).__r = { __c: originalComponent };
        }
      }
    };
    
    subscribers.set(subscriberId.current, safeCallback);
    return notifiers;
  };
}