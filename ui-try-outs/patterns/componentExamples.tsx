import React from 'react';
import {
  LeafComponentProps,
  ContainerComponentProps,
  defineLeafComponent,
  defineContainerComponent,
  withProps,
  PropsOf,
} from './reactComponentTypes';

// Define interfaces for specific component props

// Button doesn't accept children
export interface ButtonProps extends LeafComponentProps {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  disabled?: boolean;
}

// Card accepts children
export interface CardProps extends ContainerComponentProps {
  title?: string;
  elevation?: number;
  noPadding?: boolean;
}

// Text field doesn't accept children
export interface TextFieldProps extends LeafComponentProps {
  label?: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

// Define components with the appropriate types

// Button component - a leaf component (no children)
export const Button = defineLeafComponent<ButtonProps>((props) => {
  const { label, onClick, variant = 'primary', disabled, id, className, style } = props;
  
  // Create class name based on variant
  const buttonClass = `button button--${variant} ${disabled ? 'button--disabled' : ''} ${className || ''}`;
  
  return (
    <button 
      id={id}
      className={buttonClass} 
      style={style}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
});

// Card component - a container component (accepts children)
export const Card = defineContainerComponent<CardProps>((props) => {
  const { 
    children, 
    title, 
    elevation = 1, 
    noPadding = false,
    id,
    className,
    style
  } = props;
  
  const cardClass = `card elevation-${elevation} ${noPadding ? 'no-padding' : ''} ${className || ''}`;
  
  return (
    <div id={id} className={cardClass} style={style}>
      {title && <div className="card__header">{title}</div>}
      <div className="card__content">
        {children}
      </div>
    </div>
  );
});

// TextField component - a leaf component (no children)
export const TextField = defineLeafComponent<TextFieldProps>((props) => {
  const { 
    label, 
    value, 
    onChange, 
    placeholder, 
    disabled, 
    error,
    helperText,
    id,
    className,
    style
  } = props;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };
  
  const inputClass = `text-field ${error ? 'text-field--error' : ''} ${className || ''}`;
  
  return (
    <div className={inputClass} style={style}>
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
      />
      {helperText && (
        <div className={`text-field__helper-text ${error ? 'text-field__helper-text--error' : ''}`}>
          {helperText}
        </div>
      )}
    </div>
  );
});

// Example usage
export const ExampleUsage: React.FC = () => {
  // Using the withProps helper with type inference
  const button = withProps(Button, {
    label: 'Click Me',
    variant: 'primary',
    onClick: () => console.log('Button clicked'),
  });
  
  // TypeScript would error here: missing required 'value' prop
  // const invalidTextField = withProps(TextField, {
  //   label: 'Name',
  // });
  
  // Correct usage
  const textField = withProps(TextField, {
    label: 'Name',
    value: '',
    placeholder: 'Enter your name',
    onChange: (value) => console.log('Input changed:', value),
  });
  
  // Using a container component with children
  const card = withProps(Card, {
    title: 'Example Card',
    children: (
      <>
        {button}
        {textField}
      </>
    ),
  });
  
  return (
    <div className="example">
      {card}
    </div>
  );
};

// Example of getting the props type from a component
type ButtonPropsType = PropsOf<typeof Button>; // ButtonProps
type CardPropsType = PropsOf<typeof Card>;     // CardProps

// Function that works with dynamically determined prop types
export function createButtonWithDefaults<T extends Partial<ButtonPropsType>>(
  defaults: T
) {
  return (props: Omit<ButtonPropsType, keyof T> & Partial<T>) => {
    const mergedProps = { ...defaults, ...props } as ButtonPropsType;
    return Button(mergedProps);
  };
}

// Create a primary button with some defaults
export const PrimaryButton = createButtonWithDefaults({
  variant: 'primary' as const,
});

// Now you can use it with proper type inference
export const ExampleDefaultsUsage: React.FC = () => {
  return (
    <div>
      {/* No need to specify variant, it's set in the defaults */}
      {PrimaryButton({
        label: 'Primary Action',
        onClick: () => console.log('Primary action clicked'),
      })}
    </div>
  );
};
