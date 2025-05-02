import { Button as MuiButton, Typography } from "@mui/material";
import { useState, useEffect } from "preact/hooks";

export default function Button(props: {
  label: string;
  value: string;
  type?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}) {
  const { label, value, disabled } = props; // _type, _error, _helperText

  const [_inputValue, setInputValue] = useState(value);
  // const _inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <MuiButton
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