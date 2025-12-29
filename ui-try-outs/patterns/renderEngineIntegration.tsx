import React from 'react';
import {
  BaseComponentProps,
  ContainerComponentProps,
  LeafComponentProps,
  defineLeafComponent,
  defineContainerComponent,
  withProps,
  PropsOf,
  ComponentRenderer,
} from './reactComponentTypes';
import { CreateReUiPlanElementSet, CreateReUiPlanComponent } from '../../msp_fes/src/ui/renderEngine/UiPlan/ReUiPlanBuilder';
import { ReComponentAttributeBinder } from '../../msp_fes/src/ui/renderEngine/components/ReComponentProps';

// Integration with your existing render engine

/**
 * Create a registry to map component types to their implementations
 */
type ComponentRegistry = Record<string, ComponentRenderer<any>>;

// Global component registry
const globalComponentRegistry: ComponentRegistry = {};

/**
 * Register a component in the global registry
 */
export function registerComponent<P extends BaseComponentProps>(
  name: string,
  component: ComponentRenderer<P>
): void {
  globalComponentRegistry[name] = component;
}

/**
 * Get a component from the registry
 */
export function getComponent<P extends BaseComponentProps>(
  name: string
): ComponentRenderer<P> | undefined {
  return globalComponentRegistry[name] as ComponentRenderer<P>;
}

/**
 * Check if a component exists in the registry
 */
export function hasComponent(name: string): boolean {
  return !!globalComponentRegistry[name];
}

/**
 * Create a component renderer from a component name
 */
export function createComponentRenderer<P extends BaseComponentProps>(
  componentName: string
): ComponentRenderer<P> | undefined {
  const component = getComponent<P>(componentName);
  
  if (!component) {
    console.warn(`Component "${componentName}" not found in registry`);
    return undefined;
  }
  
  return component;
}

// Define some example components to register

/**
 * Text component props
 */
export interface TextProps extends LeafComponentProps {
  value: string;
  bold?: boolean;
  italic?: boolean;
  color?: string;
}

/**
 * Text component implementation
 */
export const Text = defineLeafComponent<TextProps>((props) => {
  const { value, bold, italic, color, className, style, id } = props;
  
  const textStyle = {
    ...style,
    fontWeight: bold ? 'bold' : undefined,
    fontStyle: italic ? 'italic' : undefined,
    color,
  };
  
  return (
    <span id={id} className={className} style={textStyle}>
      {value}
    </span>
  );
});

/**
 * Container component props
 */
export interface ContainerProps extends ContainerComponentProps {
  direction?: 'row' | 'column';
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
  padding?: number | string;
}

/**
 * Container component implementation
 */
export const Container = defineContainerComponent<ContainerProps>((props) => {
  const { 
    children, 
    direction = 'column', 
    gap = 0,
    align = 'stretch',
    justify = 'start',
    padding,
    className,
    style,
    id,
  } = props;
  
  const containerStyle = {
    ...style,
    display: 'flex',
    flexDirection: direction,
    gap: typeof gap === 'number' ? `${gap}px` : gap,
    alignItems: align,
    justifyContent: justify,
    padding: typeof padding === 'number' ? `${padding}px` : padding,
  };
  
  return (
    <div id={id} className={className} style={containerStyle}>
      {children}
    </div>
  );
});

// Register the components
registerComponent('Text', Text);
registerComponent('Container', Container);

// Integration with ReUiPlanBuilder

/**
 * Create a ReUiPlan element from a registered component
 */
export function createReUiPlanElement<P extends BaseComponentProps>(
  componentName: string,
  props: Partial<P>
): React.ReactElement | null {
  const component = createComponentRenderer<P>(componentName);
  
  if (!component) {
    return null;
  }
  
  return React.createElement(component as any, props);
}

/**
 * Example of how to integrate with ReUiPlanBuilder
 */
export function createUIFromReUiPlanElement(): React.ReactElement {
  // Create a UI using ReUiPlanBuilder
  const uiPlan = CreateReUiPlanElementSet()
    .showFixedComponent('Container', CreateReUiPlanComponent<ReComponentAttributeBinder>('Container')
      .withLabel('Root Container')
      .build())
    .build();
  
  // Render the UI plan using the registered components
  // (This is a simplified example - in reality you'd need to handle the full UI plan)
  const containerComponent = createComponentRenderer<ContainerProps>('Container');
  
  if (!containerComponent) {
    return React.createElement('div', {}, 'Component not found');
  }
  
  return containerComponent({
    children: [
      createReUiPlanElement<TextProps>('Text', { value: 'Hello World' }),
      createReUiPlanElement<TextProps>('Text', { value: 'This is a test', bold: true }),
    ],
    direction: 'column',
    gap: 10,
  });
}

/**
 * Example component that uses the system
 */
export const TypedRenderEngineExample: React.FC = () => {
  return (
    <div className="render-engine-example">
      <h2>Render Engine Example</h2>
      {createUIFromReUiPlanElement()}
      
      {/* Direct usage */}
      {withProps(Container, {
        direction: 'row',
        gap: 20,
        padding: '16px',
        children: [
          withProps(Text, { value: 'Left Text', color: 'blue' }),
          withProps(Text, { value: 'Right Text', bold: true, color: 'red' }),
        ],
      })}
    </div>
  );
};
