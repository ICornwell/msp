import { TextField } from "@mui/material";
import { useState, useEffect, useRef } from 'react'
import { createLeafComponent } from "../../../renderEngine/components/ReComponentWrapper";
import { ReComponentCommonProps, ReComponentSystemProps } from "../../../renderEngine/components/ReComponentProps";

export type NumberInputProps = {
  decimalPlaces?: number;
};

export default function NumberInput(props: NumberInputProps & ReComponentCommonProps & ReComponentSystemProps) {
  const { label, value, error, testId, helperText, disabled, events } = props;

  const onChange = events?.onChange || (() => { });

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
      onBlur={() => onChange(inputValue)}
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

export const NumberComponent = createLeafComponent<NumberInputProps>(NumberInput, 'Number');