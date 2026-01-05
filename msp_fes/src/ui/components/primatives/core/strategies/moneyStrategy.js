/**
 * Money Strategy
 *
 * Extends number strategy with:
 * - Currency symbol adornment
 * - Negative display in parentheses (accounting style)
 * - Always 2 decimal places by default
 */
import { rightAlign, strategyRegistry, composeStrategies } from '../inputStrategies';
import { createNumberStrategy } from './numberStrategy';
export function createMoneyStrategy(options = {}) {
    const { currencySymbol = '$', currencyPosition = 'start', negativeStyle = 'parentheses', decimalPlaces = 2, ...numberOptions } = options;
    // Get base number strategy
    const numberStrategy = createNumberStrategy({
        decimalPlaces,
        ...numberOptions
    });
    return composeStrategies(numberStrategy, {
        alignment: rightAlign,
        adornment: {
            getStartAdornment: (_ctx) => {
                if (currencyPosition !== 'start')
                    return null;
                // Just return the symbol - UniversalInput handles the wrapper
                return currencySymbol;
            },
            getEndAdornment: (_ctx) => {
                if (currencyPosition !== 'end')
                    return null;
                // Just return the symbol - UniversalInput handles the wrapper
                return currencySymbol;
            }
        },
        formatter: {
            format: (value, _ctx) => {
                const num = Number(value);
                if (isNaN(num) || !isFinite(num)) {
                    return '';
                }
                const absValue = Math.abs(num);
                const formatted = absValue.toFixed(decimalPlaces);
                if (num < 0 && negativeStyle === 'parentheses') {
                    return `(${formatted})`;
                }
                if (num < 0) {
                    return `-${formatted}`;
                }
                return formatted;
            }
        }
    });
}
// Register with the strategy registry
strategyRegistry.registerFactory('money', createMoneyStrategy);
export default createMoneyStrategy;
//# sourceMappingURL=moneyStrategy.js.map