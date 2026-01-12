/**
 * Money Strategy
 * 
 * Extends number strategy with:
 * - Currency symbol adornment
 * - Negative display in parentheses (accounting style)
 * - Always 2 decimal places by default
 */

import { 
  InputStrategy, 
  rightAlign, 
  StrategyContext,
  strategyRegistry,
  composeStrategies
} from '../inputStrategies.js';
import { createNumberStrategy, NumberStrategyOptions } from './numberStrategy.js';

export interface MoneyStrategyOptions extends NumberStrategyOptions {
  currencySymbol?: string;
  currencyPosition?: 'start' | 'end';
  negativeStyle?: 'minus' | 'parentheses';
}

export function createMoneyStrategy(options: MoneyStrategyOptions = {}): InputStrategy<number> {
  const { 
    currencySymbol = '$',
    currencyPosition = 'start',
    negativeStyle = 'parentheses',
    decimalPlaces = 2,
    ...numberOptions
  } = options;

  // Get base number strategy
  const numberStrategy = createNumberStrategy({ 
    decimalPlaces, 
    ...numberOptions 
  });

  return composeStrategies(
    numberStrategy,
    {
      alignment: rightAlign,
      
      adornment: {
        getStartAdornment: (_ctx: StrategyContext) => {
          if (currencyPosition !== 'start') return null;
          
          // Just return the symbol - UniversalInput handles the wrapper
          return currencySymbol;
        },
        
        getEndAdornment: (_ctx: StrategyContext) => {
          if (currencyPosition !== 'end') return null;
          
          // Just return the symbol - UniversalInput handles the wrapper
          return currencySymbol;
        }
      },
      
      formatter: {
        format: (value: unknown, _ctx: StrategyContext): string => {
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
    }
  );
}

// Register with the strategy registry
strategyRegistry.registerFactory('money', createMoneyStrategy);

export default createMoneyStrategy;
