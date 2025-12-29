import React, { useState } from 'react';
import {
  ContainerComponentProps,
  LeafComponentProps,
  defineContainerComponent,
  defineLeafComponent,
  withProps,
} from './reactComponentTypes';
import { Button, TextField, Card } from './componentExamples';

// Define a more complex form component

interface FormFieldProps extends LeafComponentProps {
  name: string;
  label: string;
  required?: boolean;
}

interface TextFormFieldProps extends FormFieldProps {
  type: 'text';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

interface NumberFormFieldProps extends FormFieldProps {
  type: 'number';
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

interface CheckboxFormFieldProps extends FormFieldProps {
  type: 'checkbox';
  checked: boolean;
  onChange: (checked: boolean) => void;
}

// Union type for all form field types
type FormFieldType = 
  | TextFormFieldProps 
  | NumberFormFieldProps 
  | CheckboxFormFieldProps;

// Form container props
interface FormProps extends ContainerComponentProps {
  onSubmit: (data: Record<string, any>) => void;
  fields: FormFieldType[];
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
}

// Form field component - renders the appropriate input based on type
export const FormField = defineLeafComponent<FormFieldType>((props) => {
  const { type, name, label, required } = props;
  
  switch (type) {
    case 'text':
      return withProps(TextField, {
        id: name,
        label: `${label}${required ? ' *' : ''}`,
        value: props.value,
        onChange: props.onChange,
        placeholder: props.placeholder,
      });
      
    case 'number':
      // In a real implementation, you'd have a NumberField component
      return (
        <div className="form-field">
          <label htmlFor={name}>{`${label}${required ? ' *' : ''}`}</label>
          <input
            id={name}
            type="number"
            value={props.value}
            onChange={(e) => props.onChange(parseFloat(e.target.value))}
            min={props.min}
            max={props.max}
          />
        </div>
      );
      
    case 'checkbox':
      return (
        <div className="form-field checkbox-field">
          <input
            id={name}
            type="checkbox"
            checked={props.checked}
            onChange={(e) => props.onChange(e.target.checked)}
          />
          <label htmlFor={name}>{`${label}${required ? ' *' : ''}`}</label>
        </div>
      );
  }
});

// Form component - a container that manages fields and handles submission
export const Form = defineContainerComponent<FormProps>((props) => {
  const { 
    fields, 
    onSubmit, 
    children,
    submitLabel = 'Submit',
    cancelLabel = 'Cancel',
    onCancel,
    ...restProps
  } = props;
  
  // State to track form values
  const [formValues, setFormValues] = useState<Record<string, any>>(() => {
    // Initialize form values from the fields
    const initialValues: Record<string, any> = {};
    fields.forEach(field => {
      if ('value' in field) {
        initialValues[field.name] = field.value;
      } else if ('checked' in field) {
        initialValues[field.name] = field.checked;
      }
    });
    return initialValues;
  });
  
  // Create field change handlers
  const createChangeHandler = (fieldName: string, _fieldType: FormFieldType['type']) => {
    return (value: any) => {
      setFormValues(prev => ({
        ...prev,
        [fieldName]: value
      }));
    };
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formValues);
  };
  
  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };
  
  return (
    <form {...restProps} onSubmit={handleSubmit} className="form">
      {/* Render each field with its current value and change handler */}
      {fields.map(field => {
        const fieldProps = {
          ...field,
          key: field.name,
        };
        
        // Update the field props with current value and change handler
        if ('value' in fieldProps) {
          fieldProps.value = formValues[field.name] ?? fieldProps.value;
          fieldProps.onChange = createChangeHandler(field.name, fieldProps.type);
        } else if ('checked' in fieldProps) {
          fieldProps.checked = formValues[field.name] ?? fieldProps.checked;
          fieldProps.onChange = createChangeHandler(field.name, fieldProps.type);
        }
        
        return FormField(fieldProps as FormFieldType);
      })}
      
      {/* Render children (additional form content) */}
      {children}
      
      {/* Form actions */}
      <div className="form__actions">
        {onCancel && (
          Button({
            label: cancelLabel,
            variant: 'secondary',
            onClick: handleCancel,
         //   type: 'button'
          }) as React.ReactElement)}
        
        
        {Button({
          label: submitLabel,
          variant: 'primary',
  //        type: 'submit'
        }) as React.ReactElement}
      </div>
    </form>
  );
});

// Example usage of the form
export const UserForm: React.FC = () => {
  const handleSubmit = (data: Record<string, any>) => {
    console.log('Form submitted with:', data);
  };
  
  return withProps(Card, {
    title: 'User Information',
    children: withProps(Form, {
      fields: [
        {
          type: 'text',
          name: 'firstName',
          label: 'First Name',
          value: '',
          onChange: () => {}, // Will be overridden by Form component
          required: true,
        },
        {
          type: 'text',
          name: 'lastName',
          label: 'Last Name',
          value: '',
          onChange: () => {}, // Will be overridden by Form component
          required: true,
        },
        {
          type: 'number',
          name: 'age',
          label: 'Age',
          value: 18,
          onChange: () => {}, // Will be overridden by Form component
          min: 0,
          max: 120,
        },
        {
          type: 'checkbox',
          name: 'subscribe',
          label: 'Subscribe to newsletter',
          checked: false,
          onChange: () => {}, // Will be overridden by Form component
        }
      ],
      onSubmit: handleSubmit,
      submitLabel: 'Save User',
      onCancel: () => console.log('Cancelled'),
    }),
  });
};
