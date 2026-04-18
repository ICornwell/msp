import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import deepClone from 'safe-clone-deep'
import { behaviourConfig, behaviourElement } from './behaviourConfig.js';
import { useEngineComponentsContext } from '../renderEngine/contexts/ReComponentsContext.js';
import { useUiEventContext } from '../contexts/UiEventContext.js';
// import { useDataCache } from '../hooks/useDataCache.js';
import { useBehaviourHandlerRegistry } from './BehaviourHandlerRegistryContext.js';
import { ViewDataIdentifier } from 'msp_common';
import { UiEventMessage } from '../events/uiEvents.js';

console.log('Loading Behaviour module');

export type BehaviourArg<T> = T | (({event, viewDataIdentifier, data} :{event: UiEventMessage<any>, viewDataIdentifier?: ViewDataIdentifier, data: any}) => T | undefined);

type BehaviourProps = {
  config: behaviourConfig;
  initialData?: any;
};

export function Behaviour({ config, initialData }: BehaviourProps) {
  const [startingUp, setStartingUp] = useState(true);
  const { addComponent, removeComponent } = useEngineComponentsContext();
  const { subscribe, unsubscribe } = useUiEventContext();
  const registry = useBehaviourHandlerRegistry();
  const [instanceId] = useState(uuidv4());
  const data = initialData; // for now we will treat data as static - we can come back to this and decide if we want to support dynamic data in behaviours, and if so how we want to handle it.
  // TODO: come back to this and decide if we want to support dynamic data in behaviours, and if so how we want to handle it.
  // const data = useRef(initialData);

  // useDataCache((dataEvent) => {
  //   data.current = dataEvent;
  //   // setData(dataEvent.payload)
  // })

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

    const registerElement = (element: behaviourElement<any, any>) => {
      const subscriptionId = subscribe({
        msgTypeFilter: (msg: UiEventMessage<any>) => msg?.messageType === element.eventType,
        callback: (event: UiEventMessage<any>) => {

          try {
            if (element.eventCondition && !element.eventCondition(event)) {
              return;
            }

            const dataCarrier = event.payload.context || event.payload
            
            const dataIndentifier = dataCarrier.viewDataIdentifier || dataCarrier.viewDataQueryIdentifier || dataCarrier.viewDataContent;
            const dataContent = dataCarrier.viewDataContent || dataCarrier.viewData || dataCarrier.data;
            
            if (element.dataCondition && !element.dataCondition(data)) {
              return;
            }

            if (element.dataIdentifierCondition && !element.dataIdentifierCondition(dataIndentifier)) {
              return;
            }
            runElementActions(element, {event, data: dataContent, viewDataIdentifier: dataIndentifier});
          } catch (_e) {
            // if we failed it will be because the condition function threw an error.
            // which is the same as them not being met
            return
          }
          // If the Behaviour is not based on a dataCache update, but an event
          // use payloadFromEvent to pull event data

          
        },
      });

      subscriptions.push(subscriptionId);

      // TODO: flat registration of inners will trigger them
      // only on their own filters - but they shouls only trigger if parent filters are also met. 
      for (const inner of element.innerElements || []) {
        registerElement(inner);
      }
    };

    for (const element of config.elements) {
      if (element.eventType != 'Always') {
        registerElement(element);
      }
    }
    if (startingUp) {
      console.log('Registered behaviour with subscriptions, running the whenStarted actions');
      for (const element of config.elements) {
        if (element.eventType === 'Always') {
          runElementActions(element, {});
        }
      }
      setStartingUp(false);
    }

    return () => {
      subscriptions.forEach((id) => unsubscribe(id));
    };
  }, [config.elements, data, registry, subscribe, unsubscribe]);



  return null

  function runElementActions(element: any, event: any) {
    for (const action of element.actions || []) {
      // action elements can be mutated as they are processed to resolve
      // functions to values, so we create a copy of the action for each instance to avoid
      // mutating the original action or other instances of it
      const instanceAction = deepClone(action, 'circular');
      instanceAction.contextOwnerId = instanceId;
      if (instanceAction.kind === 'localEffect') {
        instanceAction.effect(event, data);
        continue;
      }
      Object.entries(instanceAction.eventData).forEach(([key, value]) => {
        // FromEvent functions are handled seperately to update specific values
        // keys ending with Func or Function are to be left as-is
        // so functions can be passed as params without being resolved here
        // all other values are resoled here
        if (typeof value === 'function'
          && !key.endsWith('FromEvent')
          && !key.endsWith('Func')
          && !key.endsWith('Function')) {
          instanceAction.eventData[key] = value(event, data);
        }
      });
      console.log('Dispatching action for event', element.eventType, 'with data', instanceAction.eventData);
      const handler = registry.get(action.eventType);
      handler?.(instanceAction, event, data);
    }
  }
}