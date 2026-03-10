/**
 * Boolean Strategy
 * 
 * Features:
 * - Configurable text representation (Yes/No, True/False, On/Off, etc.)
 * - Checkbox or toggle adornment
 * - Center alignment
 */

import { Checkbox, Switch, IconButton } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import { createElement, ReactNode } from 'react';
import { 
  InputStrategy, 
  leftAlign,
  StrategyContext,
  ParseResult,
  strategyRegistry
} from '../inputStrategies.js';

export interface BooleanStrategyOptions {
  /** Text labels for true/false/undefined states */
  labels?: {
    true: string;
    false: string;
    undefined?: string;
  };
  /** Control type: checkbox, toggle switch, or icon */
  controlType?: 'checkbox' | 'toggle' | 'icon';
  /** Allow tri-state (true/false/undefined) */
  allowIndeterminate?: boolean;
}

const defaultLabels = {
  true: 'Yes',
  false: 'No',
  undefined: '—'
};

function toBooleanValue(value: unknown): boolean | undefined {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return undefined;
}

export function createBooleanStrategy(options: BooleanStrategyOptions = {}): InputStrategy<boolean | undefined> {
  const { 
    labels = defaultLabels,
    controlType = 'checkbox',
    allowIndeterminate = false
  } = options;

  return {
    alignment: leftAlign,
    
    adornment: {
      getStartAdornment: (ctx: StrategyContext): ReactNode => {
        const boolValue = toBooleanValue(ctx.value);
         const { onValueChange } = ctx.metadata as any
        
        if (ctx.mode === 'readonly') {
          // Lightweight icon representation
          if (boolValue === true) {
            return createElement(CheckIcon, { fontSize: 'small', color: 'success' });
          }
          if (boolValue === false) {
            return createElement(CloseIcon, { fontSize: 'small', color: 'error' });
          }
          return createElement(RemoveIcon, { fontSize: 'small', color: 'disabled' });
        }
        
        // Edit mode - interactive control
        // Note: actual onChange handling is done by the UniversalInput component
        // These adornments just provide the visual control
        
        if (controlType === 'toggle') {
          return createElement(Switch, {
            checked: boolValue === true,
            size: 'small'
          });
        }
        
        if (controlType === 'icon') {
          return createElement(IconButton, { size: 'small' },
            boolValue === true 
              ? createElement(CheckIcon, { color: 'success' })
              : boolValue === false
                ? createElement(CloseIcon, { color: 'error' })
                : createElement(RemoveIcon, { color: 'disabled' })
          );
        }
        
        // Default: checkbox
        return createElement(Checkbox, {
          checked: boolValue === true,
          indeterminate: allowIndeterminate && boolValue === undefined,
          size: 'small',
          onChange: () => onValueChange(!boolValue)
        });
      }
    },
    
    formatter: {
      format: (value: unknown, _ctx: StrategyContext): string => {
        const boolValue = toBooleanValue(value);
        
        if (boolValue === true) return labels.true;
        if (boolValue === false) return labels.false;
        return labels.undefined ?? defaultLabels.undefined;
      }
    },
    
    parser: {
      parse: (input: string, _ctx: StrategyContext): ParseResult<boolean | undefined> => {
        const trimmed = input.trim().toLowerCase();
        
        // True values
        if (['true', 'yes', 'on', '1', 'y', 't'].includes(trimmed)) {
          return { success: true, value: true };
        }
        
        // False values
        if (['false', 'no', 'off', '0', 'n', 'f'].includes(trimmed)) {
          return { success: true, value: false };
        }
        
        // Empty or undefined
        if (trimmed === '' || trimmed === '-' || trimmed === '—') {
          if (allowIndeterminate) {
            return { success: true, value: undefined };
          }
          return { success: true, value: false };
        }
        
        // Not parseable - could become a shadow note
        return { 
          success: false, 
          rawInput: input,
          error: 'Not a recognized boolean value'
        };
      }
    }
  };
}

// Register with the strategy registry
strategyRegistry.registerFactory('boolean', createBooleanStrategy);

export default createBooleanStrategy;
