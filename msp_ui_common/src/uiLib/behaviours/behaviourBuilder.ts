import { ViewDataIdentifier } from "msp_common";
import { MenuItem } from "../contexts/uiEventTypes.js";
import { ComponentWrapper } from "../renderEngine/components/ReComponentWrapper.js";
import { behaviourConfig, behaviourElement, behaviourAction, LocalEffectAction } from './behaviourConfig.js';
import type { BehaviourScopeLevel } from './behaviourConfig.js';
import {
  FluentBehaviour,
  EventHandlerBuilder,
  ActivityDispatchBuilder,
  MenuDispatchBuilder,
  PresentationDispatchBuilder,
  PagedTabBuilder,
  PageDefinition,
  DataDispatchBuilder,
  ActivityCallDefinition,
  AlwaysBuilder,
  BehaviourActionFnContext,
  DispatchSurface,
  SystemDispatchBuilder,
} from './fluentBehaviour.js';
import { BehaviourArg } from "./Behaviour.js";
import { EventTypesByMsgName, UiMsgNames } from "../contexts/eventTypes.js";


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

    withScope: (level: BehaviourScopeLevel) => {
      config.inboundScopeLevel = level;
      config.outboundScopeLevel = level;
      return makeFluentBehaviour<DT>(config, buildConfig);
    },

    whenStarted: () => {
      const element: behaviourElement<DT, any> = {
        eventType: 'Always',
        eventCondition: () => true,
        dataCondition: () => true,
        dataIdentifierCondition: () => true,
        actions: [],
        innerElements: []
      };
      config.elements.push(element);
      return makeAlwaysBuilder<DT, any, FluentBehaviour<DT>>(
        config.elements,
        element,
        makeFluentBehaviour<DT>(config, buildConfig)
      );
    },

    whenEventRaised: <E extends UiMsgNames>(eventName: E) => {
      const element: behaviourElement<DT, E> = {
        eventType: eventName,
        eventCondition: () => true,
        dataCondition: () => true,
        dataIdentifierCondition: () => true,
        actions: [],
        innerElements: []
      };
      config.elements.push(element);
      return makeEventHandlerBuilder<DT, E, FluentBehaviour<DT>>(
        config.elements,
        element,
        makeFluentBehaviour<DT>(config, buildConfig)
      );
    },

    build: buildConfig
  };
}

function makeDispatchSurface<DT, E extends UiMsgNames, RT>(
  element: behaviourElement<DT, E>,
  returnBuilder: RT,
  scopeLevel?: BehaviourScopeLevel
): DispatchSurface<DT, E, RT> {
  return {
    withScope: (level: BehaviourScopeLevel) =>
      makeDispatchSurface(element, returnBuilder, level),
    toActivity: makeActivityDispatchBuilder<DT, E, RT>(element, returnBuilder, scopeLevel),
    toMenus: makeMenuDispatchBuilder<DT, E, RT>(element, returnBuilder, scopeLevel),
    toPresentation: makePresentationDispatchBuilder<DT, E, RT>(element, returnBuilder, scopeLevel),
    toData: makeDataDispatchBuilder<DT, E, RT>(element, returnBuilder, scopeLevel),
    toSystem: makeSystemDispatchBuilder<DT, E, RT>(element, returnBuilder, scopeLevel),
  };
}

function makeAlwaysBuilder<DT, E extends UiMsgNames, RT>(
  elements: behaviourElement<DT, E>[],
  element: behaviourElement<DT, E>,
  returnBuilder: RT
): AlwaysBuilder<DT, E, RT> {

  const aBuilder = {} as AlwaysBuilder<DT, E, RT>;
  aBuilder.makeRequest = makeDispatchSurface(element, aBuilder);

  aBuilder.localEffect = (effect: (context: BehaviourActionFnContext<DT, E>) => void) => {
    const action: LocalEffectAction<E> = { kind: 'localEffect', effect };
    element.actions.push(action);
    return { endEffect: () => aBuilder };
  },

  aBuilder.then = () => makeAlwaysBuilder<DT, E, RT>(elements, cloneElementConditions(elements, element), returnBuilder);

  aBuilder.endHandler = () => returnBuilder;

  return aBuilder;
};

function andConditions(c1: ((data: any) => boolean) | undefined, c2: (data: any) => boolean): (data: any) => boolean {
  return (data: any) =>  (c1 ? c1(data) : true)  && c2(data);
}

function makeEventHandlerBuilder<DT, E extends UiMsgNames, RT>(
  elements: behaviourElement<DT, E>[],
  element: behaviourElement<DT, E>,
  returnBuilder: RT
): EventHandlerBuilder<DT, E, RT> {
  const evBuilder = {} as EventHandlerBuilder<DT, E, RT>;

  evBuilder.whenDataSatisfies = (condition: (data: DT) => boolean) => {
    element.dataCondition = andConditions(element.dataCondition, condition);
    return makeEventHandlerBuilder<DT, E, RT>(elements, element, returnBuilder);
  },
    evBuilder.whenDataIdentifierSatisfies = (condition: (dataIdentifier: ViewDataIdentifier) => boolean) => {
      element.dataIdentifierCondition = andConditions(element.dataIdentifierCondition, condition);
      return makeEventHandlerBuilder<DT, E, RT>(elements, element, returnBuilder);
    },
    evBuilder.whenEventSatisfies = (condition: (event: EventTypesByMsgName<E>) => boolean) => {
      element.eventCondition = andConditions(element.eventCondition, condition) as any;
      return makeEventHandlerBuilder<DT, E, RT>(elements, element, returnBuilder);
    },

    evBuilder.then = () => makeEventHandlerBuilder<DT, E, RT>(elements, cloneElementConditions(elements, element), returnBuilder),

    evBuilder.makeRequest = makeDispatchSurface(element, evBuilder);

  evBuilder.localEffect = (effect: (context: BehaviourActionFnContext<DT, E>) => void) => {
    const action: LocalEffectAction<E> = { kind: 'localEffect', effect };
    element.actions.push(action);
    return { endEffect: () => evBuilder };
  },

    evBuilder.endHandler = () => returnBuilder;
  return evBuilder;
};


function makeActivityDispatchBuilder<DT, E extends UiMsgNames, RT>(
  element: behaviourElement<DT, E>,
  returnBuilder: RT,
  scopeLevel?: BehaviourScopeLevel
): ActivityDispatchBuilder<DT, E, RT> {
  return {
    withoutWaiting: (activity: ActivityCallDefinition<E> | MenuItem) => {
      const action: behaviourAction<DT, E> = {
        eventType: 'ServiceCallRequest',
        eventData: { requestType: 'async', activity } as any,
        eventMsg: undefined as any,
        outboundScopeLevel: scopeLevel,
      };
      element.actions.push(action);
      return makeActivityDispatchBuilder<DT, E, RT>(element, returnBuilder, scopeLevel);
    },

    withWaiting: (activity: ActivityCallDefinition<E> | MenuItem) => {
      const action: behaviourAction<DT, E> = {
        eventType: 'ServiceCallRequest',
        eventData: { requestType: 'sync', activity } as any,
        eventMsg: undefined as any,
        outboundScopeLevel: scopeLevel,
      };
      element.actions.push(action);
      return makeActivityDispatchBuilder<DT, E, RT>(element, returnBuilder, scopeLevel);
    },

    endActivity: () => returnBuilder
  };
}

function makeMenuDispatchBuilder<DT, E extends UiMsgNames, RT>(
  element: behaviourElement<DT, E>,
  returnBuilder: RT,
  scopeLevel?: BehaviourScopeLevel
): MenuDispatchBuilder<DT, E, RT> {
  const withMenuAction = (requestType: string, menu: MenuItem): MenuDispatchBuilder<DT, E, RT> => {
    const action: behaviourAction<DT, E> = {
      eventType: 'MenuRequest',
      eventData: { requestType, menu } as any,
      eventMsg: undefined as any,
      outboundScopeLevel: scopeLevel,
    };
    element.actions.push(action);
    return makeMenuDispatchBuilder<DT, E, RT>(element, returnBuilder, scopeLevel);
  };

  return {
    toAdd: (menu) => withMenuAction('add', menu as MenuItem),
    toRemove: (menu) => withMenuAction('remove', menu as MenuItem),
    toEnable: (menu) => withMenuAction('enable', menu as MenuItem),
    toDisable: (menu) => withMenuAction('disable', menu as MenuItem),
    endMenus: () => returnBuilder
  };
}

function makeDataDispatchBuilder<DT, E extends UiMsgNames, RT>(
  element: behaviourElement<DT, E>,
  returnBuilder: RT,
  scopeLevel?: BehaviourScopeLevel
): DataDispatchBuilder<DT, E, RT> {
  return {
    toInvalidate: (viewDataIdentifier: ViewDataIdentifier) => {
      const action: behaviourAction<DT, E> = {
        eventType: 'DataRequest',
        eventData: { requestType: 'revert', viewDataIdentifier } as any,
        eventMsg: undefined as any,
        outboundScopeLevel: scopeLevel,
      };
      element.actions.push(action);
      return makeDataDispatchBuilder<DT, E, RT>(element, returnBuilder, scopeLevel);
    },

    toSave: (viewDataIdentifier: ViewDataIdentifier, changeFn: (data: DT) => DT) => {
      const action: behaviourAction<DT, E> = {
        eventType: 'DataRequest',
        eventData: { requestType: 'change', viewDataIdentifier, changeFn } as any,
        eventMsg: undefined as any,
        outboundScopeLevel: scopeLevel,
      };
      element.actions.push(action);
      return makeDataDispatchBuilder<DT, E, RT>(element, returnBuilder, scopeLevel);
    },

    toUpdateFromEventResult: (viewDataIdentifier, mapResultToDataFromEvent) => {
      const action: behaviourAction<DT, E> = {
        eventType: 'DataRequest',
        eventData: { requestType: 'toUpdateFromEventResult', viewDataIdentifier, mapResultToDataFromEvent } as any,
        eventMsg: undefined as any,
        outboundScopeLevel: scopeLevel,
      };
      element.actions.push(action);
      return makeDataDispatchBuilder<DT, E, RT>(element, returnBuilder, scopeLevel);
    },

    endData: () => returnBuilder
  };
}

function makeSystemDispatchBuilder<DT, E extends UiMsgNames, RT>(
  element: behaviourElement<DT, E>,
  returnBuilder: RT,
  scopeLevel?: BehaviourScopeLevel
): SystemDispatchBuilder<DT, E, RT> {
  return {
    toLogoutUser: () => {
      const action: behaviourAction<DT, E> = {
        eventType: 'SystemRequest',
        eventData: { requestType: 'logoutUser' } as any,
        eventMsg: undefined as any,
        outboundScopeLevel: scopeLevel,
      };
      element.actions.push(action);
      return makeSystemDispatchBuilder<DT, E, RT>(element, returnBuilder, scopeLevel);
    },
    endSystem: () => returnBuilder
  };
}

function makePagedTabBuilder<DT, E extends UiMsgNames, RT>(
  element: behaviourElement<DT, E>,
  returnBuilder: RT,
  target: string,
  baseParams: any,
  pages: PageDefinition[],
  scopeLevel?: BehaviourScopeLevel
): PagedTabBuilder<DT, E, RT> {
  const presentationBuilder = makePresentationDispatchBuilder<DT, E, RT>(element, returnBuilder, scopeLevel);
  return {
    withPage: (page: PageDefinition) =>
      makePagedTabBuilder(element, returnBuilder, target, baseParams, [...pages, page], scopeLevel),
    endPages: () => {
      const action: behaviourAction<DT, E> = {
        eventType: 'PresentationRequest',
        eventData: { requestType: 'openPagedTab', target, ...baseParams, pages } as any,
        eventMsg: undefined as any,
        outboundScopeLevel: scopeLevel,
      };
      element.actions.push(action);
      return presentationBuilder;
    },
  };
}

function makePresentationDispatchBuilder<DT, E extends UiMsgNames, RT>(
  element: behaviourElement<DT, E>,
  returnBuilder: RT,
  scopeLevel?: BehaviourScopeLevel
): PresentationDispatchBuilder<DT, E, RT> {
  const withAction = (
    requestType: 'openBlade' | 'closeBlade' | 'openTab' | 'closeTab' | 'navigate',
    target: string,
    params?: Object | ((event: EventTypesByMsgName<E>) => any),
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
      outboundScopeLevel: scopeLevel,
    };

    element.actions.push(action);
    return makePresentationDispatchBuilder<DT, E, RT>(element, returnBuilder, scopeLevel);
  };

  return {
    toOpenBlade: (target, params, content, viewDataIdentifier) => withAction('openBlade', target, params, content, viewDataIdentifier),
    toCloseBlade: (target, params) => withAction('closeBlade', target, params),
    toOpenTab: (target, params, content, viewDataIdentifier) => withAction('openTab', target, params, content, viewDataIdentifier),
    toOpenPagedTab: (target, params?) =>
      makePagedTabBuilder(element, returnBuilder, target, params ?? {}, [], scopeLevel),
    toCloseTab: (target, params) => withAction('closeTab', target, params),
    toAddTabPage: (tabTarget: string, page: PageDefinition, opts?: { activate?: boolean }) => {
      const action: behaviourAction<DT, E> = {
        eventType: 'PresentationRequest',
        eventData: { requestType: 'addTabPage', target: tabTarget, params: { ...page, pageId: page.id, activate: opts?.activate } } as any,
        eventMsg: undefined as any,
        outboundScopeLevel: scopeLevel,
      };
      element.actions.push(action);
      return makePresentationDispatchBuilder<DT, E, RT>(element, returnBuilder, scopeLevel);
    },
    toCloseTabPage: (tabTarget: string, pageId: string) => {
      const action: behaviourAction<DT, E> = {
        eventType: 'PresentationRequest',
        eventData: { requestType: 'closeTabPage', target: tabTarget, params: { pageId } } as any,
        eventMsg: undefined as any,
        outboundScopeLevel: scopeLevel,
      };
      element.actions.push(action);
      return makePresentationDispatchBuilder<DT, E, RT>(element, returnBuilder, scopeLevel);
    },
    navigate: (target, params) => withAction('navigate', target, params),
    endPresentation: () => returnBuilder,
  };
}

function cloneElementConditions(elements: behaviourElement<any, any>[], element: behaviourElement<any, any>): behaviourElement<any, any> {
  const newElement: behaviourElement<any, any> = {
    eventType: element.eventType,
    actions: [],
    innerElements: [],
    eventCondition: element.eventCondition,
    dataCondition: element.dataCondition,
    dataIdentifierCondition: element.dataIdentifierCondition,
  };
  elements.push(newElement);
  return newElement;
}