/**
 * TypedRe - Strongly typed React component builder system
 * 
 * This system provides a strongly-typed, functional-fluent API for building
 * React UIs with automatic prop type inference and type checking.
 */

// Core types and builders
export {
  ComponentWrapper,
  createLeafComponent,
  createContainerComponent,
  PropsOf,
  ComponentOptionsBuilder,
  UiElementBuilder,
  ContainerElementBuilder,
  UiPlanBuilder,
  renderUiElement,
  renderUiPlan,
  Re
} from './TypedRe';

// Component implementations
export {
  Button,
  TextField,
  Card,
  Columns,
  // Prop types
  ButtonProps,
  TextFieldProps,
  CardProps,
  ColumnsProps
} from './components';

// Engine implementations
export {
  TypedReEngine,
  BindableTypedReEngine,
  createBinding as createDataBinding
} from './TypedReEngine';

// Data binding utilities
export {
  TypedReForm,
  createBinding,
  withBinding
} from './binding';

// Integration with legacy ReEngine
export {
  ComponentRegistry,
  convertTypedElementToReElement,
  convertTypedPlanToRePlan,
  TypedReWithReEngine
} from './integration';

// Registration of components with legacy system
export {
  RegisterTypedReComponents,
  typedComponentRegistry
} from './registerComponents';

// Examples
export {
  TypedReExample,
  ComplexTypedReExample,
  FluentTypedReExample
} from './examples';

// Data binding examples
export {
  DataBindingExample,
  ComplexBindingExample
} from './bindingExamples';
