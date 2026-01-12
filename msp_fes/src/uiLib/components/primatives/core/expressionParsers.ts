/**
 * Expression Parser System
 * 
 * Pluggable parsers for evaluating expressions in input fields.
 * Each parser handles a specific domain (math, dates, etc.)
 * 
 * Parsers are selected via hints in the strategy key:
 *   "number:editing:expr-math"
 *   "date:editing:expr-date"
 *   "text:editing:expr-custom"
 */

// ============================================================================
// Core Types
// ============================================================================

export interface ExpressionResult<T = unknown> {
  /** Whether the input was successfully parsed as an expression */
  isParseable: boolean;
  /** The computed result (undefined if not parseable) */
  result?: T;
  /** The original expression (for storage/audit) */
  expression?: string;
  /** Error message if parsing failed */
  error?: string;
}

export interface ExpressionParser<T = unknown> {
  /** Unique identifier for this parser */
  id: string;
  /** Check if input looks like an expression this parser handles */
  canParse: (input: string) => boolean;
  /** Parse the expression and return result */
  parse: (input: string) => ExpressionResult<T>;
}

// ============================================================================
// Parser Registry
// ============================================================================

const parserRegistry = new Map<string, ExpressionParser>();

export const expressionParsers = {
  /** Register a parser */
  register: (parser: ExpressionParser) => {
    parserRegistry.set(parser.id, parser);
  },
  nullParser: <T>(): ExpressionParser<T> => ({
    id: 'null',
    canParse: (_input: string): boolean => false,
    parse: (_input: string): ExpressionResult<T> => ({ isParseable: false })
  }),

  /** Get a parser by id */
  get: <T>(id: string | ExpressionParser<T>): ExpressionParser<T> | undefined => {
    let parser: ExpressionParser<T> | undefined = expressionParsers.nullParser<T>();
    // Get the expression parser (default to math)
    if (typeof id !== 'string' && 'parse' in id) {
      parser = id;
    }  else if (typeof id === 'string') {
      const maybeParser = parserRegistry.get(id) as ExpressionParser<T> | undefined;
      if (maybeParser) {
        parser = maybeParser;
      } else {
        console.warn(`ExpressionParsers: Unknown expression parser '${id}', defaulting to null parser.`);
      }
    }
    return parser;
  },

  /** Get parser id from hints (looks for "expr-xxx" pattern) */
  getParserIdFromHints: (hints: string[]): string | undefined => {
    const exprHint = hints.find(h => h.startsWith('expr-'));
    return exprHint?.substring(5); // Remove "expr-" prefix
  },

  /** Try to parse with a specific parser */
  tryParse: <T>(parserId: string, input: string): ExpressionResult<T> => {
    const parser = parserRegistry.get(parserId);
    if (!parser) {
      return { isParseable: false, error: `Unknown parser: ${parserId}` };
    }
    if (!parser.canParse(input)) {
      return { isParseable: false };
    }
    return parser.parse(input) as ExpressionResult<T>;
  },

  /** List all registered parser ids */
  list: (): string[] => Array.from(parserRegistry.keys())
};

// ============================================================================
// Math Expression Parser
// ============================================================================

import Mexp from 'math-expression-evaluator';

const mexp = new (Mexp as any)();

/**
 * Check if input looks like a math expression (has operators)
 */
function looksLikeMathExpression(input: string): boolean {
  const trimmed = input.trim();
  // Has math operators beyond just a plain number
  const hasOperators = /[+\-*/()%]/.test(trimmed);
  // But not just a negative number
  const isJustNegative = /^-?\d+(\.\d+)?$/.test(trimmed);
  // And not just a percentage
  const isJustPercentage = /^\d+(\.\d+)?%$/.test(trimmed);
  return hasOperators && !isJustNegative && !isJustPercentage;
}

export const mathExpressionParser: ExpressionParser<number> = {
  id: 'math',

  canParse: (input: string): boolean => {
    return looksLikeMathExpression(input);
  },

  parse: (input: string): ExpressionResult<number> => {
    const trimmed = input.trim();

    try {
      // Normalize percentage syntax: "10%" → "(10/100)" when used in expressions
      // e.g., "100 * 10%" should become "100 * (10/100)"
      let normalized = trimmed.replace(/(\d+(?:\.\d+)?)\s*%/g, '($1/100)');

      const result = mexp.eval(normalized);

      if (typeof result === 'number' && isFinite(result)) {
        return {
          isParseable: true,
          result,
          expression: trimmed
        };
      }

      return {
        isParseable: false,
        error: 'Result is not a finite number'
      };
    } catch (e) {
      return {
        isParseable: false,
        error: e instanceof Error ? e.message : 'Expression error'
      };
    }
  }
};

// Register math parser by default
expressionParsers.register(mathExpressionParser);

// ============================================================================
// Date Expression Parser
// ============================================================================

/**
 * Parse date expressions like:
 *   "today"
 *   "tomorrow"
 *   "yesterday"
 *   "3/4/2025 + 45 days"
 *   "2025-03-04 - 2 weeks"
 *   "next monday"
 *   "last friday"
 */

const DATE_KEYWORDS = ['today', 'tomorrow', 'yesterday', 'now'];
const RELATIVE_PATTERNS = [
  /^(next|last)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i,
  /^(.+?)\s*([+-])\s*(\d+)\s*(days?|weeks?|months?|years?)$/i
];

function looksLikeDateExpression(input: string): boolean {
  const trimmed = input.trim().toLowerCase();

  // Check keywords
  if (DATE_KEYWORDS.includes(trimmed)) return true;

  // Check patterns
  return RELATIVE_PATTERNS.some(pattern => pattern.test(trimmed));
}

function parseBaseDate(dateStr: string): Date | null {
  const lower = dateStr.trim().toLowerCase();
  const now = new Date();

  if (lower === 'today' || lower === 'now') return now;
  if (lower === 'tomorrow') {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d;
  }
  if (lower === 'yesterday') {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d;
  }

  // Try parsing as a date string
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed;

  // Try UK format dd/mm/yyyy
  const ukMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ukMatch) {
    const [, day, month, year] = ukMatch;
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

function getNextDayOfWeek(dayName: string): Date {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDay = days.indexOf(dayName.toLowerCase());
  if (targetDay === -1) return new Date();

  const today = new Date();
  const currentDay = today.getDay();
  let daysUntil = targetDay - currentDay;
  if (daysUntil <= 0) daysUntil += 7;

  const result = new Date(today);
  result.setDate(result.getDate() + daysUntil);
  return result;
}

function getLastDayOfWeek(dayName: string): Date {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDay = days.indexOf(dayName.toLowerCase());
  if (targetDay === -1) return new Date();

  const today = new Date();
  const currentDay = today.getDay();
  let daysSince = currentDay - targetDay;
  if (daysSince <= 0) daysSince += 7;

  const result = new Date(today);
  result.setDate(result.getDate() - daysSince);
  return result;
}

export const dateExpressionParser: ExpressionParser<Date> = {
  id: 'date',

  canParse: (input: string): boolean => {
    return looksLikeDateExpression(input);
  },

  parse: (input: string): ExpressionResult<Date> => {
    const trimmed = input.trim();
    const lower = trimmed.toLowerCase();

    try {
      // Handle "next/last weekday"
      const relativeWeekday = lower.match(/^(next|last)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i);
      if (relativeWeekday) {
        const [, direction, dayName] = relativeWeekday;
        const result = direction === 'next'
          ? getNextDayOfWeek(dayName)
          : getLastDayOfWeek(dayName);
        return { isParseable: true, result, expression: trimmed };
      }

      // Handle "date +/- N units"
      const offsetMatch = trimmed.match(/^(.+?)\s*([+-])\s*(\d+)\s*(days?|weeks?|months?|years?)$/i);
      if (offsetMatch) {
        const [, baseDateStr, operator, amountStr, unit] = offsetMatch;
        const baseDate = parseBaseDate(baseDateStr);

        if (!baseDate) {
          return { isParseable: false, error: `Cannot parse date: ${baseDateStr}` };
        }

        const amount = parseInt(amountStr) * (operator === '-' ? -1 : 1);
        const unitLower = unit.toLowerCase().replace(/s$/, ''); // Remove plural

        const result = new Date(baseDate);
        switch (unitLower) {
          case 'day':
            result.setDate(result.getDate() + amount);
            break;
          case 'week':
            result.setDate(result.getDate() + amount * 7);
            break;
          case 'month':
            result.setMonth(result.getMonth() + amount);
            break;
          case 'year':
            result.setFullYear(result.getFullYear() + amount);
            break;
        }

        return { isParseable: true, result, expression: trimmed };
      }

      // Handle simple keywords
      const baseDate = parseBaseDate(lower);
      if (baseDate) {
        return { isParseable: true, result: baseDate, expression: trimmed };
      }

      return { isParseable: false, error: 'Not a recognized date expression' };
    } catch (e) {
      return {
        isParseable: false,
        error: e instanceof Error ? e.message : 'Date expression error'
      };
    }
  }
};

// Register date parser
expressionParsers.register(dateExpressionParser);

// ============================================================================
// Percentage Parser (returns decimal)
// ============================================================================

export const percentageParser: ExpressionParser<number> = {
  id: 'percentage',

  canParse: (input: string): boolean => {
    // Simple percentage like "15%" or math expressions
    return /^\d+(\.\d+)?%$/.test(input.trim()) || looksLikeMathExpression(input);
  },

  parse: (input: string): ExpressionResult<number> => {
    const trimmed = input.trim();

    // Simple percentage: "15%" → 0.15
    const simpleMatch = trimmed.match(/^(\d+(?:\.\d+)?)%$/);
    if (simpleMatch) {
      const value = parseFloat(simpleMatch[1]) / 100;
      return { isParseable: true, result: value, expression: trimmed };
    }

    // Math expression - use math parser then convert
    if (looksLikeMathExpression(trimmed)) {
      const mathResult = mathExpressionParser.parse(trimmed);
      if (mathResult.isParseable && mathResult.result !== undefined) {
        // Result is already a number, could be percentage
        return {
          isParseable: true,
          result: mathResult.result,
          expression: trimmed
        };
      }
      return mathResult;
    }

    return { isParseable: false };
  }
};

// Register percentage parser
expressionParsers.register(percentageParser);
