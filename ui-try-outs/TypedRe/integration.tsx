import React from 'react';
import { UiElement, UiPlanBuilder, renderUiElement } from './TypedRe';
import { ReUiPlanElement, ReUiPlan } from '../../msp_fes/src/ui/renderEngine/UiPlan/ReUiPlan';
import { ReComponentBinder } from '../../msp_fes/src/ui/renderEngine/components/ReComponentProps';
import { ComponentType } from 'react';
import ReComponentWrapper from '../../msp_fes/src/ui/renderEngine/components/ReComponentWrapper';

/**
 * This file provides integration between the new TypedRe system
 * and the existing Re/ReEngine system for backward compatibility
 */

/**
 * Convert a TypedRe UiElement to a ReUiPlanElement
 */
export function convertTypedElementToReElement(
  uiElement: UiElement,
  componentRegistry: Map<ComponentType<any>, string>
): ReUiPlanElement {
  // Find the component name in the registry
  const componentName = componentRegistry.get(uiElement.component);
  
  if (!componentName) {
    throw new Error(`Component ${uiElement.component.displayName || 'Unknown'} is not registered in the component registry`);
  }
  
  // Convert props to the format expected by ReUiPlanElement
  const { props, children } = uiElement;
  
  const reElement: ReUiPlanElement = {
    componentName,
    componentProps: props,
    // Map other common properties
    hidden: props.hidden || false,
    disabled: props.disabled || false,
    error: props.error || false,
    helperText: props.helperText,
    label: props.label,
  };
  
  return reElement;
}

/**
 * Convert a TypedRe UiPlan to a ReUiPlan
 */
export function convertTypedPlanToRePlan(
  typedPlan: ReturnType<UiPlanBuilder['build']>,
  componentRegistry: Map<ComponentType<any>, string>
): ReUiPlan {
  // Create a new ReUiPlan
  const rePlan: ReUiPlan = {
    id: `typed-${typedPlan.name}`,
    name: typedPlan.name,
    description: `Generated from TypedRe plan: ${typedPlan.name}`,
    version: typedPlan.version,
    schemas: typedPlan.schemas || [],
  };
  
  // Convert the main element set
  if (typedPlan.mainElementSet) {
    rePlan.mainPlanElementSet = typedPlan.mainElementSet.map(element => ({
      componentName: componentRegistry.get(element.component),
      options: convertTypedElementToReElement(element, componentRegistry)
    }));
  }
  
  return rePlan;
}

/**
 * Component registry to map React components to string component names
 */
export class ComponentRegistry {
  private registry: Map<ComponentType<any>, string> = new Map();
  private reverseRegistry: Map<string, ComponentType<any>> = new Map();
  
  /**
   * Register a component with a name
   */
  registerComponent(component: ComponentType<any> || ReComponentWrapper, name: string): void {
    this.registry.set(component, name);
    this.reverseRegistry.set(name, component);
  }
  
  /**
   * Get the string name for a component
   */
  getComponentName(component: ComponentType<any>): string | undefined {
    return this.registry.get(component);
  }
  
  /**
   * Get a component by its string name
   */
  getComponent(name: string): ComponentType<any> | undefined {
    return this.reverseRegistry.get(name);
  }
  
  /**
   * Get the entire registry map for conversions
   */
  getRegistry(): Map<ComponentType<any>, string> {
    return this.registry;
  }
  
  /**
   * Convert a TypedRe UiPlan to a ReUiPlan using this registry
   */
  convertPlan(typedPlan: ReturnType<UiPlanBuilder['build']>): ReUiPlan {
    return convertTypedPlanToRePlan(typedPlan, this.registry);
  }
}

/**
 * Integration component that renders a TypedRe UI plan using the ReEngine
 */
export function TypedReWithReEngine({ 
  uiPlan,
  componentRegistry,
  sourceData = {}
}: {
  uiPlan: ReturnType<UiPlanBuilder['build']>,
  componentRegistry: ComponentRegistry,
  sourceData?: any
}) {
  // Convert the TypedRe plan to a ReUiPlan
  const rePlan = React.useMemo(() => {
    return componentRegistry.convertPlan(uiPlan);
  }, [uiPlan, componentRegistry]);
  
  // Render using the ReEngine
  // Use the actual ReEngine component here
  return React.createElement('div', {}, 'ReEngine would render here with the converted plan');
}
