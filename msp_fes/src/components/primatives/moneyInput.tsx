import { TextField } from "@mui/material";
import InputAdornment from '@mui/material/InputAdornment';
import { useState, useEffect, useRef } from "preact/hooks";

export default function MoneyInput(props: {
  label: string;
  value: string;
  decimalPlaces?: number;
  type?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}) {
  const { label, value, error, helperText, disabled, decimalPlaces = 2 } = props;

  const dpAdjust = Math.pow(10, decimalPlaces);
  let numValue = parseFloat(value);
  const isValidNumber = !isNaN(numValue) && isFinite(numValue);
  if (!isValidNumber) {
    numValue = 0;
  }
  const isNegative = numValue < 0;
  const isZero = numValue === 0;
  const displayValue = (Math.round(numValue * dpAdjust) / dpAdjust).toFixed(decimalPlaces)

  const [inputValue, setInputValue] = useState(displayValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <TextField
      inputRef={inputRef}
      color={isNegative ? "error" : "primary"}
      value={isNegative ? `(${inputValue})` : inputValue }
      slotProps={{
        input: {
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
        },
      }}
      
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
      label={label}
      helperText={helperText}
      error={error}
      disabled={disabled}
    />
  );
}