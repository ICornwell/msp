import { TextField } from "@mui/material";
import { useState, useEffect, useRef } from "preact/hooks";

export default function NumberInput(props: {
  label: string;
  value: string;
  type?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}) {
  const { label, value, error, helperText, disabled } = props;

  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <TextField
      inputRef={inputRef}
      label={label}
      variant="outlined"
      value={inputValue}
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
      error={error}
      helperText={helperText}
      disabled={disabled}
    />
  );
}