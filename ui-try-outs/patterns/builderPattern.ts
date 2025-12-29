// Type definitions for builder pattern functions

// Basic builder function type with required methods
export type ComponentBuilderFunction<TConfig, TComponent> = (initialConfig?: TConfig) => {
  // Common methods that must exist on all component builders
  setLabel: (label: string) => ReturnType<ComponentBuilderFunction<TConfig, TComponent>>;
  setDisabled: (disabled: boolean) => ReturnType<ComponentBuilderFunction<TConfig, TComponent>>;
  setHidden: (hidden: boolean) => ReturnType<ComponentBuilderFunction<TConfig, TComponent>>;
  
  // The build method to finalize and return the component
  build: () => TComponent;
};

// Example types for components we might build
export interface ButtonConfig {
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
  hidden?: boolean;
}

export interface ButtonComponent {
  type: 'button';
  config: ButtonConfig;
}

export interface TextFieldConfig {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  hidden?: boolean;
}

export interface TextFieldComponent {
  type: 'textField';
  config: TextFieldConfig;
}

// Implementation of builders that conform to the pattern

// Button builder that follows the ComponentBuilderFunction pattern
export const createButtonBuilder: ComponentBuilderFunction<ButtonConfig, ButtonComponent> = 
  (initialConfig = {}) => {
    let config: ButtonConfig = { ...initialConfig };
    
    return {
      setLabel: (label) => {
        config.label = label;
        return createButtonBuilder(config);
      },
      setDisabled: (disabled) => {
        config.disabled = disabled;
        return createButtonBuilder(config);
      },
      setHidden: (hidden) => {
        config.hidden = hidden;
        return createButtonBuilder(config);
      },
      // Additional button-specific methods could be added
      setOnClick: (onClick) => {
        config.onClick = onClick;
        return createButtonBuilder(config);
      },
      build: () => ({
        type: 'button',
        config
      })
    };
  };

// TextField builder that also follows the ComponentBuilderFunction pattern
export const createTextFieldBuilder: ComponentBuilderFunction<TextFieldConfig, TextFieldComponent> = 
  (initialConfig = {}) => {
    let config: TextFieldConfig = { ...initialConfig };
    
    return {
      setLabel: (label) => {
        config.label = label;
        return createTextFieldBuilder(config);
      },
      setDisabled: (disabled) => {
        config.disabled = disabled;
        return createTextFieldBuilder(config);
      },
      setHidden: (hidden) => {
        config.hidden = hidden;
        return createTextFieldBuilder(config);
      },
      // Additional text field-specific methods
      setValue: (value) => {
        config.value = value;
        return createTextFieldBuilder(config);
      },
      setOnChange: (onChange) => {
        config.onChange = onChange;
        return createTextFieldBuilder(config);
      },
      build: () => ({
        type: 'textField',
        config
      })
    };
  };

// Function that accepts any builder conforming to ComponentBuilderFunction
export function processComponentBuilder<TConfig, TComponent>(
  builderFn: ComponentBuilderFunction<TConfig, TComponent>,
  initialConfig?: TConfig
): TComponent {
  return builderFn(initialConfig).build();
}

// Usage example
export function createExampleComponent() {
  // Type safety is enforced - both builders conform to ComponentBuilderFunction
  const button = processComponentBuilder(createButtonBuilder, { label: 'Click Me' });
  const textField = processComponentBuilder(createTextFieldBuilder, { label: 'Enter text' });
  
  return [button, textField];
}
