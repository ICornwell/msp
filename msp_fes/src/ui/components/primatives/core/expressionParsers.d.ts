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
export declare const expressionParsers: {
    /** Register a parser */
    register: (parser: ExpressionParser) => void;
    nullParser: <T>() => ExpressionParser<T>;
    /** Get a parser by id */
    get: <T>(id: string | ExpressionParser<T>) => ExpressionParser<T> | undefined;
    /** Get parser id from hints (looks for "expr-xxx" pattern) */
    getParserIdFromHints: (hints: string[]) => string | undefined;
    /** Try to parse with a specific parser */
    tryParse: <T>(parserId: string, input: string) => ExpressionResult<T>;
    /** List all registered parser ids */
    list: () => string[];
};
export declare const mathExpressionParser: ExpressionParser<number>;
export declare const dateExpressionParser: ExpressionParser<Date>;
export declare const percentageParser: ExpressionParser<number>;
