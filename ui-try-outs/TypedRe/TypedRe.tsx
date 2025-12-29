import React, { ComponentType, ReactElement, ReactNode } from 'react';

/**
 * Base component wrapper that includes both the component and its metadata
 */
export interface ComponentWrapper<P> {
  // The actual React component
  component: ComponentType<P>;
  // Display name for debugging
  displayName: string;
  // Whether this component accepts children
  acceptsChildren: boolean;
  // The type of props this component accepts
  __propType?: P; // Never used at runtime, only for type inference
}

/**
 * Create a wrapper for a component that doesn't accept children
 */
export function createLeafComponent<P extends object>(
  component: ComponentType<P>,
  displayName?: string
): ComponentWrapper<P> {
  return {
    component,
    displayName: displayName || component.displayName || component.name || 'UnnamedComponent',
    acceptsChildren: false,
  };
}

/**
 * Create a wrapper for a component that accepts children
 */
export function createContainerComponent<P extends { children?: ReactNode }>(
  component: ComponentType<P>,
  displayName?: string
): ComponentWrapper<P> {
  return {
    component,
    displayName: displayName || component.displayName || component.name || 'UnnamedContainer',
    acceptsChildren: true,
  };
}

/**
 * Extract the prop type from a component wrapper
 */
export type PropsOf<T extends ComponentWrapper<any>> = 
  T extends ComponentWrapper<infer P> ? P : never;

/**
 * Options builder for component configurations
 */
export class ComponentOptionsBuilder<P> {
  private props: Partial<P> = {};
  
  /**
   * Set a specific prop value
   */
  withProp<K extends keyof P>(key: K, value: P[K]): this {
    this.props[key] = value;
    return this;
  }
  
  /**
   * Set the label prop if it exists on the component
   */
  withLabel(label: string): this {
    if ('label' in this.props) {
      (this.props as any).label = label;
    } else {
      this.withProp('label' as keyof P, label as any);
    }
    return this;
  }
  
  /**
   * Set value prop if it exists on the component
   */
  withValue<T>(value: T): this {
    if ('value' in this.props) {
      (this.props as any).value = value;
    }
    return this;
  }
  
  /**
   * Set placeholder if it exists on the component
   */
  withPlaceholder(placeholder: string): this {
    if ('placeholder' in this.props) {
      (this.props as any).placeholder = placeholder;
    }
    return this;
  }
  
  /**
   * Set helper text if it exists on the component
   */
  withHelperText(text: string): this {
    if ('helperText' in this.props) {
      (this.props as any).helperText = text;
    }
    return this;
  }
  
  /**
   * Set required flag if it exists on the component
   */
  withRequired(required: boolean = true): this {
    if ('required' in this.props) {
      (this.props as any).required = required;
    }
    return this;
  }
  
  /**
   * Set disabled flag if it exists on the component
   */
  withDisabled(disabled: boolean = true): this {
    if ('disabled' in this.props) {
      (this.props as any).disabled = disabled;
    }
    return this;
  }
  
  /**
   * Set multiple props at once, with type checking
   */
  withProps(props: Partial<P>): this {
    this.props = { ...this.props, ...props };
    return this;
  }
  
  /**
   * Convenience method to explicitly set component-specific props,
   * with full type safety. This is just an alias for withProps.
   */
  withComponentProps(props: Partial<P>): this {
    return this.withProps(props);
  }
  
  /**
   * Get the current props object
   */
  getProps(): Partial<P> {
    return this.props;
  }
  
  /**
   * Create a new builder with the same props
   */
  clone(): ComponentOptionsBuilder<P> {
    const newBuilder = new ComponentOptionsBuilder();
    newBuilder.props = { ...this.props };
    return newBuilder;
  }
}

/**
 * Create options builder for a specific component type
 */
export function createComponentOptions<T extends ComponentWrapper<any>>(): ComponentOptionsBuilder<PropsOf<T>> {
  return new ComponentOptionsBuilder<PropsOf<T>>();
}

/**
 * Create options builder for a specific component instance
 */
export function createOptionsForComponent<T extends ComponentWrapper<any>>(
  _componentWrapper: T
): ComponentOptionsBuilder<PropsOf<T>> {
  // The componentWrapper param is only used for type inference (prefixed with _ to avoid unused var warning)
  return new ComponentOptionsBuilder<PropsOf<T>>();
}

/**
 * Element in a UI plan
 */
export interface UiElement {
  component: ComponentType<any>;
  props: any;
  children?: UiElement[];
}

/**
 * Builder for UI elements
 */
export class UiElementBuilder {
  private elements: UiElement[] = [];
  
  /**
   * Add a leaf component (no children) to the UI plan
   * This overload lets you provide the options builder directly
   */
  showComponent<T extends ComponentWrapper<any>>(
    componentWrapper: T,
    optionsBuilder: ComponentOptionsBuilder<PropsOf<T>>
  ): this;
  
  /**
   * Add a leaf component (no children) to the UI plan
   * This overload lets you configure the options with a callback
   */
  showComponent<T extends ComponentWrapper<any>>(
    componentWrapper: T,
    configFn: (builder: ComponentOptionsBuilder<PropsOf<T>>) => ComponentOptionsBuilder<PropsOf<T>>
  ): this;
  
  /**
   * Add a leaf component (no children) to the UI plan - implementation
   */
  showComponent<T extends ComponentWrapper<any>>(
    componentWrapper: T,
    optionsBuilderOrConfigFn: ComponentOptionsBuilder<PropsOf<T>> | 
      ((builder: ComponentOptionsBuilder<PropsOf<T>>) => ComponentOptionsBuilder<PropsOf<T>>)
  ): this {
    // Handle both overload cases
    let optionsBuilder: ComponentOptionsBuilder<PropsOf<T>>;
    
    if (typeof optionsBuilderOrConfigFn === 'function') {
      // If it's a config function, create a new builder and apply the function
      optionsBuilder = optionsBuilderOrConfigFn(createOptionsForComponent(componentWrapper));
    } else {
      // If it's already a builder, use it directly
      optionsBuilder = optionsBuilderOrConfigFn;
    }
    
    this.elements.push({
      component: componentWrapper.component,
      props: optionsBuilder.getProps(),
      children: undefined
    });
    return this;
  }
  
  /**
   * Add a container component to the UI plan
   * This overload lets you provide the options builder directly
   */
  showContainerComponent<T extends ComponentWrapper<any>>(
    componentWrapper: T,
    optionsBuilder: ComponentOptionsBuilder<PropsOf<T>>
  ): ContainerElementBuilder;
  
  /**
   * Add a container component to the UI plan
   * This overload lets you configure the options with a callback
   */
  showContainerComponent<T extends ComponentWrapper<any>>(
    componentWrapper: T,
    configFn: (builder: ComponentOptionsBuilder<PropsOf<T>>) => ComponentOptionsBuilder<PropsOf<T>>
  ): ContainerElementBuilder;
  
  /**
   * Add a container component to the UI plan - implementation
   */
  showContainerComponent<T extends ComponentWrapper<any>>(
    componentWrapper: T,
    optionsBuilderOrConfigFn: ComponentOptionsBuilder<PropsOf<T>> | 
      ((builder: ComponentOptionsBuilder<PropsOf<T>>) => ComponentOptionsBuilder<PropsOf<T>>)
  ): ContainerElementBuilder {
    // Handle both overload cases
    let optionsBuilder: ComponentOptionsBuilder<PropsOf<T>>;
    
    if (typeof optionsBuilderOrConfigFn === 'function') {
      // If it's a config function, create a new builder and apply the function
      optionsBuilder = optionsBuilderOrConfigFn(createOptionsForComponent(componentWrapper));
    } else {
      // If it's already a builder, use it directly
      optionsBuilder = optionsBuilderOrConfigFn;
    }
    
    const childElements: UiElement[] = [];
    
    const containerElement: UiElement = {
      component: componentWrapper.component,
      props: optionsBuilder.getProps(),
      children: childElements
    };
    
    this.elements.push(containerElement);
    
    return new ContainerElementBuilder(
      childElements,
      this
    );
  }
  
  /**
   * Get all UI elements built so far
   */
  build(): UiElement[] {
    return this.elements;
  }
}

/**
 * Builder for container elements
 */
export class ContainerElementBuilder {
  constructor(
    private childElements: UiElement[],
    private parentBuilder: UiElementBuilder
  ) {}
  
  /**
   * Add content to the container
   */
  containing(childBuilder: UiElementBuilder): UiElementBuilder {
    const childrenElements = childBuilder.build();
    this.childElements.push(...childrenElements);
    return this.parentBuilder;
  }
}

/**
 * UI Plan builder
 */
export class UiPlanBuilder {
  private name: string;
  private version: string;
  private schemas: any[] = [];
  private mainElementSet?: UiElement[];
  
  constructor(name: string, version: string = '1.0') {
    this.name = name;
    this.version = version;
  }
  
  /**
   * Add schemas to the UI plan
   */
  withSchema(schema: any | any[]): this {
    if (Array.isArray(schema)) {
      this.schemas.push(...schema);
    } else {
      this.schemas.push(schema);
    }
    return this;
  }
  
  /**
   * Set the main element set for the UI plan
   */
  withMainElementSet(elementBuilder: UiElementBuilder): this {
    this.mainElementSet = elementBuilder.build();
    return this;
  }
  
  /**
   * Build the final UI plan
   */
  build() {
    return {
      name: this.name,
      version: this.version,
      schemas: this.schemas,
      mainElementSet: this.mainElementSet
    };
  }
}

/**
 * Helper to render a UI element tree to React elements
 */
export function renderUiElement(element: UiElement): ReactElement {
  const { component, props, children } = element;
  
  // If there are children, include them in the props
  if (children?.length) {
    const renderedChildren = children.map(renderUiElement);
    return React.createElement(component, props, renderedChildren);
  }
  
  return React.createElement(component, props);
}

/**
 * Helper to render a UI plan to React elements
 */
export function renderUiPlan(uiPlan: ReturnType<UiPlanBuilder['build']>): ReactElement | null {
  if (!uiPlan.mainElementSet?.length) {
    return null;
  }
  
  if (uiPlan.mainElementSet.length === 1) {
    return renderUiElement(uiPlan.mainElementSet[0]);
  }
  
  return React.createElement(
    React.Fragment,
    null,
    ...uiPlan.mainElementSet.map(renderUiElement)
  );
}

// Export the main API as an object to match your current Re pattern
export const Re = {
  // Create a new UI plan
  UiPlan: (name: string, version?: string) => new UiPlanBuilder(name, version),
  
  // Create a new element builder
  Element: new UiElementBuilder(),
  
  // Component options factory methods
  ComponentOptions: {
    // Create options builder for a specific component (preferred API)
    forComponent: <T extends ComponentWrapper<any>>(componentWrapper: T) => 
      createOptionsForComponent(componentWrapper),
      
    // Create a generic options builder
    create: <T extends ComponentWrapper<any>>() => createComponentOptions<T>()
  },
  
  // Common component properties as standalone functions for more fluent API
  withLabel: (text: string) => 
    (builder) => builder.withLabel(text),
  
  withValue: (val: any) => 
    (builder) => builder.withValue(val),
    
  withPlaceholder: (text: string) => 
    (builder) => builder.withPlaceholder(text),
    
  withHelperText: (text: string) => 
    (builder) => builder.withHelperText(text),
    
  withRequired: (req: boolean = true) => 
    (builder) => builder.withRequired(req),
    
  withDisabled: (dis: boolean = true) => 
    (builder) => builder.withDisabled(dis),
  
  // Render helpers
  render: {
    element: renderUiElement,
    plan: renderUiPlan
  }
};
