import { ViewDataIdentifier } from "msp_common"
import { ComponentWrapper } from "../renderEngine/components/ReComponentWrapper.js"
import { EventTypesByMsgName, UiMsgNames } from "../contexts/eventTypes.js"
import { BehaviourActionFnContext } from "./index.js"

export type behaviourConfig = {
  localCustomComponents: ComponentWrapper<any>[]
  elements: behaviourElement<any, any>[]
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
  contra?: behaviourAction<DT, E>;
};

export type LocalEffectAction<E extends UiMsgNames = UiMsgNames> = {
  contextOwnerId?: string;
  kind: 'localEffect';
  effect: (context: BehaviourActionFnContext<any, E>) => void;
};