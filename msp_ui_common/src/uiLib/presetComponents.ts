// Preset UI components for use in UiPlans
// These are commonly used form input/display components

import { PresetLinkInputProps } from './components/index.js';
import { ComponentWrapper } from './renderEngine/components/ReComponentWrapper.js';
import { ReComponentCommonProps, ReComponentSystemProps } from './renderEngine/components/ReComponentProps.js';

// Placeholder type for component props
type ComponentProps = unknown;

// Text input component
export const PresetLinkComponent: ComponentWrapper<PresetLinkInputProps& ReComponentCommonProps & ReComponentSystemProps> = {
  displayName: 'PresetLink',
  extensionFactory: undefined
} as unknown as ComponentWrapper<PresetLinkInputProps& ReComponentCommonProps & ReComponentSystemProps>;

// Text input component
export const PresetTextComponent: ComponentWrapper<ComponentProps> = {
  displayName: 'PresetText',
  extensionFactory: undefined
} as unknown as ComponentWrapper<ComponentProps>;

// Number input component
export const PresetNumberComponent: ComponentWrapper<ComponentProps> = {
  displayName: 'PresetNumber',
  extensionFactory: undefined
} as unknown as ComponentWrapper<ComponentProps>;

// Date picker component
export const PresetDateComponent: ComponentWrapper<ComponentProps> = {
  displayName: 'PresetDate',
  extensionFactory: undefined
} as unknown as ComponentWrapper<ComponentProps>;

// Boolean/checkbox component
export const PresetBooleanComponent: ComponentWrapper<ComponentProps> = {
  displayName: 'PresetBoolean',
  extensionFactory: undefined
} as unknown as ComponentWrapper<ComponentProps>;

// Money/currency input component
export const PresetMoneyComponent: ComponentWrapper<ComponentProps> = {
  displayName: 'PresetMoney',
  extensionFactory: undefined
} as unknown as ComponentWrapper<ComponentProps>;
