import { useEffect, useState } from 'react';

import { behaviourConfig } from './behaviourConfig.js';
import { useEngineComponentsContext } from '../renderEngine/contexts/ReComponentsContext.js';
import { useUiEventContext } from '../contexts/UiEventContext.js';
import { useDataCache } from '../hooks/useDataCache.js';
import { useBehaviourHandlerRegistry } from './BehaviourHandlerRegistryContext.js';

export type BehaviourArg<T> = T | ((event: any, data: any) => T);

type BehaviourProps = {
  config: behaviourConfig;
  initialData?: any;
};

export function Behaviour({ config, initialData }: BehaviourProps) {
  const { addComponent, removeComponent } = useEngineComponentsContext();
  const { subscribe, unsubscribe } = useUiEventContext();
  const registry = useBehaviourHandlerRegistry();

  const [data, setData ] = useState(initialData);

  useDataCache((dataEvent) => {
    setData(dataEvent.payload)
  })

  useEffect(() => {
    config.localCustomComponents.forEach(component => {
      addComponent(component)
    })

    return () => {
      config.localCustomComponents.forEach(component => {
        removeComponent(component)
      })
    }

  }, [addComponent, config.localCustomComponents, removeComponent])

  useEffect(() => {
    const subscriptions: string[] = [];

    const registerElement = (element: any) => {
      const subscriptionId = subscribe({
        msgTypeFilter: (msg: any) => msg?.messageType === element.eventType,
        callback: (event: any) => {
          
          try {
          if (element.eventCondition && !element.eventCondition(event)) {
            return;
          }

          if (element.dataCondition && !element.dataCondition(data)) {
            return;
          }
        } catch (_e) {
          // if we failed it will be because the condition function threw an error.
          // which is the same as them not being met
          return
        }
        // If the Behaviour is not based on a dataCache update, but an event
        // use payloadFromEvent to pull event data
         
          for (const action of element.actions || []) {
              
            if (action.kind === 'localEffect') {
              action.effect(event, data);
              continue;
            }
            Object.entries(action.eventData).forEach(([key, value]) => {
              // FromEvent functions are handled seperately to update specific values
              // keys ending with Func or Function are to be left as-is
              // so functions can be passed as params without being resolved here
              // all other values are resoled here
              if (typeof value === 'function'
                 && !key.endsWith('FromEvent')
                 && !key.endsWith('Func')
                 && !key.endsWith('Function')
                ) {
                action.eventData[key] = value(event, data);
              }
            })
            const handler = registry.get(action.eventType);
            handler?.(action, event, data);
          }
        },
      });

      subscriptions.push(subscriptionId);

      for (const inner of element.innerElements || []) {
        registerElement(inner);
      }
    };

    for (const element of config.elements) {
      registerElement(element);
    }

    return () => {
      subscriptions.forEach((id) => unsubscribe(id));
    };
  }, [config.elements, data, registry, subscribe, unsubscribe]);



  return null
}