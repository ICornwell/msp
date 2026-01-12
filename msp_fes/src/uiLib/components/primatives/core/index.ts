/**
 * Core Primitives - Universal Input System
 * 
 * One input component with pluggable strategies for different data types.
 * Import this module to register all built-in strategies.
 * 
 * Strategy Key Format: dataType:displayMode[:hint1:hint2:...]
 * 
 * Examples:
 *   "number:editing"
 *   "number:editing:dp2:thousands:expr-math"
 *   "money:readonly:gbp:accounting"
 *   "boolean:editing:yesno:toggle"
 *   "date:editing:expr-date"
 * 
 * Expression Parsers (via expr-xxx hint):
 *   expr-math      - Math expressions: "2000/12", "(100+23) * 10%"
 *   expr-date      - Date expressions: "today + 45 days", "next monday"
 *   expr-percentage - Percentage: "15%" → 0.15
 * 
 * Strategy Resolution (via StrategyResolver):
 *   - Supports wildcard patterns: "number:*", "*:readonly:dp2"
 *   - Resolves to tightest fit (most specific match wins)
 *   - ReEngine provides resolved strategy to controls
 */

// Core strategy system
export * from './inputStrategies.js';

// Strategy resolver (for ReEngine integration)
export {
  createStrategyResolver,
  defaultStrategyResolver,
  applyStrategySet,
  type StrategyResolver,
  type StrategyPattern,
  type StrategySet,
  type ResolverConfig
} from './strategyResolver.js';

// Expression parser system
export { 
  expressionParsers,
  mathExpressionParser,
  dateExpressionParser,
  percentageParser,
  type ExpressionParser,
  type ExpressionResult
} from './expressionParsers.js';

// Register built-in strategies (side effects - registration happens on import)
import './strategies/numberStrategy.js';
import './strategies/moneyStrategy.js';
import './strategies/booleanStrategy.js';
import './strategies/dateStrategy.js';

// Re-export strategy factories for customization
export { createNumberStrategy, type NumberStrategyOptions } from './strategies/numberStrategy.js';
export { createMoneyStrategy, type MoneyStrategyOptions } from './strategies/moneyStrategy.js';
export { createBooleanStrategy, type BooleanStrategyOptions } from './strategies/booleanStrategy.js';
export { createDateStrategy, type DateStrategyOptions } from './strategies/dateStrategy.js';

// Main component
export { 
  default as UniversalInput, 
  UniversalInputComponent, 
  type UniversalInputProps,
  buildStrategyKey 
} from './UniversalInput.js';
