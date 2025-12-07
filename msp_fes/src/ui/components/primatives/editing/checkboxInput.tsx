import { Checkbox, TextField } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { createLeafComponent } from "../../../renderEngine/components/ReComponentWrapper";
import { ReComponentCommonProps, ReComponentSystemProps } from "../../../renderEngine/components/ReComponentProps";

export type CheckboxInputProps = {
  textRepresentation?: { true: string; false: string; undefined: string };
};

export default function CheckboxInput(props: CheckboxInputProps & ReComponentCommonProps & ReComponentSystemProps) {
  const { value, testId, disabled } = props;

  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setInputValue(value);
    if (props.events?.onChange) {
      props.events.onChange(value);
    }
  }, [value]);

  const custom = (
    <Checkbox 
      data-testid={testId || 'checkbox-input'}
      checked={inputValue === true}
      indeterminate={inputValue === undefined}
      disabled={disabled}
      disableRipple={true}
      onChange={(_event) => {
        let newValue: boolean | undefined;
        if (inputValue === true) {
          newValue = false;
        } else if (inputValue === false) {
          newValue = undefined;
        } else {
          newValue = true;
        }
        setInputValue(newValue);
        if (props.events?.onChange) {
          props.events.onChange(newValue);
        }
      }}
    />
  );

  return (

    <TextField
      helperText={props.helperText}
      id="checkbox"
      variant="filled"

      label={props.label}
      slotProps={{ inputLabel: { shrink: true } }}
      slots={{ input: () => custom }}
    />


  );
}

export const CheckboxComponent = createLeafComponent<CheckboxInputProps>(CheckboxInput, 'Checkbox', false);