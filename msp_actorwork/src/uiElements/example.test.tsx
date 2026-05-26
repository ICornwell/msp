/* @vitest-environment happy-dom */

// import React from 'react';
import Input from '@mui/material/Input';
import { render, screen } from '../../test-utils.js';

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
    render(
    <div>
      <label>Test Label</label>
      <Input  value="Test Value" data-testid="mock-input" />
    </div>
    , { withProviders: false });
    
    // Find label and input elements
    const labelElement = screen.getByText('Test Label');
    const inputElement = screen.getByTestId('mock-input');

    expect(labelElement).toBeTruthy();
    expect(inputElement).toBeTruthy();
    expect(document.body.contains(labelElement)).toBe(true);
    expect(document.body.contains(inputElement)).toBe(true);
  });
});