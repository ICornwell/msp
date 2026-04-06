import { ComponentWrapper } from "../renderEngine/components/ReComponentWrapper.js"

export type behaviourConfig = {
  localCustomComponents: ComponentWrapper<any>[]
  elements: behaviourElement<any, any>[]
}

export type behaviourElement<DT, E> = {
  eventType: string
  eventCondition: (event: E) => boolean
  dataCondition: (data: DT) => boolean
  actions: behaviourAction<any,any>[]
  innerElements: behaviourElement<any, any>[]
}

// Discriminated union — request actions publish a message; local-effect actions call a side-effect
// directly (e.g. setting component state) without going through the pub-sub bus.
export type behaviourAction<DT, E> = RequestAction<DT, E> | LocalEffectAction<E>;

export type RequestAction<DT, E> = {
  kind?: 'request';
  eventType: string;
  eventData: DT;
  eventMsg: E;
  contra?: behaviourAction<DT, E>;
};

export type LocalEffectAction<E = any> = {
  kind: 'localEffect';
  effect: (event: E, data: any) => void;
};