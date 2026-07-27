/**
 * Boolean Strategy
 * 
 * Features:
 * - Configurable text representation (Yes/No, True/False, On/Off, etc.)
 * - Checkbox or toggle adornment
 * - Center alignment
 */
import React, { ReactNode } from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

import {
  InputStrategy,
  leftAlign,
  StrategyContext,
  ParseResult,
  strategyRegistry,
  RenderStrategyContext
} from '../inputStrategies.js';

export interface UxOptionCheckStrategyOptions {
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

export function createUxOptionCheckStrategy(options: UxOptionCheckStrategyOptions = {}): InputStrategy<boolean | undefined> {
  const {
    labels = defaultLabels,
    allowIndeterminate = false
  } = options;

  return {
    alignment: leftAlign,

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
    },
    customRender: {
      customRenderer: (ctx: RenderStrategyContext): ReactNode => {
        const boolValue = toBooleanValue(ctx.value);


        const component =
          <FormControlLabel
            control={
              <Checkbox
                id={ctx.componentId}
                data-testid={ctx.testId}
                inputRef={ctx.inputRef}
                checked={boolValue === true}
                indeterminate={allowIndeterminate && boolValue === undefined}
                size="small"
                onChange={ctx.onChange ? (event: React.ChangeEvent<HTMLInputElement>) => ctx.onChange?.(event) : undefined}
                onFocus={ctx.onFocus ? () => ctx.onFocus?.() : undefined}
                onBlur={ctx.onBlur ? () => ctx.onBlur?.() : undefined}
                onKeyDown={ctx.onKeyDown ? (event: React.KeyboardEvent) => ctx.onKeyDown?.(event) : undefined}
                onClick={ctx.onClick ? (event: React.MouseEvent) => ctx.onClick?.(event) : undefined}
                disabled={ctx.disabled}
              />
            }
            label={ctx.label}
          />

        return component;
      }
    }
  };
}

// Register with the strategy registry
strategyRegistry.registerFactory('boolean', createUxOptionCheckStrategy);

export default createUxOptionCheckStrategy;
