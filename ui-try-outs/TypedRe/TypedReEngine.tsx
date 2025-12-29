import React, { ReactElement } from 'react';
import { renderUiPlan } from './TypedRe';
import { DeepProxy } from 'proxy-deep';

/**
 * Engine component for rendering TypedRe UI plans
 */
interface TypedReEngineProps {
  uiPlan: ReturnType<typeof import('./TypedRe').UiPlanBuilder.prototype.build>;
  sourceData?: any;
  onDataChange?: (path: string[], value: any) => void;
}

/**
 * Main component for rendering TypedRe UI plans
 * This provides a bridge between the strongly-typed UI plans
 * and the runtime data binding and event handling
 */
export function TypedReEngine({
  uiPlan,
  sourceData = {},
  onDataChange
}: TypedReEngineProps): ReactElement | null {
  // Create a proxy for the source data to track access and mutations
  const proxiedData = React.useMemo(() => {
    if (!sourceData) return {};
    
    return new DeepProxy(sourceData, {
      get(target, key, receiver) {
        // Get the actual value
        const value = Reflect.get(target, key, receiver);
        
        // For objects, continue proxying
        if (typeof value === 'object' && value !== null) {
          const proxiedValue = this.nest(value);
          return {
            path: [...this.path, key],
            key: key,
            value: proxiedValue
          };
        } else {
          // For primitives, return with path information
          return {
            path: [...this.path, key],
            key: key,
            value: value
          };
        }
      },
      
      set(target, key, value) {
        // Set the new value
        const result = Reflect.set(target, key, value);
        
        // Notify about the change if a handler is provided
        if (onDataChange) {
          onDataChange([...this.path, key], value);
        }
        
        return result;
      }
    });
  }, [sourceData, onDataChange]);
  
  // Render the UI plan using the provided data
  return renderUiPlan(uiPlan);
}

/**
 * Factory function to create a data binding for a component prop
 * to a specific path in the data
 */
export function createBinding(path: string[]) {
  return {
    path,
    getValue: (data: any) => {
      let current = data;
      for (const key of path) {
        if (current == null) return undefined;
        current = current[key];
      }
      return current;
    },
    setValue: (data: any, value: any) => {
      let current = data;
      const lastKey = path[path.length - 1];
      
      // Navigate to the parent object
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (current[key] == null) {
          current[key] = typeof path[i + 1] === 'number' ? [] : {};
        }
        current = current[key];
      }
      
      // Set the value on the parent
      current[lastKey] = value;
    }
  };
}

/**
 * Enhanced version of TypedReEngine that supports data binding
 */
export function BindableTypedReEngine({
  uiPlan,
  sourceData = {},
  onDataChange,
  bindings = {}
}: TypedReEngineProps & { bindings?: Record<string, ReturnType<typeof createBinding>> }) {
  // Track the current state
  const [data, setData] = React.useState(sourceData);
  
  // Handle data changes
  const handleDataChange = React.useCallback((path: string[], value: any) => {
    setData(prevData => {
      // Clone the previous data
      const newData = { ...prevData };
      
      // Navigate to the correct location and update the value
      let current = newData;
      const lastKey = path[path.length - 1];
      
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (current[key] == null) {
          current[key] = typeof path[i + 1] === 'number' ? [] : {};
        }
        current = current[key];
      }
      
      current[lastKey] = value;
      
      // Notify parent component if needed
      if (onDataChange) {
        onDataChange(path, value);
      }
      
      return newData;
    });
  }, [onDataChange]);
  
  return (
    <TypedReEngine
      uiPlan={uiPlan}
      sourceData={data}
      onDataChange={handleDataChange}
    />
  );
}
