import { Checkbox, FormControl, FormControlLabel, FormHelperText } from "@mui/material";
import { useState, useEffect, useRef } from "react";


export default function TextInput(props: {
  label: string;
  value: boolean;
  type?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  testId?: string;
}) {
  const { label, value, error, testId, helperText, disabled } = props;

  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <Checkbox
      data-testid={testId}
      ref={inputRef}
      value={inputValue}
      onClick={
        (_e: any) => {
          setInputValue(!inputValue);
          // onChange(e.target.value);
        }
      }

      
      
      disabled={disabled}
    />

  );
}