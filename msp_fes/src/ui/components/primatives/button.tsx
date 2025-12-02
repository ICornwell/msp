import { Typography, Button as MuiButton } from '@mui/material';
import { useState, useEffect } from 'react';

import { ReComponentCommonProps, ReComponentSystemProps } from '../../renderEngine/components/ReComponentProps';
import { createLeafComponent } from '../../renderEngine/components/ReComponentWrapper';

export type ButtonProps = {
  buttonVariant?: 'squre' | 'rounded' | 'circle';
  buttonSize?: 'small' | 'medium' | 'large';
} ;

export default function ReButton(props: ButtonProps & ReComponentCommonProps & ReComponentSystemProps) {
  const { label, value, testId, disabled } = props; // _type, _error, _helperText

  const [_inputValue, setInputValue] = useState(value);
  // const _inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <MuiButton
      data-testid={testId}
      variant="outlined"
      disabled={disabled}
      onClick={() => {
        setInputValue("Clicked");
      }}>
      <Typography variant="button">
        {label}
      </Typography>
    </MuiButton>
  );
}

export const ButtonComponent = createLeafComponent<ButtonProps>(ReButton, 'Button');