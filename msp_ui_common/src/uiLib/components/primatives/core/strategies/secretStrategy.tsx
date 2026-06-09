import IconButton from '@mui/material/IconButton';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { InputStrategy, StrategyContext } from '../inputStrategies.js';

export const DEFAULT_REDACTED_SECRET_VALUE = '__redacted__';

export type SecretStrategyOptions = {
  isVisible: boolean;
  redactedValue?: string;
  canToggleVisibility?: boolean;
  onToggleVisibility?: () => boolean;
  onBlur?: (value: unknown, ctx: StrategyContext) => void;
};

// function maskSecret(value: string): string {
//   if (!value) {
//     return '';
//   }

//   const length = Math.max(8, Math.min(24, value.length));
//   return '•'.repeat(length);
// }

export function createSecretStrategy(options: SecretStrategyOptions): InputStrategy<string> {
  const {
    isVisible,
    onToggleVisibility,
    canToggleVisibility = true,
    redactedValue = DEFAULT_REDACTED_SECRET_VALUE,
  } = options;

  return {

    formatter: {
    //  useFormatForEdit: true,
      inputType: (value: unknown) => (isVisible || value === redactedValue) ? 'text' : 'password',  // Always use text input to allow copy-paste, but we control the masking
      onBlur: (value: unknown, ctx: StrategyContext) => {
        options.onBlur?.(value, ctx);
      },
      format: (value: unknown, _ctx: StrategyContext): string => {
        const raw = String(value ?? '');
        if (!raw) {
          return '';
        }

        return raw
      },
    },
    parser: {
      parse: (input: string) => ({ success: true, value: input }),
    },
    adornment: {
      getEndAdornment: (ctx) => {
        const icon = isVisible
          ? <VisibilityOffIcon fontSize="small" />
          : <VisibilityIcon fontSize="small" />;

        return (
          <IconButton
            size="small"
            edge="end"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              const shouldFocus = onToggleVisibility?.();
              if (ctx.textInputRef?.current && shouldFocus) {
                ctx.textInputRef.current.focus();
              }
            }}
            disabled={!canToggleVisibility}
            aria-label={isVisible ? 'Hide secret value' : 'Show secret value'}
          >
            {icon}
          </IconButton>
        );
      },
    },
  };
}
