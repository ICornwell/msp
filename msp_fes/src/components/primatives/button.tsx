import { Typography, Button as MuiButton } from '@mui/material';
import { useState, useEffect, useRef, useContext, useReducer, useCallback, useMemo } from 'react';

export default function Button(props: {
  label: string;
  value: string;
  type?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  testId?: string;
}) {
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