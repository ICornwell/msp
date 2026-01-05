/**
 * Strategy Resolver
 *
 * Resolves strategies based on dataType, displayMode, and hints.
 * Supports wildcard patterns (*) for flexible matching.
 *
 * Resolution priority (tightest fit wins):
 *   1. Exact match: "number:editing:dp2:gbp"
 *   2. Partial hints: "number:editing:dp2"
 *   3. Wildcards: "number:*:dp2", "*:editing:dp2", "number:*"
 *   4. Factory fallback: "number" → numberStrategy factory
 *   5. Default: textStrategy
 *
 * Pattern Examples:
 *   "number:editing:dp2:thousands"  - exact match for this combo
 *   "number:editing:*"              - any number in editing mode
 *   "number:*:dp2"                  - any number with dp2 hint
 *   "*:readonly"                    - anything in readonly mode
 *   "money:*"                       - any money field
 */
import { InputStrategy, DataTypeHint, DisplayModeHint, StrategyKey } from './inputStrategies';
export interface StrategyPattern {
    /** Pattern string with optional wildcards */
    pattern: string;
    /** The strategy to use when pattern matches */
    strategy: InputStrategy;
    /** Priority override (higher = checked first). Auto-calculated if not set */
    priority?: number;
}
export interface ResolverConfig {
    /** Custom patterns to check before factory fallback */
    patterns?: StrategyPattern[];
    /** Default strategy if nothing matches */
    defaultStrategy?: InputStrategy;
}
export interface StrategyResolver {
    /** Resolve a strategy from components */
    resolve: (dataType: DataTypeHint, displayMode?: DisplayModeHint, hints?: string[]) => InputStrategy;
    /** Resolve from a pre-built key */
    resolveFromKey: (key: StrategyKey) => InputStrategy;
    /** Add a pattern-based strategy */
    addPattern: (pattern: string, strategy: InputStrategy, priority?: number) => void;
    /** Add multiple patterns at once */
    addPatterns: (patterns: StrategyPattern[]) => void;
    /** Remove a pattern */
    removePattern: (pattern: string) => void;
    /** Clear all custom patterns */
    clearPatterns: () => void;
    /** List all registered patterns */
    listPatterns: () => StrategyPattern[];
}
export declare function createStrategyResolver(config?: ResolverConfig): StrategyResolver;
/** Default resolver instance - can be replaced or extended */
export declare const defaultStrategyResolver: StrategyResolver;
export interface StrategySet {
    /** Name for this strategy set */
    name: string;
    /** Description */
    description?: string;
    /** Patterns in this set */
    patterns: StrategyPattern[];
}
/**
 * Apply a strategy set to a resolver
 */
export declare function applyStrategySet(resolver: StrategyResolver, strategySet: StrategySet): void;
/**
 * Create common strategy sets for reuse
 */
export declare const commonStrategySets: {
    /** Accounting/financial formatting */
    accounting: (currencySymbol?: string) => StrategySet;
    /** Read-only mode for all fields */
    readonlyAll: () => StrategySet;
};
