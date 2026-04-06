import { ViewDataIdentifier } from "msp_common";
import { MenuItem } from "../contexts/uiEventTypes.js";
import { ComponentWrapper } from "../renderEngine/components/ReComponentWrapper.js";
import { behaviourConfig, behaviourElement, behaviourAction, LocalEffectAction } from './behaviourConfig.js';
import {
  FluentBehaviour,
  EventHandlerBuilder,
  ActivityDispatchBuilder,
  MenuDispatchBuilder,
  PresentationDispatchBuilder,
  DataDispatchBuilder,
  LocalEffectBuilder,
  ActivityCallDefinition,
} from './fluentBehaviour.js';
import { BehaviourArg } from "./Behaviour.js";


export function createBehaviour<DT = any>(): FluentBehaviour<DT> {
  const config: behaviourConfig = {
    localCustomComponents: [],
    elements: []
  };

  function buildConfig(): behaviourConfig {
    return config;
  }

  return makeFluentBehaviour<DT>(config, buildConfig);
}

function makeFluentBehaviour<DT>(
  config: behaviourConfig,
  buildConfig: () => behaviourConfig
): FluentBehaviour<DT> {
  return {
    registerLocalComponent: (component: ComponentWrapper<any>) => {
      config.localCustomComponents.push(component);
      return makeFluentBehaviour<DT>(config, buildConfig);
    },

    withData: <D>(_data: D) => {
      return makeFluentBehaviour<D>(config, buildConfig);
    },

    whenEventRaised: <E extends string>(eventName: E) => {
      const element: behaviourElement<DT, E> = {
        eventType: eventName,
        eventCondition: () => true,
        dataCondition: () => true,
        actions: [],
        innerElements: []
      };
      config.elements.push(element);
      return makeEventHandlerBuilder<DT, E, FluentBehaviour<DT>>(
        element,
        makeFluentBehaviour<DT>(config, buildConfig)
      );
    },

    build: buildConfig
  };
}

function makeEventHandlerBuilder<DT, E, RT>(
  element: behaviourElement<DT, E>,
  returnBuilder: RT
): EventHandlerBuilder<DT, E, RT> {
  return {
    whenDataSatisfies: (condition: (data: DT) => boolean) => {
      element.dataCondition = condition;
      return makeEventHandlerBuilder<DT, E, RT>(element, returnBuilder);
    },

    whenEventSatisfies: (condition: (event: E) => boolean) => {
      element.eventCondition = condition as any;
      return makeEventHandlerBuilder<DT, E, RT>(element, returnBuilder);
    },

    dispatch: {
      toActivity:     makeActivityDispatchBuilder<DT, E, RT>(element, returnBuilder),
      toMenus:        makeMenuDispatchBuilder<DT, E, RT>(element, returnBuilder),
      toPresentation: makePresentationDispatchBuilder<DT, E, RT>(element, returnBuilder),
      toData:         makeDataDispatchBuilder<DT, E, RT>(element, returnBuilder),
    },

    localEffect: (effect: (event: E, data: any) => void): LocalEffectBuilder<DT, E, RT> => {
      const action: LocalEffectAction<E> = { kind: 'localEffect', effect };
      element.actions.push(action);
      return { end: () => returnBuilder };
    },
  };
}

function makeActivityDispatchBuilder<DT, E, RT>(
  element: behaviourElement<DT, E>,
  returnBuilder: RT
): ActivityDispatchBuilder<DT, E, RT> {
  return {
    callAsync: (activity: ActivityCallDefinition<E> | MenuItem) => {
      const action: behaviourAction<DT, E> = {
        eventType: 'ServiceCallRequest',
        eventData: { requestType: 'async', activity } as any,
        eventMsg: undefined as any
      };
      element.actions.push(action);
      return makeActivityDispatchBuilder<DT, E, RT>(element, returnBuilder);
    },

    callSync: (activity: ActivityCallDefinition<E> | MenuItem) => {
      const action: behaviourAction<DT, E> = {
        eventType: 'ServiceCallRequest',
        eventData: { requestType: 'sync', activity } as any,
        eventMsg: undefined as any
      };
      element.actions.push(action);
      return makeActivityDispatchBuilder<DT, E, RT>(element, returnBuilder);
    },

    end: () => returnBuilder
  };
}

function makeMenuDispatchBuilder<DT, E, RT>(
  element: behaviourElement<DT, E>,
  returnBuilder: RT
): MenuDispatchBuilder<DT, E, RT> {
  const withMenuAction = (requestType: string, menu: MenuItem): MenuDispatchBuilder<DT, E, RT> => {
    const action: behaviourAction<DT, E> = {
      eventType: 'MenuRequest',
      eventData: { requestType, menu } as any,
      eventMsg: undefined as any
    };
    element.actions.push(action);
    return makeMenuDispatchBuilder<DT, E, RT>(element, returnBuilder);
  };

  return {
    add:     (menu) => withMenuAction('add', menu),
    remove:  (menu) => withMenuAction('remove', menu),
    enable:  (menu) => withMenuAction('enable', menu),
    disable: (menu) => withMenuAction('disable', menu),
    end: () => returnBuilder
  };
}

function makeDataDispatchBuilder<DT, E, RT>(
  element: behaviourElement<DT, E>,
  returnBuilder: RT
): DataDispatchBuilder<DT, E, RT> {
  return {
    invalidate: (viewDataIdentifier: ViewDataIdentifier) => {
      const action: behaviourAction<DT, E> = {
        eventType: 'DataRequest',
        eventData: { requestType: 'revert', viewDataIdentifier } as any,
        eventMsg: undefined as any
      };
      element.actions.push(action);
      return makeDataDispatchBuilder<DT, E, RT>(element, returnBuilder);
    },

    save: (viewDataIdentifier: ViewDataIdentifier, changeFn: (data: DT) => DT) => {
      const action: behaviourAction<DT, E> = {
        eventType: 'DataRequest',
        eventData: { requestType: 'change', viewDataIdentifier, changeFn } as any,
        eventMsg: undefined as any
      };
      element.actions.push(action);
      return makeDataDispatchBuilder<DT, E, RT>(element, returnBuilder);
    },

    end: () => returnBuilder
  };
}

function makePresentationDispatchBuilder<DT, E, RT>(
  element: behaviourElement<DT, E>,
  returnBuilder: RT,
): PresentationDispatchBuilder<DT, E, RT> {
  const withAction = (
    requestType: 'openBlade' | 'closeBlade' | 'openTab' | 'closeTab' | 'navigate',
    target: string,
    params?: any | ((event: E) => any),
    content?: any,
    viewDataIdentifier?: BehaviourArg<ViewDataIdentifier>,
  ): PresentationDispatchBuilder<DT, E, RT> => {
    const eventData = typeof params === 'function'
      ? { requestType, target, paramsFromEvent: params, content, viewDataIdentifier }
      : { requestType, target, params, content, viewDataIdentifier };

    const action: behaviourAction<DT, E> = {
      eventType: 'PresentationRequest',
      eventData: eventData as any,
      eventMsg: undefined as any,
    };

    element.actions.push(action);
    return makePresentationDispatchBuilder<DT, E, RT>(element, returnBuilder);
  };

  return {
    openBlade:  (target, params, content, viewDataIdentifier) => withAction('openBlade', target, params, content, viewDataIdentifier),
    closeBlade: (target, params) => withAction('closeBlade', target, params),
    openTab:    (target, params, content, viewDataIdentifier) => withAction('openTab', target, params, content, viewDataIdentifier),
    closeTab:   (target, params) => withAction('closeTab', target, params),
    navigate:   (target, params) => withAction('navigate', target, params),
    end: () => returnBuilder,
  };
}