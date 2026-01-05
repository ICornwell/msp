/**
 * Number Strategy
 *
 * Features:
 * - Right alignment
 * - Decimal place formatting
 * - Thousands separator (optional)
 * - Expression evaluation via pluggable parser (default: math)
 */
import { InputStrategy } from '../inputStrategies';
import { ExpressionParser } from '../expressionParsers';
export interface NumberStrategyOptions {
    decimalPlaces?: number;
    thousandsSeparator?: boolean;
    allowNegative?: boolean;
    locale?: string;
    /** Expression parser to use (default: 'math') */
    expressionParser?: string | ExpressionParser<number>;
}
export declare function createNumberStrategy(options?: NumberStrategyOptions): InputStrategy<number>;
export default createNumberStrategy;
