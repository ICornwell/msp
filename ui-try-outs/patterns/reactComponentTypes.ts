import React, { ReactNode, ReactElement } from 'react';

// Basic component types to distinguish between components that accept children and those that don't

/**
 * Base type for all component props
 */
export interface BaseComponentProps {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  // Add other common props here
}

/**
 * Type for components that don't accept children
 */
export interface LeafComponentProps extends BaseComponentProps {
  // Leaf components don't have children
}

/**
 * Type for components that do accept children
 */
export interface ContainerComponentProps extends BaseComponentProps {
  children?: ReactNode;
}

/**
 * Type guard to check if a component accepts children
 */
export function isContainerComponent<P extends BaseComponentProps>(
  component: React.ComponentType<P>
): component is React.ComponentType<P & ContainerComponentProps> {
  // This is a simple way to check - you might need a more sophisticated approach
  // such as a registry of components or metadata
  return (component as any).acceptsChildren === true;
}

// Component type definitions with generics for better inference

/**
 * Type for a function that creates a React element from props
 */
export type ComponentRenderer<P> = (props: P) => ReactElement;

/**
 * Type for a leaf component (no children)
 */
export type LeafComponent<P extends LeafComponentProps> = ComponentRenderer<P>;

/**
 * Type for a container component (accepts children)
 */
export type ContainerComponent<P extends ContainerComponentProps> = ComponentRenderer<P>;

/**
 * Helper to mark a component as one that accepts children
 */
export function defineContainerComponent<P extends ContainerComponentProps>(
  renderer: ContainerComponent<P>
): ContainerComponent<P> {
  (renderer as any).acceptsChildren = true;
  return renderer;
}

/**
 * Helper to mark a component as one that doesn't accept children
 */
export function defineLeafComponent<P extends LeafComponentProps>(
  renderer: LeafComponent<P>
): LeafComponent<P> {
  (renderer as any).acceptsChildren = false;
  return renderer;
}

/**
 * Get the prop type from a component type using inference
 */
export type PropsOf<T extends ComponentRenderer<any>> = 
  T extends ComponentRenderer<infer P> ? P : never;

/**
 * Type-safe withProps helper that correctly infers and enforces prop types
 */
export function withProps<
  C extends ComponentRenderer<any>,
  P extends PropsOf<C>
>(component: C, props: P): ReactElement {
  return component(props as any);
}

// Optional: Create a typed createElement function similar to React.createElement
export function createElement<P extends BaseComponentProps>(
  component: ComponentRenderer<P>,
  props: P
): ReactElement {
  return component(props);
}
