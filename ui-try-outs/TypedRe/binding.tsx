import React, { useState, useCallback, useMemo } from 'react';
import { UiPlanBuilder, ComponentWrapper, ComponentOptionsBuilder, PropsOf } from './TypedRe';
import { TypedReEngine } from './TypedReEngine';

/**
 * Helper types for binding data to components
 */
export type BindingPath = string[];

export interface Binding<T = any> {
  path: BindingPath;
  get: (data: any) => T;
  set: (data: any, value: T) => void;
}

/**
 * Create a binding for a data path
 */
export function createBinding<T = any>(path: string | string[]): Binding<T> {
  // Convert string path like 'user.profile.name' to ['user', 'profile', 'name']
  const pathArray: string[] = typeof path === 'string' ? path.split('.') : path;
  
  return {
    path: pathArray,
    get: (data: any): T => {
      let current = data;
      for (const segment of pathArray) {
        if (current === undefined || current === null) return undefined as any;
        current = current[segment];
      }
      return current as T;
    },
    set: (data: any, value: T): void => {
      let current = data;
      for (let i = 0; i < pathArray.length - 1; i++) {
        const segment = pathArray[i];
        // Create the path if it doesn't exist
        if (current[segment] === undefined || current[segment] === null) {
          current[segment] = {};
        }
        current = current[segment];
      }
      
      // Set the final value
      current[pathArray[pathArray.length - 1]] = value;
    }
  };
}

/**
 * Create a component options builder with a binding
 */
export function withBinding<T extends ComponentWrapper<any>, V>(
  componentWrapper: T,
  binding: Binding<V>,
  data: any,
  onDataChange?: (path: string[], value: any) => void
): ComponentOptionsBuilder<PropsOf<T>> {
  // Create the options builder
  const builder = new ComponentOptionsBuilder<PropsOf<T>>();
  
  // Get the current value
  const value = binding.get(data);
  
  // Set the value prop if it exists
  if ('value' in builder.getProps()) {
    builder.withProp('value' as any, value);
  }
  
  // Add onChange handler if it exists
  if ('onChange' in builder.getProps()) {
    builder.withProp('onChange' as any, (newValue: V) => {
      binding.set(data, newValue);
      if (onDataChange) {
        onDataChange(binding.path, newValue);
      }
    });
  }
  
  return builder;
}

/**
 * A higher-level component that makes it easy to use TypedRe with data binding
 */
export function TypedReForm({
  initialData = {},
  onSubmit,
  children,
  renderUiPlan
}: {
  initialData?: any;
  onSubmit?: (data: any) => void;
  children?: React.ReactNode;
  renderUiPlan: (data: any, updateData: (path: string[], value: any) => void) => ReturnType<UiPlanBuilder['build']>;
}) {
  // State for form data
  const [data, setData] = useState(initialData);
  
  // Handler for data changes
  const handleDataChange = useCallback((path: string[], value: any) => {
    setData(prevData => {
      // Create a copy of the previous data
      const newData = { ...prevData };
      
      // Navigate to the right place to set the value
      let current = newData;
      for (let i = 0; i < path.length - 1; i++) {
        const segment = path[i];
        if (current[segment] === undefined || current[segment] === null) {
          current[segment] = {};
        }
        current = current[segment];
      }
      
      // Set the value
      current[path[path.length - 1]] = value;
      
      return newData;
    });
  }, []);
  
  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(data);
    }
  }, [data, onSubmit]);
  
  // Create the UI plan using the provided function
  const uiPlan = useMemo(() => {
    return renderUiPlan(data, handleDataChange);
  }, [data, renderUiPlan, handleDataChange]);
  
  return (
    <form onSubmit={handleSubmit}>
      <TypedReEngine
        uiPlan={uiPlan}
        sourceData={data}
        onDataChange={handleDataChange}
      />
      {children}
    </form>
  );
}
