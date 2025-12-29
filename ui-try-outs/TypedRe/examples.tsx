import React from 'react';
import { 
  UiElementBuilder, 
  ComponentOptionsBuilder, 
  Re, 
  renderUiPlan,
  PropsOf
} from './TypedRe';
import { 
  Button, 
  TextField, 
  Card, 
  Columns,
  ButtonProps,
  TextFieldProps
} from './components';

/**
 * Example of building a form with TypedRe
 */
export function TypedReExample() {
  // Create a new UI plan
  const uiPlan = Re.UiPlan('ExampleForm', '1.0')
    .withMainElementSet(
      new UiElementBuilder()
        // Add a card container
        .showContainerComponent(
          Card,
          new ComponentOptionsBuilder<PropsOf<typeof Card>>()
            .withProp('title', 'User Information')
            .withProp('elevation', 2)
        )
        .containing(
          new UiElementBuilder()
            // Add a text field for the name
            .showComponent(
              TextField,
              new ComponentOptionsBuilder<TextFieldProps>()
                .withProp('label', 'Name')
                .withProp('value', '')
                .withProp('placeholder', 'Enter your name')
                .withProp('required', true)
            )
            // Add a text field for the email
            .showComponent(
              TextField,
              new ComponentOptionsBuilder<TextFieldProps>()
                .withProp('label', 'Email')
                .withProp('value', '')
                .withProp('placeholder', 'Enter your email')
                .withProp('helperText', 'We will never share your email')
            )
            // Add a submit button
            .showComponent(
              Button,
              new ComponentOptionsBuilder<ButtonProps>()
                .withProp('label', 'Submit')
                .withProp('variant', 'primary')
            )
        )
    )
    .build();

  // Render the UI plan
  return renderUiPlan(uiPlan);
}

/**
 * More complex example with nested components and columns
 */
export function ComplexTypedReExample() {
  // Create a new UI plan with a more complex layout
  const uiPlan = Re.UiPlan('ComplexForm', '1.0')
    .withMainElementSet(
      new UiElementBuilder()
        // Add a container with columns for a two-column layout
        .showContainerComponent(
          Columns,
          new ComponentOptionsBuilder<PropsOf<typeof Columns>>()
            .withProp('columns', 2)
            .withProp('spacing', 24)
        )
        .containing(
          new UiElementBuilder()
            // First column: Personal Information
            .showContainerComponent(
              Card,
              new ComponentOptionsBuilder<PropsOf<typeof Card>>()
                .withProp('title', 'Personal Information')
                .withProp('elevation', 1)
                .withProp('variant', 'outlined')
            )
            .containing(
              new UiElementBuilder()
                .showComponent(
                  TextField,
                  new ComponentOptionsBuilder<TextFieldProps>()
                    .withProp('label', 'First Name')
                    .withProp('value', '')
                    .withProp('fullWidth', true)
                )
                .showComponent(
                  TextField,
                  new ComponentOptionsBuilder<TextFieldProps>()
                    .withProp('label', 'Last Name')
                    .withProp('value', '')
                    .withProp('fullWidth', true)
                )
                .showComponent(
                  TextField,
                  new ComponentOptionsBuilder<TextFieldProps>()
                    .withProp('label', 'Phone Number')
                    .withProp('value', '')
                    .withProp('helperText', 'Optional')
                    .withProp('fullWidth', true)
                )
            )
            // Second column: Account Information
            .showContainerComponent(
              Card,
              new ComponentOptionsBuilder<PropsOf<typeof Card>>()
                .withProp('title', 'Account Information')
                .withProp('elevation', 1)
                .withProp('variant', 'outlined')
            )
            .containing(
              new UiElementBuilder()
                .showComponent(
                  TextField,
                  new ComponentOptionsBuilder<TextFieldProps>()
                    .withProp('label', 'Username')
                    .withProp('value', '')
                    .withProp('fullWidth', true)
                )
                .showComponent(
                  TextField,
                  new ComponentOptionsBuilder<TextFieldProps>()
                    .withProp('label', 'Email Address')
                    .withProp('value', '')
                    .withProp('fullWidth', true)
                    .withProp('required', true)
                    .withProp('helperText', 'Required for account confirmation')
                )
                .showComponent(
                  Button,
                  new ComponentOptionsBuilder<ButtonProps>()
                    .withProp('label', 'Create Account')
                    .withProp('variant', 'primary')
                    .withProp('size', 'large')
                )
            )
        )
    )
    .build();

  // Render the UI plan
  return renderUiPlan(uiPlan);
}

/**
 * Example demonstrating fluent API usage with the Re helper
 */
export function FluentTypedReExample() {
  // Using the Re helper for a more concise API
  const uiPlan = Re.UiPlan('FluentForm', '1.0')
    .withMainElementSet(
      Re.Element
        .showContainerComponent(
          Card,
          Re.ComponentOptions.forComponent(Card)
            .withProp('title', 'Login Form')
        )
        .containing(
          Re.Element
            .showComponent(
              TextField,
              Re.ComponentOptions.forComponent(TextField)
                .withProp('label', 'Username')
                .withProp('value', '')
                .withProp('placeholder', 'Enter your username')
                .withProp('fullWidth', true)
            )
            .showComponent(
              TextField,
              Re.ComponentOptions.forComponent(TextField)
                .withProp('label', 'Password')
                .withProp('value', '')
                .withProp('placeholder', '********')
                .withProp('fullWidth', true)
                .withProp('helperText', 'Never share your password')
            )
            .showComponent(
              Button,
              Re.ComponentOptions.forComponent(Button)
                .withProp('label', 'Sign In')
                .withProp('variant', 'primary')
                .withProp('buttonStyle', 'flashy')
            )
        )
    )
    .build();

  return renderUiPlan(uiPlan);
}
