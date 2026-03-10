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

export type behaviourAction<DT, E> = {
  eventType: string
  eventData: DT
  eventMsg: E

  contra?: behaviourAction<DT,E>
}