import { useEffect } from 'react';

import { behaviourConfig } from './behaviourConfig.js';
import { useEngineComponentsContext } from '../renderEngine/contexts/ReComponentsContext.js';
import { useUiEventContext } from '../contexts/UiEventContext.js';
import {
  createDataRequest,
  createMenuRequest,
  createPresentationRequest,
  createServiceCallRequest,
} from 'msp_common/messages';

type BehaviourProps = {
  config: behaviourConfig;
  data?: any;
};

export function Behaviour({ config, data }: BehaviourProps) {
  const { addComponent, removeComponent } = useEngineComponentsContext();
  const { subscribe, unsubscribe, publish } = useUiEventContext();

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
          if (!element.eventCondition(event)) {
            return;
          }

          if (!element.dataCondition(data)) {
            return;
          }

          for (const action of element.actions || []) {
            const request = toRequestMessage(action, event, data);
            if (request) {
              publish(request);
            }
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
  }, [config.elements, data, publish, subscribe, unsubscribe]);



  return null
}

function toRequestMessage(action: any, event: any, data: any): any {
  switch (action.eventType) {
    case 'ServiceCallRequest': {
      const activity = action.eventData?.activity || action.eventData?.menu || action.eventData;
      const actionPath = activity?.action || '';
      const [namespace, activityName, version] = String(actionPath).split('/');

      if (!namespace || !activityName || !version) {
        return null;
      }

      const payload = typeof activity?.payloadFromEvent === 'function'
        ? activity.payloadFromEvent(event)
        : (activity?.payload ?? event?.payload ?? data);

      const context = typeof activity?.contextFromEvent === 'function'
        ? activity.contextFromEvent(event)
        : activity?.context;

      return createServiceCallRequest(namespace, activityName, version, payload, context);
    }

    case 'MenuRequest': {
      const menu = action.eventData?.menu || {};
      const requestType = action.eventData?.requestType;
      const menuId = menu.id || menu.menuId;

      if (!requestType || !menuId) {
        return null;
      }

      return createMenuRequest(requestType, menuId, {
        label: menu.label,
        action: typeof menu.action === 'string' ? menu.action : undefined,
        enabled: typeof menu.disabled === 'boolean' ? !menu.disabled : undefined,
        visible: typeof menu.visible === 'boolean' ? menu.visible : undefined,
        context: menu.context ?? event?.payload?.data ?? event?.payload?.context,
      });
    }

    case 'PresentationRequest': {
      const requestType = action.eventData?.requestType;
      const target = action.eventData?.target;
      const params = typeof action.eventData?.paramsFromEvent === 'function'
        ? action.eventData.paramsFromEvent(event)
        : action.eventData?.params;

      if (!requestType || !target) {
        return null;
      }

      return createPresentationRequest(requestType, target, params);
    }

    case 'DataRequest': {
      const requestType = action.eventData?.requestType;
      const dataId = action.eventData?.dataId;
      if (!requestType || !dataId) {
        return null;
      }

      const mappedType = requestType === 'revert' ? 'invalidate' : 'save';
      const dataType = dataId.domain || 'default';
      const dataKey = [dataId.view, dataId.eid].filter(Boolean).join(':') || 'unknown';
      const nextData = typeof action.eventData?.changeFn === 'function' ? action.eventData.changeFn(data) : undefined;

      return createDataRequest(mappedType as any, dataType, dataKey, nextData);
    }

    default:
      return null;
  }
}