import { DataIdentifier } from "../contexts/Data.js";
import { MenuItem } from "../contexts/uiEventTypes.js";
import { ComponentWrapper } from "../renderEngine/components/ReComponentWrapper.js";
import { behaviourConfig, behaviourElement, behaviourAction } from './behaviourConfig.js';
import {
  FluentBehaviour,
  EventHandlerBuilder,
  DataRequestBuilder,
  PresentationMenuRequestBuilder,
  PresentationRequestBuilder,
  ActivityRequestBuilder,
  ActivityCallDefinition,
} from './fluentBehaviour.js';


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
      // Data binding - could store for use in predicates
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

    requestIsRaised: {
      toPresentationSubsystem: {
        menus: makeMenuRequestBuilder<DT, E, RT>(element, returnBuilder),
        requests: makePresentationRequestBuilder<DT, E, RT>(element, returnBuilder),
      },
      toDataSubsystem: makeDataRequestBuilder<DT, E, RT>(element, returnBuilder),
      toActivitySubSystem: makeActivityRequestBuilder<DT, E, RT>(element, returnBuilder)
    }
  };
}

function makeDataRequestBuilder<DT, E, RT>(
  element: behaviourElement<DT, E>,
  returnBuilder: RT
): DataRequestBuilder<DT, E, RT> {
  return {
    toRevert: (dataId: DataIdentifier) => {
      const action: behaviourAction<DT, E> = {
        eventType: 'DataRequest',
        eventData: { requestType: 'revert', dataId } as any,
        eventMsg: undefined as any
      };
      element.actions.push(action);
      return makeDataRequestBuilder<DT, E, RT>(element, returnBuilder);
    },

    toChange: (dataId: DataIdentifier, changeFn: (data: DT) => DT) => {
      const action: behaviourAction<DT, E> = {
        eventType: 'DataRequest',
        eventData: { requestType: 'change', dataId, changeFn } as any,
        eventMsg: undefined as any
      };
      element.actions.push(action);
      return makeDataRequestBuilder<DT, E, RT>(element, returnBuilder);
    },

    end: () => returnBuilder
  };
}

function makeMenuRequestBuilder<DT, E, RT>(
  element: behaviourElement<DT, E>,
  returnBuilder: RT
): PresentationMenuRequestBuilder<DT, E, RT> {
  return {
    toAdd: (menu: MenuItem) => {
      const action: behaviourAction<DT, E> = {
        eventType: 'MenuRequest',
        eventData: { requestType: 'add', menu } as any,
        eventMsg: undefined as any
      };
      element.actions.push(action);
      return makeMenuRequestBuilder<DT, E, RT>(element, returnBuilder);
    },

    toRemove: (menu: MenuItem) => {
      const action: behaviourAction<DT, E> = {
        eventType: 'MenuRequest',
        eventData: { requestType: 'remove', menu } as any,
        eventMsg: undefined as any
      };
      element.actions.push(action);
      return makeMenuRequestBuilder<DT, E, RT>(element, returnBuilder);
    },

    toEnable: (menu: MenuItem) => {
      const action: behaviourAction<DT, E> = {
        eventType: 'MenuRequest',
        eventData: { requestType: 'enable', menu } as any,
        eventMsg: undefined as any
      };
      element.actions.push(action);
      return makeMenuRequestBuilder<DT, E, RT>(element, returnBuilder);
    },

    toDisable: (menu: MenuItem) => {
      const action: behaviourAction<DT, E> = {
        eventType: 'MenuRequest',
        eventData: { requestType: 'disable', menu } as any,
        eventMsg: undefined as any
      };
      element.actions.push(action);
      return makeMenuRequestBuilder<DT, E, RT>(element, returnBuilder);
    },

    end: () => returnBuilder
  };
}

function makeActivityRequestBuilder<DT, E, RT>(
  element: behaviourElement<DT, E>,
  returnBuilder: RT
): ActivityRequestBuilder<DT, E, RT> {
  return {
    toCallActivityAsync: (activity: ActivityCallDefinition<E> | MenuItem) => {
      const action: behaviourAction<DT, E> = {
        eventType: 'ServiceCallRequest',
        eventData: { requestType: 'async', activity } as any,
        eventMsg: undefined as any
      };
      element.actions.push(action);
      return makeActivityRequestBuilder<DT, E, RT>(element, returnBuilder);
    },

    toCallActivitySync: (activity: ActivityCallDefinition<E> | MenuItem) => {
      const action: behaviourAction<DT, E> = {
        eventType: 'ServiceCallRequest',
        eventData: { requestType: 'sync', activity } as any,
        eventMsg: undefined as any
      };
      element.actions.push(action);
      return makeActivityRequestBuilder<DT, E, RT>(element, returnBuilder);
    },

    end: () => returnBuilder
  };
}

function makePresentationRequestBuilder<DT, E, RT>(
  element: behaviourElement<DT, E>,
  returnBuilder: RT,
): PresentationRequestBuilder<DT, E, RT> {
  const withAction = (
    requestType: 'openBlade' | 'closeBlade' | 'openTab' | 'closeTab' | 'navigate',
    target: string,
    params?: any | ((event: E) => any),
  ): PresentationRequestBuilder<DT, E, RT> => {
    const eventData = typeof params === 'function'
      ? { requestType, target, paramsFromEvent: params }
      : { requestType, target, params };

    const action: behaviourAction<DT, E> = {
      eventType: 'PresentationRequest',
      eventData: eventData as any,
      eventMsg: undefined as any,
    };

    element.actions.push(action);
    return makePresentationRequestBuilder<DT, E, RT>(element, returnBuilder);
  };

  return {
    toOpenBlade: (target, params) => withAction('openBlade', target, params),
    toCloseBlade: (target, params) => withAction('closeBlade', target, params),
    toOpenTab: (target, params) => withAction('openTab', target, params),
    toCloseTab: (target, params) => withAction('closeTab', target, params),
    toNavigate: (target, params) => withAction('navigate', target, params),
    end: () => returnBuilder,
  };
}
