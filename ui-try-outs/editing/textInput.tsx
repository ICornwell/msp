// eslint-disable-next-line no-unused-vars
import { useState, useEffect, useRef } from 'react';
import { TextField } from "@mui/material";
import { v4 as uuidv4 } from 'uuid';
import { ReComponentCommonProps, ReComponentSystemProps } from '../../msp_fes/src/ui/renderEngine/components/ReComponentProps';
import { createLeafComponent } from '../../msp_fes/src/ui/renderEngine/components/ReComponentWrapper';

export type TextInputProps = {
  type?: string;
  textVariant?: string
  
}  ;

export default function TextInput(props: TextInputProps & ReComponentCommonProps & ReComponentSystemProps) {
  const { label, value, type, error, testId, helperText, disabled, events  } = props;
  const onChange = events?.onChange || (() => {});
  
  // Create a unique ID for this component instance
  const componentId = useRef(uuidv4()).current;
  
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handler for input changes
  const handleInput = (e: any) => {
    const newValue = e?.target?.value;
    setInputValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <TextField
      id={componentId}
      variant='filled'
      data-testid={testId}
      slotProps={{ input: { readOnly: false, disableUnderline: false } }}
      inputRef={inputRef}
      value={inputValue}
      onChange={handleInput}
      type={type}
      label={label}
      helperText={helperText}
      error={error}
      disabled={disabled}
    />
  );
}

export const TextComponent = createLeafComponent<TextInputProps>(TextInput, 'Text');