import { InputAdornment, TextField } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { createLeafComponent } from '../../renderEngine/components/ReComponentWrapper';
import { ReComponentCommonProps, ReComponentSystemProps } from '../../renderEngine/components/ReComponentProps';

export type MoneyInputProps = {
  decimalPlaces?: number;
}  & ReComponentCommonProps & ReComponentSystemProps;

export default function MoneyInput(props: MoneyInputProps) {
  const { label, value, error, testId, helperText, disabled, decimalPlaces = 2 } = props;

  const dpAdjust = Math.pow(10, decimalPlaces);
  let numValue = parseFloat(value);
  const isValidNumber = !isNaN(numValue) && isFinite(numValue);
  if (!isValidNumber) {
    numValue = 0;
  }
  const isNegative = numValue < 0;
  //const isZero = numValue === 0;
  const displayValue = (Math.round(numValue * dpAdjust) / dpAdjust).toFixed(decimalPlaces)

  const [inputValue, setInputValue] = useState(displayValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <TextField
      data-testid={testId}
      inputRef={inputRef}
      color={isNegative ? "error" : "primary"}
      value={isNegative ? `(${inputValue})` : inputValue }
      slotProps={{
        input: {
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
        },
      }}
      
      onInput={
        (e: any) => {
          setInputValue((e.target as HTMLInputElement).value);
          // onChange(e.target.value);
        }
      }
      onChange={(_e: any) => {
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

export const MoneyComponent = createLeafComponent<MoneyInputProps>(MoneyInput, 'Money');