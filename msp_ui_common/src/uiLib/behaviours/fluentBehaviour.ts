import { ViewDataIdentifier } from "msp_common";
import { MenuItem } from "../contexts/uiEventTypes.js";
import { ComponentWrapper } from "../renderEngine/components/ReComponentWrapper.js";
import { behaviourConfig } from "./behaviourConfig.js";
import { BehaviourArg } from "./Behaviour.js";
import { SessionInfo } from "../contexts/index.js";
import { EventTypesByMsgName, UiMsgNames } from "../contexts/eventTypes.js";

// ── Activity (service call) subsystem ────────────────────────────────────────

export type BehaviourActionFnContext<DT, E extends UiMsgNames> = {
  event: EventTypesByMsgName<E>;
  data: DT;
  viewDataIdentifier?: ViewDataIdentifier & { content?: DT};
};
export type BehaviourActionParam<DT, E extends UiMsgNames> = string | number | boolean | Date
 |undefined | ((context: BehaviourActionFnContext<DT, E>) => string | number | boolean | Date
 |undefined);
export type BehaviourActionParams<DT, E extends UiMsgNames> = Record<string, BehaviourActionParam<DT, E>> 

export type ActivityCallDefinition<E = any> = {
  id: string;
  label?: string;
  /** Fully-qualified activity path: namespace/activityName/version */
  action: string;
  payload?: any;
  payloadFromEvent?: (event: E) => any;
  payloadFromSession?: (sessionInfo: SessionInfo) => any;
  context?: string;
  contextFromEvent?: (event: E) => string | undefined;
};

export interface ActivityDispatchBuilder<DT, E, RT> {
  /** Dispatch an async activity call to the service layer. */
  callAsync: (activity: ActivityCallDefinition<E> | MenuItem) => ActivityDispatchBuilder<DT, E, RT>;
  callSync:  (activity: ActivityCallDefinition<E> | MenuItem) => ActivityDispatchBuilder<DT, E, RT>;
  end: () => RT;
}

// ── Menu subsystem ────────────────────────────────────────────────────────────

export interface MenuDispatchBuilder<DT, E, RT> {
  add:     (menu: MenuItem) => MenuDispatchBuilder<DT, E, RT>;
  remove:  (menu: MenuItem) => MenuDispatchBuilder<DT, E, RT>;
  enable:  (menu: MenuItem) => MenuDispatchBuilder<DT, E, RT>;
  disable: (menu: MenuItem) => MenuDispatchBuilder<DT, E, RT>;
  end: () => RT;
}

// ── Presentation subsystem ────────────────────────────────────────────────────

export interface PresentationDispatchBuilder<DT, E extends UiMsgNames, RT> {
  openBlade:  (target: string, params?: BehaviourActionParams<DT, E> | ((context: BehaviourActionFnContext<DT, E>) => any), content?: any, viewDataIdentifier?: BehaviourArg<ViewDataIdentifier>) => PresentationDispatchBuilder<DT, E, RT>;
  closeBlade: (target: string, params?: BehaviourActionParams<DT, E> | ((context: BehaviourActionFnContext<DT, E>) => any)) => PresentationDispatchBuilder<DT, E, RT>;
  openTab:    (target: string, params?: BehaviourActionParams<DT, E> | ((context: BehaviourActionFnContext<DT, E>) => any), content?: any, viewDataIdentifier?: BehaviourArg<ViewDataIdentifier>) => PresentationDispatchBuilder<DT, E, RT>;
  closeTab:   (target: string, params?: BehaviourActionParams<DT, E> | ((context: BehaviourActionFnContext<DT, E>) => any)) => PresentationDispatchBuilder<DT, E, RT>;
  navigate:   (target: string, params?: BehaviourActionParams<DT, E> | ((context: BehaviourActionFnContext<DT, E>) => any)) => PresentationDispatchBuilder<DT, E, RT>;
  end: () => RT;
}

// ── Data subsystem ────────────────────────────────────────────────────────────

export interface DataDispatchBuilder<DT, E extends UiMsgNames, RT> {
  /** Evict the identified data from the cache (marks it stale). */
  invalidate: (dataId: ViewDataIdentifier) => DataDispatchBuilder<DT, E, RT>;
  /** Push a change via a transform function; data subsystem publishes DataChanged. */
  save: (dataId: ViewDataIdentifier, changeFn: (data: DT) => DT) => DataDispatchBuilder<DT, E, RT>;
  end: () => RT;
}

// ── LocalEffect ───────────────────────────────────────────────────────────────

export interface LocalEffectBuilder<_DT, _E extends UiMsgNames, RT> {
  end: () => RT;
}

// ── Dispatch surface (Behaviour → subsystem) ──────────────────────────────────

export interface DispatchSurface<DT, E extends UiMsgNames, RT> {
  /** Dispatch a call-to-action to the Activity (service gateway) subsystem. */
  toActivity:     ActivityDispatchBuilder<DT, E, RT>;
  /** Dispatch a call-to-action to the Menu subsystem. */
  toMenus:        MenuDispatchBuilder<DT, E, RT>;
  /** Dispatch a call-to-action to the Presentation (navigation/blade) subsystem. */
  toPresentation: PresentationDispatchBuilder<DT, E, RT>;
  /** Dispatch a call-to-action to the Data cache subsystem. */
  toData:         DataDispatchBuilder<DT, E, RT>;
}


// ── AlwaysBuilder (dispatch only) ───────────────────────────────────────

export interface AlwaysBuilder<DT, E extends UiMsgNames, RT> {
  /**
   * Dispatch a call-to-action to a subsystem.
   * Only Behaviours dispatch; the subsystem owns what happens next and
   * will raise zero-or-more UIEvents when it is done.
   */
  dispatch: DispatchSurface<DT, E, RT>;

  /**
   * Run a side-effect directly in this component without traversing any bus.
   * Use this to update co-located React state (e.g. setBladeOpen, setUserData).
   * State-setter references from useState are stable and safe to close over.
   */
  localEffect: (effect: (context: BehaviourActionFnContext<DT, E>) => void) => LocalEffectBuilder<DT, E, RT>;
}

// ── EventHandlerBuilder (guards + dispatch)─────────────────────────────────

export interface EventHandlerBuilder<DT, E extends UiMsgNames, RT> extends AlwaysBuilder<DT, E, RT> {
  /** Guard: only proceed if the current data snapshot satisfies this predicate. */
  whenDataSatisfies:  (condition: (data: DT) => boolean) => EventHandlerBuilder<DT, E, RT>;
  whenDataIdentifierSatisfies:  (condition: (dataIdentifier: ViewDataIdentifier) => boolean) => EventHandlerBuilder<DT, E, RT>;
  /** Guard: only proceed if the triggering UIEvent satisfies this predicate. */
  whenEventSatisfies: (condition: (event: EventTypesByMsgName<E>) => boolean) => EventHandlerBuilder<DT, E, RT>;

}

// ── FluentBehaviour (root builder) ───────────────────────────────────────────

export interface FluentBehaviour<DT> {
  registerLocalComponent: (component: ComponentWrapper<any>) => FluentBehaviour<DT>;
  withData: <D>(data: D) => FluentBehaviour<D>;
  whenStarted: () => AlwaysBuilder<DT, any, FluentBehaviour<DT>>;
  /** Declare a response rule triggered when a UIEvent of this type is raised. */
  whenEventRaised: <E extends UiMsgNames>(eventName: E) => EventHandlerBuilder<DT, E, FluentBehaviour<DT>>;
  build: () => behaviourConfig;
}