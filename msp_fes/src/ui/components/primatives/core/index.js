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
export * from './inputStrategies';
// Strategy resolver (for ReEngine integration)
export { createStrategyResolver, defaultStrategyResolver, applyStrategySet } from './strategyResolver';
// Expression parser system
export { expressionParsers, mathExpressionParser, dateExpressionParser, percentageParser } from './expressionParsers';
// Register built-in strategies (side effects - registration happens on import)
import './strategies/numberStrategy';
import './strategies/moneyStrategy';
import './strategies/booleanStrategy';
import './strategies/dateStrategy.tsx';
// Re-export strategy factories for customization
export { createNumberStrategy } from './strategies/numberStrategy';
export { createMoneyStrategy } from './strategies/moneyStrategy';
export { createBooleanStrategy } from './strategies/booleanStrategy';
export { createDateStrategy } from './strategies/dateStrategy.tsx';
// Main component
export { default as UniversalInput, UniversalInputComponent, buildStrategyKey } from './UniversalInput';
//# sourceMappingURL=index.js.map