import { ViewDataIdentifier, ScopeItem } from "msp_common"
import { ComponentWrapper } from "../renderEngine/components/ReComponentWrapper.js"
import { EventTypesByMsgName, UiMsgNames } from "../contexts/eventTypes.js"
import { BehaviourActionFnContext } from "./index.js"

export type { ScopeItem };

/** Granularity levels for scope filtering and tagging. Coarsest → finest. */
export type BehaviourScopeLevel = 'DOMAIN' | 'PRODUCT' | 'SERVICE' | 'FEATURE';

/**
 * Runtime scope identity stamped onto a behaviourConfig by appUiFeatures
 * from the service-discovery manifest. Not self-declared by module authors.
 * domain is required (no wildcard default); product/service/feature are optional
 * and act as wildcards when absent.
 */
export type BehaviourScopeId = {
  domain: ScopeItem;
  product?: ScopeItem;
  service?: ScopeItem;
  feature?: ScopeItem;
};

/**
 * The scope fragment attached to an outbound dispatch/event.
 * Built from a BehaviourScopeId filtered to the declared scope level.
 */
export type BehaviourScopeTag = Partial<BehaviourScopeId>;

export type behaviourConfig = {
  name?: string
  localCustomComponents: ComponentWrapper<any>[]
  elements: behaviourElement<any, any>[]
  /** Runtime identity stamped by appUiFeatures from service discovery. */
  scopeId?: BehaviourScopeId;
  /**
   * Inbound filter level — how specifically must an incoming event's scope
   * match this behaviour's own scopeId before conditions are evaluated.
   * Default: 'DOMAIN' (broadest — accept anything in the same domain).
   */
  inboundScopeLevel?: BehaviourScopeLevel;
  /**
   * Outbound tagging level — how much of the scopeId to stamp on dispatches.
   * Default: 'FEATURE' (finest — full provenance on every dispatched event).
   * Can be overridden per-DispatchSurface call chain via .withScope().
   */
  outboundScopeLevel?: BehaviourScopeLevel;
}

export type behaviourElement<DT, E extends UiMsgNames> = {
  eventType: string
  eventCondition: (event: EventTypesByMsgName<E>) => boolean
  dataCondition: (data: DT) => boolean
  dataIdentifierCondition: (dataIdentifier: ViewDataIdentifier) => boolean
  actions: behaviourAction<any,any>[]
  innerElements: behaviourElement<any, any>[]
}

// Discriminated union — request actions publish a message; local-effect actions call a side-effect
// directly (e.g. setting component state) without going through the pub-sub bus.
export type behaviourAction<DT, E extends UiMsgNames> = RequestAction<DT, E> | LocalEffectAction<E>;

export type RequestAction<DT, E extends UiMsgNames> = {
  contextOwnerId?: string;
  kind?: 'request';
  eventType: string;
  eventData: DT;
  eventMsg: E;
  /** Per-dispatch surface scope level override. Set by DispatchSurface.withScope(). */
  outboundScopeLevel?: BehaviourScopeLevel;
  contra?: behaviourAction<DT, E>;
};

export type LocalEffectAction<E extends UiMsgNames = UiMsgNames> = {
  contextOwnerId?: string;
  kind: 'localEffect';
  effect: (context: BehaviourActionFnContext<any, E>) => void;
};