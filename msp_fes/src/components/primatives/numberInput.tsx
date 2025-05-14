import { TextField } from "@mui/material";
import { useState, useEffect, useRef } from 'react'

export default function NumberInput(props: {
  label: string;
  value: string;
  type?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  testId?: string;
}) {
  const { label, value, error, testId, helperText, disabled } = props;

  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <TextField
      data-testid={testId}
      inputRef={inputRef}
      value={inputValue}
      label={label}
      helperText={helperText}
      error={error}
      disabled={disabled}
      
      onInput={
        (e) => {
          setInputValue((e.target as HTMLInputElement).value);
          // onChange(e.target.value);
        }
      }
      onChange={(_e) => {
      //  setInputValue(e.target.);
      //  onChange(e.target.value);
      }}
      type="number"

    />
  );
}