import React, { useState, useEffect, useRef } from 'react';
import { TextField } from "@mui/material";
import { v4 as uuidv4 } from 'uuid';

export interface TextInputProps {
  label: string;
  value: string;
  testId?: string;
  type?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

export default function TextInput(props: TextInputProps) {
  const { label, value, type, error, testId, helperText, disabled, onChange } = props;
  
  // Create a unique ID for this component instance
  const componentId = useRef(uuidv4()).current;
  
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handler for input changes
  const handleInput = (e: any) => {
    const newValue = e?.target?.value;
    setInputValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <TextField
      data-testid={testId}
      inputRef={inputRef}
      value={inputValue}
      onChange={handleInput}
      type={type}
      label={label}
      helperText={helperText}
      error={error}
      disabled={disabled}
    />
  );
}