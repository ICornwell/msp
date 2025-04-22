import { Button, Typography } from "@mui/material";
import { useState, useEffect, useRef } from "preact/hooks";

export default function TextInput(props: {
  label: string;
  value: string;
  type?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}) {
  const { label, value, type, error, helperText, disabled } = props;

  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <Button
      variant="outlined"
      disabled={disabled}
      onClick={() => {
        setInputValue("Clicked");
      }}>
      <Typography variant="button">
        {label}
      </Typography>
    </Button>
  );
}