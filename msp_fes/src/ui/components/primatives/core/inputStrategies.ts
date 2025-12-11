/**
 * Universal Input Strategy System
 * 
 * One primitive control with composable strategies for:
 * - Alignment (left/right/center)
 * - Adornments (currency symbols, icons, pickers)
 * - Formatters (display formatting)
 * - Parsers (input → value conversion, including expression evaluation)
 * 
 * Design principles:
 * - Controls are "dumb pipes" - never block input
 * - All inputs are type="text" - no browser validation
 * - Formatters run on blur/display, parsers run on commit
 * - Adornments are lightweight in readonly, full-featured in edit mode
 */

import { ReactNode } from 'react';

// ============================================================================
// Core Types
// ============================================================================

export type InputMode = 'readonly' | 'editing';

export type Alignment = 'left' | 'right' | 'center';

/** Result of attempting to parse user input */
export type ParseResult<T = unknown> = 
  | { success: true; value: T; expression?: string }  // Valid value, optionally from expression
  | { success: false; rawInput: string; error?: string };  // Invalid - becomes shadow note candidate

/** Context passed to all strategy functions */
export interface StrategyContext {
  mode: InputMode;
  value: unknown;
  rawInput: string;
  path?: string;  // Data path for shadow notes
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Strategy Interfaces
// ============================================================================

/** Controls text alignment in the input */
export interface AlignmentStrategy {
  getAlignment: (ctx: StrategyContext) => Alignment;
}

/** 
 * Adornments - icons, buttons, pickers that appear in/around the input
 * In readonly mode: lightweight (text/icon)
 * In edit mode: interactive (pickers, dropdowns)
 */
export interface AdornmentStrategy {
  getStartAdornment?: (ctx: StrategyContext) => ReactNode;
  getEndAdornment?: (ctx: StrategyContext) => ReactNode;
}

/**
 * Formatters - convert values to display strings
 * Run when displaying value (readonly or edit blur)
 */
export interface FormatterStrategy {
  useFormatForEdit?:boolean
  format: (value: unknown, ctx: StrategyContext) => string;
}

/**
 * Parsers - convert user input strings to typed values
 * Can evaluate expressions (e.g., "2000/12" → 166.67)
 * Returns ParseResult to handle invalid input gracefully
 */
export interface ParserStrategy<T = unknown> {
  parse: (input: string, ctx: StrategyContext) => ParseResult<T>;
  /** Optional: detect if input looks like an expression */
  isExpression?: (input: string) => boolean;
}

// ============================================================================
// Combined Strategy (convenience type)
// ============================================================================

export interface InputStrategy<T = unknown> {
  alignment?: AlignmentStrategy;
  adornment?: AdornmentStrategy;
  formatter?: FormatterStrategy;
  parser?: ParserStrategy<T>;
}

// ============================================================================
// Strategy Factory Type
// ============================================================================

export type StrategyFactory<TOptions = unknown, TValue = unknown> = 
  (options?: TOptions) => InputStrategy<TValue>;

// ============================================================================
// Built-in Strategy Implementations
// ============================================================================

// --- Alignment Strategies ---

export const leftAlign: AlignmentStrategy = {
  getAlignment: () => 'left'
};

export const rightAlign: AlignmentStrategy = {
  getAlignment: () => 'right'
};

export const centerAlign: AlignmentStrategy = {
  getAlignment: () => 'center'
};

// --- Text Strategy (passthrough) ---

export const textStrategy: InputStrategy<string> = {
  alignment: leftAlign,
  formatter: {
    format: (value) => String(value ?? '')
  },
  parser: {
    parse: (input) => ({ success: true, value: input })
  }
};

// ============================================================================
// Strategy Composition Helper
// ============================================================================

export function composeStrategies<T>(...strategies: Partial<InputStrategy<T>>[]): InputStrategy<T> {
  const result: InputStrategy<T> = {};
  
  for (const strategy of strategies) {
    if (strategy.alignment) result.alignment = strategy.alignment;
    if (strategy.adornment) {
      result.adornment = {
        ...result.adornment,
        ...strategy.adornment
      };
    }
    if (strategy.formatter) result.formatter = strategy.formatter;
    if (strategy.parser) result.parser = strategy.parser;
  }
  
  return result;
}

// ============================================================================
// Strategy Resolution
// ============================================================================

/** 
 * Data type hints for strategy selection
 */
export type DataTypeHint = 
  | 'text' 
  | 'number' 
  | 'money' 
  | 'boolean' 
  | 'date' 
  | 'datetime'
  | 'select'
  | 'percentage';

/**
 * Display mode hints
 */
export type DisplayModeHint = 'editing' | 'readonly' | 'inline';

/**
 * Strategy Key - unique identifier for a strategy configuration
 * 
 * Format: dataType:displayMode[:hint1:hint2:...]
 * 
 * Examples:
 *   "number:editing"
 *   "number:editing:dp2:thousands"
 *   "money:readonly:gbp:accounting"
 *   "boolean:editing:yesno:toggle"
 *   "date:editing:short:picker"
 * 
 * This string-based key solves the memoization problem - same key = same strategy
 */
export type StrategyKey = string;

/**
 * Build a strategy key from components
 */
export function buildStrategyKey(
  dataType: DataTypeHint,
  displayMode: DisplayModeHint = 'editing',
  hints: string[] = []
): StrategyKey {
  const parts = [dataType, displayMode, ...hints.filter(Boolean).sort()];
  return parts.join(':');
}

/**
 * Parse a strategy key back to components
 */
export function parseStrategyKey(key: StrategyKey): {
  dataType: DataTypeHint;
  displayMode: DisplayModeHint;
  hints: string[];
} {
  const [dataType, displayMode, ...hints] = key.split(':');
  return {
    dataType: (dataType || 'text') as DataTypeHint,
    displayMode: (displayMode || 'editing') as DisplayModeHint,
    hints
  };
}

// ============================================================================
// Strategy Registry with Caching
// ============================================================================

export interface StrategyRegistry {
  /** Get or create a strategy by key - cached */
  get: <T = unknown>(key: StrategyKey) => InputStrategy<T>;
  
  /** Get strategy by components - builds key internally */
  getByType: <T = unknown>(
    dataType: DataTypeHint, 
    displayMode?: DisplayModeHint,
    hints?: string[]
  ) => InputStrategy<T>;
  
  /** Register a factory for a data type */
  registerFactory: (dataType: DataTypeHint, factory: StrategyFactory<any, any>) => void;
  
  /** Register a specific strategy instance for an exact key */
  registerStrategy: (key: StrategyKey, strategy: InputStrategy<any>) => void;
  
  /** Check if a key has a cached strategy */
  has: (key: StrategyKey) => boolean;
  
  /** Clear cached strategies (useful for testing) */
  clearCache: () => void;
}

// Factories by data type - used to create new strategies
const factoryMap = new Map<DataTypeHint, StrategyFactory>();

// Cached strategy instances by full key - ensures referential stability
const strategyCache = new Map<StrategyKey, InputStrategy>();

/**
 * Convert hints array to options object for factory
 * This is where hint strings become typed options
 */
function hintsToOptions(dataType: DataTypeHint, hints: string[]): Record<string, unknown> {
  const options: Record<string, unknown> = {};
  
  for (const hint of hints) {
    // Expression parser: expr-math, expr-date, expr-percentage
    const exprMatch = hint.match(/^expr-(.+)$/);
    if (exprMatch) {
      options.expressionParser = exprMatch[1];
      continue;
    }
    
    // Decimal places: dp0, dp2, dp4
    const dpMatch = hint.match(/^dp(\d+)$/);
    if (dpMatch) {
      options.decimalPlaces = parseInt(dpMatch[1], 10);
      continue;
    }
    
    // Currency symbols
    if (['gbp', 'usd', 'eur', 'jpy'].includes(hint)) {
      const symbols: Record<string, string> = { gbp: '£', usd: '$', eur: '€', jpy: '¥' };
      options.currencySymbol = symbols[hint];
      continue;
    }
    
    // Boolean labels
    if (hint === 'yesno') {
      options.labels = { true: 'Yes', false: 'No', undefined: '—' };
      continue;
    }
    if (hint === 'truefalse') {
      options.labels = { true: 'True', false: 'False', undefined: '—' };
      continue;
    }
    if (hint === 'onoff') {
      options.labels = { true: 'On', false: 'Off', undefined: '—' };
      continue;
    }
    
    // Boolean control types
    if (hint === 'toggle') {
      options.controlType = 'toggle';
      continue;
    }
    if (hint === 'checkbox') {
      options.controlType = 'checkbox';
      continue;
    }
    
    // Number formatting
    if (hint === 'thousands') {
      options.thousandsSeparator = true;
      continue;
    }
    if (hint === 'nonegative') {
      options.allowNegative = false;
      continue;
    }
    
    // Money style
    if (hint === 'accounting') {
      options.negativeStyle = 'parentheses';
      continue;
    }
    
    // Unknown hint - store as-is for custom strategies
    options[hint] = true;
  }
  
  return options;
}

export const strategyRegistry: StrategyRegistry = {
  get: <T = unknown>(key: StrategyKey): InputStrategy<T> => {
    // Check cache first
    const cached = strategyCache.get(key);
    if (cached) {
      return cached as InputStrategy<T>;
    }
    
    // Parse key and create new strategy
    const { dataType, displayMode, hints } = parseStrategyKey(key);
    const factory = factoryMap.get(dataType);
    
    if (factory) {
      const options = hintsToOptions(dataType, hints);
      const strategy = factory(options);
      strategyCache.set(key, strategy);
      return strategy as InputStrategy<T>;
    }
    
    // Fall back to text strategy
    strategyCache.set(key, textStrategy);
    return textStrategy as InputStrategy<T>;
  },
  
  getByType: <T = unknown>(
    dataType: DataTypeHint,
    displayMode: DisplayModeHint = 'editing',
    hints: string[] = []
  ): InputStrategy<T> => {
    const key = buildStrategyKey(dataType, displayMode, hints);
    return strategyRegistry.get<T>(key);
  },
  
  registerFactory: (dataType: DataTypeHint, factory: StrategyFactory<any, any>) => {
    factoryMap.set(dataType, factory);
    // Clear any cached strategies for this type (they'll be recreated on next get)
    for (const key of strategyCache.keys()) {
      if (key.startsWith(dataType + ':')) {
        strategyCache.delete(key);
      }
    }
  },
  
  registerStrategy: (key: StrategyKey, strategy: InputStrategy<any>) => {
    strategyCache.set(key, strategy);
  },
  
  has: (key: StrategyKey) => strategyCache.has(key),
  
  clearCache: () => strategyCache.clear()
};

// Register text as default
strategyRegistry.registerFactory('text', () => textStrategy);
