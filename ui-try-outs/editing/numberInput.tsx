import { TextField } from "@mui/material";
import { useState, useEffect, useRef } from 'react'
import { createLeafComponent } from "../../msp_fes/src/ui/renderEngine/components/ReComponentWrapper";
import { ReComponentCommonProps, ReComponentSystemProps } from "../../msp_fes/src/ui/renderEngine/components/ReComponentProps";

export type NumberInputProps = {
  decimalPlaces?: number;
};

export default function NumberInput(props: NumberInputProps & ReComponentCommonProps & ReComponentSystemProps) {
  const { label, value, error, testId, helperText, disabled, events } = props;

  let numValue = parseFloat(value);
  const isValidNumber = !isNaN(numValue) && isFinite(numValue);
  if (!isValidNumber) {
    numValue = 0;
  }

  const [inputValue, setInputValue] = useState(numValue);
  const inputRef = useRef<HTMLInputElement>(null);

    return (
    <TextField
      data-testid={testId}
      inputRef={inputRef}
      value={inputValue}
      label={label}
      helperText={helperText}
      error={error}
      disabled={disabled}
      onChange={(event: any) => {
        if (events?.onChange) {
          events.onChange(inputValue);
          setInputValue(event.target.value);
        }
      }}
      type="number"

    />
  );
}

export const NumberComponent = createLeafComponent<NumberInputProps>(NumberInput, 'Number');