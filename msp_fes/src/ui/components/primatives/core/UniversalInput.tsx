/**
 * UniversalInput - One primitive control to rule them all
 * 
 * A single text input that adapts its behavior based on data type hints
 * and strategy plugins. All inputs are type="text" - never blocks user input.
 * 
 * Features:
 * - Strategy-based formatting, parsing, alignment, and adornments
 * - Expression evaluation for numeric types
 * - Shadow note support for non-schema-conformant values
 * - Seamless readonly/edit mode switching
 */

import { TextField, InputAdornment, IconButton, Tooltip } from '@mui/material';
import NoteIcon from '@mui/icons-material/StickyNote2Outlined';
import FunctionsIcon from '@mui/icons-material/Functions';
import { useState, useEffect, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ReComponentCommonProps, ReComponentSystemProps } from '../../../renderEngine/components/ReComponentProps';
import { createLeafComponent } from '../../../renderEngine/components/ReComponentWrapper';
import { Notes } from '../../../renderEngine/data/uiDataProxy';
import { 
  InputStrategy, 
  DataTypeHint, 
  DisplayModeHint,
  StrategyKey,
  strategyRegistry, 
  buildStrategyKey,
  textStrategy,
  InputMode,
  StrategyContext,
  ParseResult
} from './inputStrategies';

// ============================================================================
// Types
// ============================================================================

export interface UniversalInputProps {
  /** 
   * Pre-resolved strategy (preferred - set by ReEngine resolver)
   * When provided, dataType/displayMode/hints/strategyKey are ignored
   */
  strategy?: InputStrategy;
  
  // ---- Fallback resolution (used if strategy not provided) ----
  /** Data type hint for strategy resolution */
  dataType?: DataTypeHint;
  /** Display mode hint */
  displayMode?: DisplayModeHint;
  /** Additional strategy hints (e.g., ['dp2', 'thousands', 'gbp']) */
  hints?: string[];
  /** Pre-computed strategy key (overrides dataType/displayMode/hints) */
  strategyKey?: StrategyKey;
  
  // ---- Behavior ----
  /** Force readonly mode regardless of context */
  forceReadonly?: boolean;
  /** Notes from uiDataProxy - for shadow notes and expressions */
  notes?: Notes;
}

// ============================================================================
// Component
// ============================================================================

export default function UniversalInput(
  props: UniversalInputProps & ReComponentCommonProps & ReComponentSystemProps
) {
  const { 
    label, 
    value, 
    error, 
    testId, 
    helperText, 
    disabled, 
    events,
    strategy: resolvedStrategy,
    dataType = 'text',
    displayMode = 'editing',
    hints = [],
    strategyKey: providedKey,
    forceReadonly = false,
    notes
  } = props;

  const onChange = events?.onChange;
  
  // Strategy resolution:
  // 1. Use pre-resolved strategy if provided (from ReEngine)
  // 2. Fall back to local resolution via registry
  const strategy: InputStrategy = useMemo(() => {
    // If strategy provided by ReEngine, use it directly
    if (resolvedStrategy) return resolvedStrategy;
    
    // Fallback: build key and resolve locally
    const key = providedKey ?? buildStrategyKey(dataType, displayMode, hints);
    return strategyRegistry.get(key) ?? textStrategy;
  }, [resolvedStrategy, providedKey, dataType, displayMode, hints.join(':')]);

  // Component state
  const componentId = useRef(uuidv4()).current;
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Determine mode
  const mode: InputMode = forceReadonly || disabled ? 'readonly' : 'editing';
  
  // Get expression from notes (if any) - used to restore on focus
  const storedExpression = notes?.getExpression?.()[0];
  const storedNotes = notes?.getNotes?.() ?? [];
  const hasNotes = storedNotes.length > 0;
  
  // Strategy context factory
  const createContext = (rawInput: string = '', extraMeta: Record<string, any> = {}): StrategyContext => ({
    mode,
    value,
    rawInput,
    path: (props as any).path,  // May come from record binder
    metadata: { dataType, displayMode, hints, ...extraMeta }
  });

  // Format value for display
  const formattedValue = useMemo(() => {
    if (strategy.formatter) {
      return strategy.formatter.format(value, createContext());
    }
    return String(value ?? '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, strategy, mode]);

  // Input value state - starts with formatted value
  const [inputValue, setInputValue] = useState(formattedValue);
  const [isEditing, setIsEditing] = useState(false);

  // Sync formatted value when value prop changes (and not actively editing)
  useEffect(() => {
    if (!isEditing) {
      setInputValue(formattedValue);
    }
  }, [formattedValue, isEditing]);

  // Get alignment
  const alignment = strategy.alignment?.getAlignment(createContext()) ?? 'left';

  // Get adornments from strategy
  // For adornments, inject onValueChange handler into metadata so pickers can update value
  const adornmentCtx = createContext(inputValue, { onValueChange: onChange });
  const startAdornment = strategy.adornment?.getStartAdornment?.(adornmentCtx);
  const endAdornment = strategy.adornment?.getEndAdornment?.(adornmentCtx);
  
  // Expression indicator (shows if there's a stored expression)
  const expressionAdornment = storedExpression ? (
    <Tooltip title={`Calculated from: ${storedExpression}`}>
      <FunctionsIcon fontSize="small" color="info" sx={{ opacity: 0.7 }} />
    </Tooltip>
  ) : null;
  
  // Shadow note indicator (shows if there are notes)
  const noteAdornment = hasNotes ? (
    <Tooltip title={storedNotes.join('\n')}>
      <IconButton size="small" sx={{ padding: '2px' }}>
        <NoteIcon fontSize="small" color="warning" />
      </IconButton>
    </Tooltip>
  ) : null;

  // Combine end adornments
  const combinedEndAdornment = (endAdornment || expressionAdornment || noteAdornment) ? (
    <>
      {endAdornment}
      {expressionAdornment}
      {noteAdornment}
    </>
  ) : undefined;

  // ---- Event Handlers ----

  const handleFocus = () => {
    setIsEditing(true);
    // On focus, show expression if we have one, otherwise raw value
    // This restores "2000/12" instead of "166.67" for re-editing
    if (storedExpression) {
      setInputValue(storedExpression);
    } else {
      setInputValue(String(strategy?.formatter?.useFormatForEdit ? formattedValue : value) ?? '');
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    // Don't commit yet - just update local state
    // This is the "dumb pipe" approach
  };

  const handleBlur = () => {
    setIsEditing(false);
    
    if (!strategy.parser) {
      // No parser - just pass through as string
      onChange?.(inputValue);
      setInputValue(formattedValue);
      return;
    }

    // Parse the input
    const result = strategy.parser.parse(inputValue, createContext(inputValue));
    
    if (result.success) {
      // Valid value - commit it
      onChange?.(result.value);
      
      // If it was an expression, store it via notes
      if (result.expression && notes?.setExpression) {
        notes.setExpression([result.expression]);
      } else if (notes?.setExpression) {
        // Clear any previous expression if this wasn't one
        notes.setExpression([]);
      }
      
      // Re-format for display
      const newFormatted = strategy.formatter?.format(result.value, createContext()) 
        ?? String(result.value);
      setInputValue(newFormatted);
    } else {
      // Invalid value - store as a note
      if (notes?.setNotes) {
        notes.setNotes([result.rawInput]);
      }
      // Keep the raw input visible (user typed it, they should see it)
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      // Cancel edit - revert to original formatted value
      setInputValue(formattedValue);
      inputRef.current?.blur();
    }
  };

  // ---- Render ----

  return (
    <TextField
      id={componentId}
      data-testid={testId}
      inputRef={inputRef}
      variant="filled"
      // Always type="text" - we handle everything ourselves
      type="text"
      value={inputValue}
      onChange={handleInput}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      label={label}
      helperText={helperText}
      error={error}
      disabled={disabled}
      slotProps={{
        inputLabel: { shrink: true },
        input: {
          readOnly: forceReadonly,
          startAdornment: startAdornment ? (
            <InputAdornment style={{marginTop: '2px'}}position="start">{startAdornment}</InputAdornment>
          ) : undefined,
          endAdornment: combinedEndAdornment ? (
            <InputAdornment style={{marginTop: '2px'}} position="end">{combinedEndAdornment}</InputAdornment>
          ) : undefined,
          sx: {
            textAlign: alignment,
            '& input': {
              textAlign: alignment
            }
          }
        }
      }}
    />
  );
}

// ============================================================================
// Exports
// ============================================================================

export const UniversalInputComponent = createLeafComponent<UniversalInputProps>(
  UniversalInput, 
  'UniversalInput'
);

// Re-export strategy types for convenience
export {
  strategyRegistry,
  buildStrategyKey
} from './inputStrategies';
export type {
  DataTypeHint,
  DisplayModeHint,
  StrategyKey,
  InputStrategy
} from './inputStrategies';
