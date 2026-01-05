/**
 * Money Strategy
 *
 * Extends number strategy with:
 * - Currency symbol adornment
 * - Negative display in parentheses (accounting style)
 * - Always 2 decimal places by default
 */
import { InputStrategy } from '../inputStrategies';
import { NumberStrategyOptions } from './numberStrategy';
export interface MoneyStrategyOptions extends NumberStrategyOptions {
    currencySymbol?: string;
    currencyPosition?: 'start' | 'end';
    negativeStyle?: 'minus' | 'parentheses';
}
export declare function createMoneyStrategy(options?: MoneyStrategyOptions): InputStrategy<number>;
export default createMoneyStrategy;
