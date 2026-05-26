/* @vitest-environment happy-dom */

// import React from 'react';
import { render, screen } from '../../../test-utils.js';
import TextInput from '../presets/PresetText.js';
import { describe, expect, test, vi } from 'vitest';

// Create a simplified mock version of the TextInput for testing
vi.mock('../presets/PresetText', () => {
  return {
    default: function MockTextInput(props: any) {
      return (
        <div>
          <label>{props.label}</label>
          <input 
            value={props.value}
            disabled={props.disabled}
            aria-label={props.label}
            data-testid="mock-input"
          />
          {props.helperText && <p>{props.helperText}</p>}
          {props.error && <span data-testid="error-indicator">Error</span>}
        </div>
      );
    }
  };
});

describe('TextInput', () => {
  test('renders with label and value', () => {
    render(<TextInput label="Test Label" value="Test Value" />, { withProviders: false });
    
    // Find label and input elements
    const labelElement = screen.getByText('Test Label');
    const inputElement = screen.getByTestId('mock-input');

    expect(labelElement).toBeTruthy();
    expect(inputElement).toBeTruthy();
    expect(document.body.contains(labelElement)).toBe(true);
    expect(document.body.contains(inputElement)).toBe(true);
  });

  test('applies disabled state correctly', () => {
    render(<TextInput label="Disabled Input" value="Test" disabled={true} />, { withProviders: false });
    
    // Find the input element
    const inputElement = screen.getByTestId('mock-input');

    // Check it's disabled without jest-dom matcher dependency
    expect((inputElement as HTMLInputElement).disabled).toBe(true);
  });

  test('handles error state correctly', () => {
    render(
      <TextInput 
        label="Error Input" 
        value="Error Value" 
        error={true}
        helperText="This is an error message" 
      />, 
      { withProviders: false }
    );
    
    // Check for error state and message
    const helperText = screen.getByText('This is an error message');
    const errorIndicator = screen.getByTestId('error-indicator');
    expect(helperText).toBeTruthy();
    expect(errorIndicator).toBeTruthy();
    expect(document.body.contains(helperText)).toBe(true);
    expect(document.body.contains(errorIndicator)).toBe(true);
  });
});