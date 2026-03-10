import { DataIdentifier } from "../contexts/Data.js";
import { MenuItem } from "../contexts/uiEventTypes.js";
import { ComponentWrapper } from "../renderEngine/components/ReComponentWrapper.js";
import { behaviourConfig } from "./behaviourConfig.js";

export type ActivityCallDefinition<E = any> = {
  id: string;
  label?: string;
  action: string; // namespace/activity/version
  payload?: any;
  payloadFromEvent?: (event: E) => any;
  context?: string;
  contextFromEvent?: (event: E) => string | undefined;
};

export interface FluentBehaviour<DT> {
  registerLocalComponent: (component: ComponentWrapper<any>) => FluentBehaviour<DT>;
  withData: <D>(data: D) => FluentBehaviour<D>;
  whenEventRaised: <E extends string>(eventName: E) => EventHandlerBuilder<DT,E, FluentBehaviour<DT>>;
  build: () => behaviourConfig;
}

export interface EventHandlerBuilder<DT, E, RT> {
  whenDataSatisfies: (condition: (data: DT) => boolean) => EventHandlerBuilder<DT, E, RT>;
  whenEventSatisfies: (condition: (event: E) => boolean) => EventHandlerBuilder<DT, E, RT>;
  
  requestIsRaised: {
    toPresentationSubsystem: {
      menus: PresentationMenuRequestBuilder<DT, E, RT>;
      requests: PresentationRequestBuilder<DT, E, RT>;
    }
    toDataSubsystem: DataRequestBuilder<DT, E, RT>;
    toActivitySubSystem: ActivityRequestBuilder<DT, E, RT>;
  }
}

export interface DataRequestBuilder<DT, E, RT> {
  toRevert: (dataId: DataIdentifier) => DataRequestBuilder<DT, E, RT>;
  toChange: (dataId: DataIdentifier, changeFn: (data: DT) => DT) => DataRequestBuilder<DT, E, RT>;
  end: () => RT;
}

export interface PresentationMenuRequestBuilder<DT, E, RT> {
  toAdd: (menu: MenuItem) => PresentationMenuRequestBuilder<DT, E, RT>;  
  toRemove: (menu: MenuItem) => PresentationMenuRequestBuilder<DT, E, RT>;
  toEnable: (menu: MenuItem) => PresentationMenuRequestBuilder<DT, E, RT>;
  toDisable: (menu: MenuItem) => PresentationMenuRequestBuilder<DT, E, RT>;
  end: () => RT
}

export interface PresentationNavigationRequestBuilder<DT, E, RT> {
  toAdd: (menu: MenuItem) => PresentationNavigationRequestBuilder<DT, E, RT>;  
  toRemove: (menu: MenuItem) => PresentationNavigationRequestBuilder<DT, E, RT>;
  toEnable: (menu: MenuItem) => PresentationNavigationRequestBuilder<DT, E, RT>;
  toDisable: (menu: MenuItem) => PresentationNavigationRequestBuilder<DT, E, RT>;
  end: () => RT
}

export interface PresentationTabRequestBuilder<DT, E, RT> {
  toAdd: (menu: MenuItem) => PresentationTabRequestBuilder<DT, E, RT>;  
  toRemove: (menu: MenuItem) => PresentationTabRequestBuilder<DT, E, RT>;
  toSwitchTo: (menu: MenuItem) => PresentationTabRequestBuilder<DT, E, RT>;
  toFlash: (menu: MenuItem) => PresentationTabRequestBuilder<DT, E, RT>;
  end: () => RT
}

export interface ActivityRequestBuilder<DT, E, RT> {
  toCallActivityAsync: (activity: ActivityCallDefinition<E> | MenuItem) => ActivityRequestBuilder<DT, E, RT>;
  toCallActivitySync: (activity: ActivityCallDefinition<E> | MenuItem) => ActivityRequestBuilder<DT, E, RT>;
  end: () => RT
}

export interface PresentationRequestBuilder<DT, E, RT> {
  toOpenBlade: (target: string, params?: any | ((event: E) => any)) => PresentationRequestBuilder<DT, E, RT>;
  toCloseBlade: (target: string, params?: any | ((event: E) => any)) => PresentationRequestBuilder<DT, E, RT>;
  toOpenTab: (target: string, params?: any | ((event: E) => any)) => PresentationRequestBuilder<DT, E, RT>;
  toCloseTab: (target: string, params?: any | ((event: E) => any)) => PresentationRequestBuilder<DT, E, RT>;
  toNavigate: (target: string, params?: any | ((event: E) => any)) => PresentationRequestBuilder<DT, E, RT>;
  end: () => RT
}