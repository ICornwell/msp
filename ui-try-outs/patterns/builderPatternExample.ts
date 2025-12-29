import { createTextInputBuilder, processFormField } from './advancedBuilderPattern';
import { processComponentBuilder, createButtonBuilder, createTextFieldBuilder } from './builderPattern';

// This example shows how to use the builder patterns with type checking

// Example 1: Basic component builders
export function basicBuilderExample() {
  // Both builders follow the ComponentBuilderFunction pattern
  const button = processComponentBuilder(createButtonBuilder)
    .setLabel('Click Me')
    .setDisabled(false)
    .build();
    
  const textField = processComponentBuilder(createTextFieldBuilder)
    .setLabel('Enter Name')
    .setValue('John Doe')
    .build();
    
  return { button, textField };
}

// Example 2: Advanced form field builder with inheritance
export function advancedBuilderExample() {
  // The text input builder follows the FormFieldBuilderFunction pattern
  // which extends BaseBuilderFunction which extends ComponentBuilderFunction
  const textInput = processFormField(createTextInputBuilder)
    // Base component methods
    .setId('name-field')
    .setClassName('form-control')
    .setLabel('Name')
    .setDisabled(false)
    
    // Form field methods
    .setName('userName')
    .setRequired(true)
    .setValidationMessage('Please enter your name')
    
    // Text input specific methods
    .setPlaceholder('Enter your full name')
    .setMaxLength(50)
    .build();
    
  return { textInput };
}

// This would cause a TypeScript error because createButtonBuilder doesn't 
// conform to the FormFieldBuilderFunction pattern
/*
const invalidUsage = processFormField(createButtonBuilder);
*/

// Example of applying to your existing components
export function applyToRenderEngine() {
  // This is how you might integrate these patterns with your existing render engine
  const form = {
    type: 'form',
    fields: [
      basicBuilderExample().button,
      basicBuilderExample().textField,
      advancedBuilderExample().textInput
    ]
  };
  
  return form;
}
