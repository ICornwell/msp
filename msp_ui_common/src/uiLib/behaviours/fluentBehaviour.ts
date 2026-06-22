import { ViewDataIdentifier } from "msp_common";
import { MenuItem } from "../contexts/uiEventTypes.js";
import { ComponentWrapper } from "../renderEngine/components/ReComponentWrapper.js";
import { behaviourConfig } from "./behaviourConfig.js";
import { BehaviourArg } from "./Behaviour.js";
import { SessionInfo } from "../contexts/index.js";
import { EventTypesByMsgName, UiMsgNames } from "../contexts/eventTypes.js";
import type { BehaviourScopeLevel } from "./behaviourConfig.js";
import { BladeParamOptions, TabParamOptions } from "../contexts/PresentationDispatchContext.js";

export type { BehaviourScopeLevel };

// ── Activity (service call) subsystem ────────────────────────────────────────

export type BehaviourActionFnContext<DT, E extends UiMsgNames> = {
  event: EventTypesByMsgName<E>;
  data: DT;
  viewDataIdentifier?: ViewDataIdentifier & { content?: DT};
};
export type BehaviourActionParam<DT, E extends UiMsgNames> = string | number | boolean | Date
 |undefined | ((context: BehaviourActionFnContext<DT, E>) => string | number | boolean | Date
 |undefined);
export type BehaviourActionParams<DT, E extends UiMsgNames, ParamOptions extends string = string> = Partial<Record<ParamOptions, BehaviourActionParam<DT, E>> >

export type ActivityCallDefinition<E extends UiMsgNames = any> = {
  id: string;
  label?: string;
  /** Fully-qualified activity path: namespace/activityName/version */
  action: string;
  payload?: any;
  payloadFromEvent?: (event: EventTypesByMsgName<E>) => any;
  payloadFromSession?: (sessionInfo: SessionInfo) => any;
  context?: string;
  contextFromEvent?: (event: EventTypesByMsgName<E>) => string | undefined;
};

export interface ActivityDispatchBuilder<DT, E extends UiMsgNames, RT> {
  /** Dispatch an async activity call to the service layer. */
  withoutWaiting: (activity: ActivityCallDefinition<E> | MenuItem) => ActivityDispatchBuilder<DT, E, RT>;
  withWaiting:  (activity: ActivityCallDefinition<E> | MenuItem) => ActivityDispatchBuilder<DT, E, RT>;
  endActivity: () => RT;
}

// ── Menu subsystem ────────────────────────────────────────────────────────────

export interface MenuDispatchBuilder<DT, E extends UiMsgNames, RT> {
  toAdd:     (menu: Omit<MenuItem, 'contextOwnerId'>) => MenuDispatchBuilder<DT, E, RT>;
  toRemove:  (menu: Omit<MenuItem, 'contextOwnerId'>) => MenuDispatchBuilder<DT, E, RT>;
  toEnable:  (menu: Omit<MenuItem, 'contextOwnerId'>) => MenuDispatchBuilder<DT, E, RT>;
  toDisable: (menu: Omit<MenuItem, 'contextOwnerId'>) => MenuDispatchBuilder<DT, E, RT>;
  endMenus: () => RT;
}

// ── Presentation subsystem ────────────────────────────────────────────────────

export type PageDefinition = {
  id: string;
  title: string;
  content: any;
  icon?: any;
  scrollEligible?: boolean;
  /** Activate this page when the tab opens. Defaults to the first page. */
  activateOnOpen?: boolean;
};

/**
 * Nested builder for declaring pages inside an openPagedTab call.
 * Call .withPage() one or more times, then .endPages() to return to PresentationDispatchBuilder.
 */
export interface PagedTabBuilder<DT, E extends UiMsgNames, RT> {
  withPage: (page: PageDefinition) => PagedTabBuilder<DT, E, RT>;
  endPages: () => PresentationDispatchBuilder<DT, E, RT>;
}

export interface PresentationDispatchBuilder<DT, E extends UiMsgNames, RT> {
  toOpenBlade:    (target: string, params?: BehaviourActionParams<DT, E, BladeParamOptions> | ((context: BehaviourActionFnContext<DT, E>) => any), content?: any, viewDataIdentifier?: BehaviourArg<ViewDataIdentifier>) => PresentationDispatchBuilder<DT, E, RT>;
  toCloseBlade:   (target: string, params?: BehaviourActionParams<DT, E> | ((context: BehaviourActionFnContext<DT, E>) => any)) => PresentationDispatchBuilder<DT, E, RT>;
  toOpenTab:      (target: string, params?: BehaviourActionParams<DT, E, TabParamOptions> | ((context: BehaviourActionFnContext<DT, E>) => any), content?: any, viewDataIdentifier?: BehaviourArg<ViewDataIdentifier>) => PresentationDispatchBuilder<DT, E, RT>;
  /** Open a tab with a named set of pages. Fluently add pages via the returned PagedTabBuilder. */
  toOpenPagedTab: (target: string, params?: BehaviourActionParams<DT, E> | ((context: BehaviourActionFnContext<DT, E>) => any)) => PagedTabBuilder<DT, E, RT>;
  toCloseTab:     (target: string, params?: BehaviourActionParams<DT, E> | ((context: BehaviourActionFnContext<DT, E>) => any)) => PresentationDispatchBuilder<DT, E, RT>;
  /** Add a page to an already-open tab. */
  toAddTabPage:   (tabTarget: string, page: PageDefinition, opts?: { activate?: boolean }) => PresentationDispatchBuilder<DT, E, RT>;
  /** Remove a page from an already-open tab by page id. */
  toCloseTabPage: (tabTarget: string, pageId: string) => PresentationDispatchBuilder<DT, E, RT>;
  navigate:     (target: string, params?: BehaviourActionParams<DT, E> | ((context: BehaviourActionFnContext<DT, E>) => any)) => PresentationDispatchBuilder<DT, E, RT>;
  endPresentation: () => RT;
}

// ── Data subsystem ────────────────────────────────────────────────────────────

export interface DataDispatchBuilder<DT, E extends UiMsgNames, RT> {
  /** Evict the identified data from the cache (marks it stale). */
  invalidate: (dataId: ViewDataIdentifier) => DataDispatchBuilder<DT, E, RT>;
  /** Push a change via a transform function; data subsystem publishes DataChanged. */
  save: (dataId: ViewDataIdentifier, changeFn: (data: DT) => DT) => DataDispatchBuilder<DT, E, RT>;
  /** Apply a partial patch to cached data using event.payload.result as source. */
  updateFromEventPayloadResult: (
    dataId: BehaviourArg<ViewDataIdentifier>,
    mapResultToDataFromEvent: <D extends Partial<any> = any>(result: any, data: D) => D
  ) => DataDispatchBuilder<DT, E, RT>;
  endData: () => RT;
}

export interface SystemDispatchBuilder<DT, E extends UiMsgNames, RT> {
  /** Log out the current user. */
  logoutUser: () => SystemDispatchBuilder<DT, E, RT>;
 
  
  endSystem: () => RT;
}

// ── LocalEffect ───────────────────────────────────────────────────────────────

export interface LocalEffectBuilder<_DT, _E extends UiMsgNames, RT> {
  endEffect: () => RT;
}

// ── Dispatch surface (Behaviour → subsystem) ──────────────────────────────────

export interface DispatchSurface<DT, E extends UiMsgNames, RT> {
  /**
   * Override the outbound scope-tagging level for all dispatches made through
   * this surface chain. Returns the same surface so dispatch calls can follow.
   * If not called, inherits from FluentBehaviour.withScope(), defaulting to 'FEATURE'.
   */
  withScope: (level: BehaviourScopeLevel) => DispatchSurface<DT, E, RT>;
  /** Dispatch a call-to-action to the Activity (service gateway) subsystem. */
  toActivity:     ActivityDispatchBuilder<DT, E, RT>;
  /** Dispatch a call-to-action to the Menu subsystem. */
  toMenus:        MenuDispatchBuilder<DT, E, RT>;
  /** Dispatch a call-to-action to the Presentation (navigation/blade) subsystem. */
  toPresentation: PresentationDispatchBuilder<DT, E, RT>;
  /** Dispatch a call-to-action to the Data cache subsystem. */
  toData:         DataDispatchBuilder<DT, E, RT>;

  toSystem:       SystemDispatchBuilder<DT, E, RT>;
}


// ── AlwaysBuilder (dispatch only) ───────────────────────────────────────

export interface AlwaysBuilder<DT, E extends UiMsgNames, RT> {
  /**
   * Dispatch a call-to-action to a subsystem.
   * Only Behaviours dispatch; the subsystem owns what happens next and
   * will raise zero-or-more UIEvents when it is done.
   */
  makeRequest: DispatchSurface<DT, E, RT>;

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
  /**
   * Declare the scope level for this behaviour.
   * - Sets the **inbound filter** level: conditions are only evaluated when the
   *   triggering event's scope tag matches at this granularity.
   * - Sets the **outbound tagging** default: dispatched events are tagged up to
   *   this level of the behaviour's scopeId.
   * Default if not declared: inbound = 'DOMAIN' (broadest), outbound = 'FEATURE' (finest).
   */
  withScope: (level: BehaviourScopeLevel) => FluentBehaviour<DT>;
  whenStarted: () => AlwaysBuilder<DT, any, FluentBehaviour<DT>>;
  /** Declare a response rule triggered when a UIEvent of this type is raised. */
  whenEventRaised: <E extends UiMsgNames>(eventName: E) => EventHandlerBuilder<DT, E, FluentBehaviour<DT>>;
  build: () => behaviourConfig;
}