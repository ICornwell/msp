import { InputAdornment, TextField } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { createLeafComponent } from '../../../renderEngine/components/ReComponentWrapper';
import { ReComponentCommonProps, ReComponentSystemProps } from '../../../renderEngine/components/ReComponentProps';

export type MoneyInputProps = {
  decimalPlaces?: number;
  currencySymbol?: string;
};

export default function MoneyInput(props: MoneyInputProps & ReComponentCommonProps & ReComponentSystemProps) {
  const { label, value, error, testId, helperText, disabled, decimalPlaces = 2, currencySymbol = '$' } = props;
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


  function formattedValue() {
    return (decimalPlaces !== undefined && !isNaN(Number(value)))
    ? (Math.round((Number(value)) * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)).toFixed(decimalPlaces)
    : value;
  }

  return (
    <TextField
      data-testid={testId}
      inputRef={inputRef}
      variant='filled'
      color={isNegative ? "error" : "primary"}
      value={isNegative ? `(${inputValue})` : inputValue}
      slotProps={{
        input: {
          startAdornment: <InputAdornment style={{marginTop: '2px'}} position="start">{currencySymbol}</InputAdornment>,
        },
      }}
      onChange={(event: any) => {
        if (props.events?.onChange) {
          props.events.onChange(inputValue);
          setInputValue(event.target.value);
        }
      }}
      onBlur={()=>{
        setInputValue(formattedValue());
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