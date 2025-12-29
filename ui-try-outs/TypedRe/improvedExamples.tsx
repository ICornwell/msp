import React from 'react';
import { 
  UiElementBuilder, 
  Re, 
  renderUiPlan,
} from './TypedRe';
import { 
  Button, 
  TextField, 
  Card, 
  Columns,
} from './components';

/**
 * Example demonstrating the improved TypedRe API with automatic type inference
 */
export function ImprovedTypedReExample() {
  // Create a new UI plan using the improved API
  const uiPlan = Re.UiPlan('ImprovedApi', '1.0')
    .withMainElementSet(
      Re.Element
        // Add a card container with a callback-style configuration
        .showContainerComponent(
          Card,
          builder => builder
            .withProp('title', 'User Information')
            .withProp('elevation', 2)
        )
        .containing(
          Re.Element
            // Add a text field with automatic type inference
            .showComponent(
              TextField,
              builder => builder
                .withLabel('Name')
                .withValue('')
                .withPlaceholder('Enter your name')
                .withRequired()
                .withProp('fullWidth', true)
            )
            // Add a text field with automatic type inference and specific prop API
            .showComponent(
              TextField,
              builder => builder
                .withLabel('Email')
                .withValue('')
                .withPlaceholder('Enter your email')
                .withHelperText('We will never share your email')
                // Type-safe component-specific props
                .withComponentProps({
                  error: false,
                  fullWidth: true
                })
            )
            // Add a button with automatic type inference
            .showComponent(
              Button,
              builder => builder
                .withLabel('Submit')
                .withProp('variant', 'primary')
                .withProp('buttonStyle', 'flashy')
            )
        )
    )
    .build();

  // Render the UI plan
  return renderUiPlan(uiPlan);
}

/**
 * Example of a more complex form with the improved API
 */
export function ImprovedComplexExample() {
  // Create a new UI plan with a more complex layout
  const uiPlan = Re.UiPlan('ImprovedComplex', '1.0')
    .withMainElementSet(
      Re.Element
        // Add a container with columns for a two-column layout
        .showContainerComponent(
          Columns,
          builder => builder
            .withProp('columns', 2)
            .withProp('spacing', 24)
        )
        .containing(
          Re.Element
            // First column: Personal Information
            .showContainerComponent(
              Card,
              builder => builder
                .withProp('title', 'Personal Information')
                .withProp('variant', 'outlined')
            )
            .containing(
              Re.Element
                .showComponent(
                  TextField,
                  builder => builder
                    .withLabel('First Name')
                    .withValue('')
                    .withProp('fullWidth', true)
                )
                .showComponent(
                  TextField,
                  builder => builder
                    .withLabel('Last Name')
                    .withValue('')
                    .withProp('fullWidth', true)
                )
            )
            // Second column: Account Information
            .showContainerComponent(
              Card,
              builder => builder
                .withProp('title', 'Account Information')
                .withProp('variant', 'outlined')
            )
            .containing(
              Re.Element
                .showComponent(
                  TextField,
                  builder => builder
                    .withLabel('Username')
                    .withValue('')
                    .withProp('fullWidth', true)
                )
                .showComponent(
                  TextField,
                  builder => builder
                    .withLabel('Email Address')
                    .withValue('')
                    .withRequired()
                    .withHelperText('Required for account confirmation')
                )
                .showComponent(
                  Button,
                  builder => builder
                    .withLabel('Create Account')
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
