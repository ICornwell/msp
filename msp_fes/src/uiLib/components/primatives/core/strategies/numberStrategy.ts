/**
 * Number Strategy
 * 
 * Features:
 * - Right alignment
 * - Decimal place formatting
 * - Thousands separator (optional)
 * - Expression evaluation via pluggable parser (default: math)
 */

import {
  InputStrategy,
  rightAlign,
  ParseResult,
  StrategyContext,
  strategyRegistry
} from '../inputStrategies.js';
import { ExpressionParser, expressionParsers, mathExpressionParser } from '../expressionParsers.js';

export interface NumberStrategyOptions {
  decimalPlaces?: number;
  thousandsSeparator?: boolean;
  allowNegative?: boolean;
  locale?: string;
  /** Expression parser to use (default: 'math') */
  expressionParser?: string | ExpressionParser<number>;
}

export function createNumberStrategy(options: NumberStrategyOptions = {}): InputStrategy<number> {
  const {
    decimalPlaces = 2,
    thousandsSeparator = false,
    allowNegative = true,
    locale = 'en-US',
    expressionParser = 'math'
  } = options;

  const parser: ExpressionParser<number> = expressionParsers.get<number>(expressionParser) ?? mathExpressionParser;

  return {
    alignment: rightAlign,

    formatter: {
      format: (value: unknown, _ctx: StrategyContext): string => {
        const num = Number(value);
        if (isNaN(num) || !isFinite(num)) {
          return '';
        }

        if (thousandsSeparator) {
          return num.toLocaleString(locale, {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces
          });
        }

        return num.toFixed(decimalPlaces);
      }
    },

    parser: {
      parse: (input: string, _ctx: StrategyContext): ParseResult<number> => {
        const trimmed = input.trim();

        if (trimmed === '') {
          return { success: true, value: 0 };
        }

        // First try: is it a plain number?
        // Remove thousands separators for parsing
        // TODO: handle different locale separators )eg. periods vs commas)
        const hasOps = /[+\-*/()^%a-zA-Z]/.test(trimmed);
        let asNumber: number = NaN;
        if (!hasOps) {
          const plainNumber = trimmed.replace(/,/g, '');
          asNumber = parseFloat(plainNumber);
        }

        if (!isNaN(asNumber) && isFinite(asNumber)) {
          if (!allowNegative && asNumber < 0) {
            return { success: false, rawInput: input, error: 'Negative values not allowed' };
          }
          return { success: true, value: asNumber };
        }

        // Second try: is it an expression the parser can handle?
        if (parser.canParse(trimmed)) {
          const result = parser.parse(trimmed);
          if (result.isParseable && result.result !== undefined) {
            const numResult = Number(result.result);
            if (!allowNegative && numResult < 0) {
              return { success: false, rawInput: input, error: 'Result is negative' };
            }
            // Return both the computed value AND the original expression
            return {
              success: true,
              value: numResult,
              expression: result.expression  // Keep the expression for audit trail
            };
          }
        }

        // Not a valid number or expression - this goes to shadow notes
        return {
          success: false,
          rawInput: input,
          error: 'Not a valid number or expression'
        };
      },

      isExpression: (input: string) => parser.canParse(input)
    }
  };
}

// Register with the strategy registry
strategyRegistry.registerFactory('number', createNumberStrategy);

export default createNumberStrategy;