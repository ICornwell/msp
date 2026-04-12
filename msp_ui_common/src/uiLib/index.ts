// Main uiLib export surface
// Provides all public UI library utilities for external consumption (e.g., msp_actorwork)

// Render engine and core UI building
export { Re } from './renderEngine/index.js';
export type { FluxorData } from './renderEngine/index.js';

// Preset components for use in UiPlans
export {
  PresetTextComponent,
  PresetNumberComponent,
  PresetDateComponent,
  PresetBooleanComponent,
  PresetMoneyComponent
} from './presetComponets.js';

export { Table  } from './coreComponents.js';

// Data cache hook
export { useDataCache } from './hooks/useDataCache.js';
export type { DataCacheOperations } from './hooks/useDataCache.js';

// Data cache context provider
export { DataCacheProvider, useDataCacheContext } from './contexts/DataCacheContext.js';
export type { DataCacheContextType } from './contexts/DataCacheContext.js';

// Behaviour system
export { createBehaviour as createBehaviour } from './behaviours/behaviourBuilder.js';
export { Behaviour } from './behaviours/Behaviour.js';
export type { behaviourConfig, behaviourElement, behaviourAction } from './behaviours/behaviourConfig.js';
export type {
  FluentBehaviour,
  EventHandlerBuilder,
  ActivityDispatchBuilder,
  MenuDispatchBuilder,
  PresentationDispatchBuilder,
  DataDispatchBuilder

} from './behaviours/fluentBehaviour.js';
export { BehaviourDispatchProvider, BehaviourHandlerRegistryProvider, useBehaviourHandlerRegistry } from './behaviours/BehaviourHandlerRegistryContext.js';
export type { ActionHandler, BehaviourHandlerRegistry } from './behaviours/BehaviourHandlerRegistryContext.js';

// UI Event system
export { UiEventProvider, useUiEventContext, useUiEventPublisher } from './contexts/UiEventContext.js';
export type { UiEventContextType } from './contexts/UiEventContext.js';
// useUiEventSubscriber is intentionally not re-exported — subscribing to UIEvents
// is the exclusive concern of the Behaviour component.

// Subsystem dispatch contexts — used by Behaviours via BehaviourDispatchProvider
export { ActivityDispatchProvider, useActivityDispatch } from './contexts/ActivityDispatchContext.js';
export type { ActivityDispatchRequest, ActivityDispatchContextType } from './contexts/ActivityDispatchContext.js';
export { MenuDispatchProvider, useMenuDispatch } from './contexts/MenuDispatchContext.js';
export type { MenuDispatchRequest, MenuDispatchContextType } from './contexts/MenuDispatchContext.js';
export { PresentationDispatchProvider, usePresentationDispatch } from './contexts/PresentationDispatchContext.js';
export type { PresentationDispatchRequest, PresentationDispatchContextType } from './contexts/PresentationDispatchContext.js';
export { useDataDispatch } from './contexts/DataCacheContext.js';
export type { DataDispatch } from './contexts/DataCacheContext.js';

export type { UserChangeHandler } from './hooks/useUserSession.js';
export { useUserSession } from './hooks/useUserSession.js';

// Service dispatcher
export { ServiceDispatcher } from './components/ServiceDispatcher.js';
export type { ServiceDispatcherConfig } from './components/ServiceDispatcher.js';

import { UserSessionEvents } from './contexts/UserSessionContext.js';
import { DataCacheEvents } from './contexts/DataCacheContext.js';
import { ActivityEvents } from './contexts/ActivityDispatchContext.js';
import { MenuEvents } from './contexts/MenuDispatchContext.js';

export const eventTypes = {
  UserSession: UserSessionEvents,
  DataCache: DataCacheEvents,
  Activity: ActivityEvents,
  Menu: MenuEvents,
}