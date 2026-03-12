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
  DataRequestBuilder,
  PresentationMenuRequestBuilder,
  ActivityRequestBuilder
} from './behaviours/fluentBehaviour.js';

// UI Event system
export { UiEventProvider, useUiEventContext } from './contexts/UiEventContext.js';
export type { UiEventContextType } from './contexts/UiEventContext.js';
export { useUiEventSubscriber } from './hooks/useUiEvents.js';
export type { UiEventUnsubscribe } from './hooks/useUiEvents.js';

export type { UserChangeHandler } from './hooks/useUserSession.js';
export { useUserSession } from './hooks/useUserSession.js';

// Service dispatcher
export { ServiceDispatcher } from './components/ServiceDispatcher.js';
export type { ServiceDispatcherConfig } from './components/ServiceDispatcher.js';
