import { useEffect } from 'react';
import { useEngineComponentsContext } from '../../msp_fes/src/ui/renderEngine/contexts/ReComponentsContext';
import { ReComponentWrapperProps } from '../../msp_fes/src/ui/renderEngine/components/ReComponentProps';
import { ComponentRegistry } from './integration';
import { Button, TextField, Card, Columns } from './components';

/**
 * Registry of TypedRe components for integration with the existing ReEngine
 */
export const typedComponentRegistry = new ComponentRegistry();

/**
 * Register TypedRe components with the existing Engine Components system
 */
export function RegisterTypedReComponents() {
  const { addComponent, addContainerComponent } = useEngineComponentsContext();

  // Register leaf components
  useEffect(() => {
    // Register leaf components
    typedComponentRegistry.registerComponent(Button.component);
    addComponent(Button.displayName, (props: ReComponentWrapperProps) => <Button.component {...mapToProps(props)} />);
    
    typedComponentRegistry.registerComponent(TextField.component);
    addComponent(TextField.displayName, (props: ReComponentWrapperProps) => <TextField.component {...mapToProps(props)} />);

    // Register container components
    typedComponentRegistry.registerComponent(Card.component);
    addContainerComponent(Card.displayName, (props: ReComponentWrapperProps) => <Card.component {...mapToProps(props)} />);
    
    typedComponentRegistry.registerComponent(Columns.component);
    addContainerComponent(Columns.displayName, (props: ReComponentWrapperProps) => <Columns.component {...mapToProps(props)} />);
    
    return () => {
      // Cleanup function if needed
    };
  }, [addComponent, addContainerComponent]);

  // Nothing to render
  return null;
}

/**
 * Map RE component wrapper props to TypedRE component props
 */
function mapToProps(props: ReComponentWrapperProps): any {
  // Extract the actual component props
  const componentProps = props.options?.componentProps || {};
  
  // Map common props that might be at the ReComponentWrapperProps level
  return {
    ...componentProps,
    // Common properties that might be in options
    label: props.options?.label || componentProps.label,
    disabled: props.options?.disabled || componentProps.disabled,
    error: props.options?.error || componentProps.error,
    helperText: props.options?.helperText || componentProps.helperText,
    // Handle value (from binding)
    value: props.value !== undefined ? props.value : componentProps.value,
    // If there are children, pass them through
    children: props.children
  };
}
