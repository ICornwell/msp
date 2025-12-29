import React, { ReactNode } from 'react';
import { 
  createLeafComponent, 
  createContainerComponent 
} from './TypedRe';

// Define some example component props

/**
 * Button component props
 */
export interface ButtonProps {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  disabled?: boolean;
  buttonStyle?: 'standard' | 'flashy' | 'SuperFlashy';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
}

/**
 * Button component implementation
 */
const ButtonComponent: React.FC<ButtonProps> = (props) => {
  const { 
    label, 
    onClick, 
    variant = 'primary', 
    disabled, 
    buttonStyle = 'standard',
    size = 'medium',
    icon
  } = props;
  
  const buttonClass = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    `button-style--${buttonStyle}`,
    disabled ? 'button--disabled' : ''
  ].join(' ');
  
  return (
    <button 
      className={buttonClass} 
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="button__icon">{icon}</span>}
      <span className="button__label">{label}</span>
    </button>
  );
};

/**
 * Text field component props
 */
export interface TextFieldProps {
  label?: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  required?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Text field component implementation
 */
const TextFieldComponent: React.FC<TextFieldProps> = (props) => {
  const { 
    label, 
    value, 
    onChange, 
    placeholder, 
    disabled, 
    error,
    helperText,
    fullWidth,
    required,
    size = 'medium'
  } = props;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };
  
  const fieldClass = [
    'text-field',
    `text-field--${size}`,
    error ? 'text-field--error' : '',
    fullWidth ? 'text-field--full-width' : '',
    disabled ? 'text-field--disabled' : ''
  ].join(' ');
  
  return (
    <div className={fieldClass}>
      {label && (
        <label className="text-field__label">
          {label}
          {required && <span className="text-field__required">*</span>}
        </label>
      )}
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="text-field__input"
        required={required}
      />
      {helperText && (
        <div className={`text-field__helper-text ${error ? 'text-field__helper-text--error' : ''}`}>
          {helperText}
        </div>
      )}
    </div>
  );
};

/**
 * Card component props
 */
export interface CardProps {
  title?: string;
  children?: ReactNode;
  elevation?: number;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'outlined' | 'elevation';
  onClick?: () => void;
  noPadding?: boolean;
}

/**
 * Card component implementation
 */
const CardComponent: React.FC<CardProps> = (props) => {
  const { 
    title, 
    children, 
    elevation = 1, 
    className = '', 
    style,
    variant = 'elevation',
    onClick,
    noPadding = false
  } = props;
  
  const cardClass = [
    'card',
    `card--${variant}`,
    variant === 'elevation' ? `card--elevation-${elevation}` : '',
    noPadding ? 'card--no-padding' : '',
    className
  ].join(' ');
  
  return (
    <div 
      className={cardClass} 
      style={style}
      onClick={onClick}
    >
      {title && <div className="card__header">{title}</div>}
      <div className="card__content">{children}</div>
    </div>
  );
};

/**
 * Columns component props
 */
export interface ColumnsProps {
  columns: number;
  fillDirection?: 'down' | 'across';
  spacing?: number;
  children?: ReactNode;
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Columns component implementation
 */
const ColumnsComponent: React.FC<ColumnsProps> = (props) => {
  const { 
    columns, 
    fillDirection = 'down', 
    spacing = 16, 
    children,
    alignItems = 'stretch',
    className = '',
    style
  } = props;
  
  const columnsClass = [
    'columns',
    `columns--${columns}`,
    `columns--fill-${fillDirection}`,
    `columns--align-${alignItems}`,
    className
  ].join(' ');
  
  const columnStyle = {
    ...style,
    '--column-count': columns,
    '--column-spacing': `${spacing}px`,
  } as React.CSSProperties;
  
  return (
    <div className={columnsClass} style={columnStyle}>
      {children}
    </div>
  );
};

// Create and export the wrapped components
export const Button = createLeafComponent<ButtonProps>(ButtonComponent, 'Button');
export const TextField = createLeafComponent<TextFieldProps>(TextFieldComponent, 'TextField');
export const Card = createContainerComponent<CardProps>(CardComponent, 'Card');
export const Columns = createContainerComponent<ColumnsProps>(ColumnsComponent, 'Columns');
