import { Checkbox, FormControl, FormControlLabel, FormHelperText } from "@mui/material";
import { useState, useEffect, useRef } from "preact/hooks";

export default function TextInput(props: {
  label: string;
  value: boolean;
  type?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}) {
  const { label, value, error, helperText, disabled } = props;

  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <Checkbox
      ref={inputRef}
      value={inputValue}
      onClick={
        (_e) => {
          setInputValue(!inputValue);
          // onChange(e.target.value);
        }
      }

      
      
      disabled={disabled}
    />

  );
}