// Preset UI components for use in UiPlans
// These are commonly used form input/display components

import { ComponentWrapper } from './renderEngine/components/ReComponentWrapper.js';
import { TableExtension, TableProps, extendWithTable} from './components/tables/index.js';
import { CNTX } from './renderEngine/UiPlan/ReUiPlan.js';
import { ElementSetContainerExtension, extendWithElementSetContainer } from './renderEngine/components/ContainerElements.js';
import { ColumnProps } from './components/index.js';
import { LabelFrameProps } from './components/containers/labelframe.js';

// Placeholder type for component props


// Table component
export const Table: ComponentWrapper<TableProps, TableExtension<CNTX, any>> = {
  displayName: 'Table',
  extensionFactory: extendWithTable
} as unknown as ComponentWrapper<TableProps, TableExtension<CNTX, any>>;

export const Columns: ComponentWrapper<ColumnProps, ElementSetContainerExtension> = {
  displayName: 'Columns',
  extensionFactory: extendWithElementSetContainer
} as unknown as ComponentWrapper<ColumnProps, ElementSetContainerExtension>;

export const LabelFrame: ComponentWrapper<LabelFrameProps, ElementSetContainerExtension> = {
  displayName: 'LabelFrame',
  extensionFactory: extendWithElementSetContainer
} as unknown as ComponentWrapper<LabelFrameProps, ElementSetContainerExtension>;