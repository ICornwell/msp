// Preset UI components for use in UiPlans
// These are commonly used form input/display components

import { ComponentWrapper } from './renderEngine/components/ReComponentWrapper.js';
import { TableExtension, TableProps, extendWithTable} from './components/tables/index.js';
import { CNTX } from './renderEngine/UiPlan/ReUiPlan.js';


// Placeholder type for component props
type ComponentProps = TableProps;

// Table component
export const Table: ComponentWrapper<ComponentProps, TableExtension<CNTX, any>> = {
  displayName: 'Table',
  extensionFactory: extendWithTable
} as unknown as ComponentWrapper<ComponentProps, TableExtension<CNTX, any>>;