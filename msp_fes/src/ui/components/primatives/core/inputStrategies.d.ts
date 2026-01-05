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
export type InputMode = 'readonly' | 'editing';
export type Alignment = 'left' | 'right' | 'center';
/** Result of attempting to parse user input */
export type ParseResult<T = unknown> = {
    success: true;
    value: T;
    expression?: string;
} | {
    success: false;
    rawInput: string;
    error?: string;
};
/** Context passed to all strategy functions */
export interface StrategyContext {
    mode: InputMode;
    value: unknown;
    rawInput: string;
    path?: string;
    metadata?: Record<string, unknown>;
}
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
    useFormatForEdit?: boolean;
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
export interface InputStrategy<T = unknown> {
    alignment?: AlignmentStrategy;
    adornment?: AdornmentStrategy;
    formatter?: FormatterStrategy;
    parser?: ParserStrategy<T>;
}
export type StrategyFactory<TOptions = unknown, TValue = unknown> = (options?: TOptions) => InputStrategy<TValue>;
export declare const leftAlign: AlignmentStrategy;
export declare const rightAlign: AlignmentStrategy;
export declare const centerAlign: AlignmentStrategy;
export declare const textStrategy: InputStrategy<string>;
export declare function composeStrategies<T>(...strategies: Partial<InputStrategy<T>>[]): InputStrategy<T>;
/**
 * Data type hints for strategy selection
 */
export type DataTypeHint = 'text' | 'number' | 'money' | 'boolean' | 'date' | 'datetime' | 'select' | 'percentage';
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
export declare function buildStrategyKey(dataType: DataTypeHint, displayMode?: DisplayModeHint, hints?: string[]): StrategyKey;
/**
 * Parse a strategy key back to components
 */
export declare function parseStrategyKey(key: StrategyKey): {
    dataType: DataTypeHint;
    displayMode: DisplayModeHint;
    hints: string[];
};
export interface StrategyRegistry {
    /** Get or create a strategy by key - cached */
    get: <T = unknown>(key: StrategyKey) => InputStrategy<T>;
    /** Get strategy by components - builds key internally */
    getByType: <T = unknown>(dataType: DataTypeHint, displayMode?: DisplayModeHint, hints?: string[]) => InputStrategy<T>;
    /** Register a factory for a data type */
    registerFactory: (dataType: DataTypeHint, factory: StrategyFactory<any, any>) => void;
    /** Register a specific strategy instance for an exact key */
    registerStrategy: (key: StrategyKey, strategy: InputStrategy<any>) => void;
    /** Check if a key has a cached strategy */
    has: (key: StrategyKey) => boolean;
    /** Clear cached strategies (useful for testing) */
    clearCache: () => void;
}
export declare const strategyRegistry: StrategyRegistry;
