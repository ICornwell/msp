import { Checkbox } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import { createLeafComponent } from "../../renderEngine/components/ReComponentWrapper";
import { ReComponentCommonProps, ReComponentSystemProps } from "../../renderEngine/components/ReComponentProps";

export type CheckboxInputProps = {
  
} ;

export default function CheckboxInput(props: CheckboxInputProps& ReComponentCommonProps & ReComponentSystemProps) {
  const { value, testId, disabled } = props;

  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setInputValue(value);
    if (props.events?.onChange) {
      props.events.onChange(value);
    }
  }, [value]);

  return (
    <Checkbox
      data-testid={testId}
      ref={inputRef}
      checked={inputValue}
    
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

export const CheckboxComponent = createLeafComponent<CheckboxInputProps>(CheckboxInput, 'Checkbox', true);