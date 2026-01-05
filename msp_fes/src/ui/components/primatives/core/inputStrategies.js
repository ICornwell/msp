/**
 * Universal Input Strategy System
 *
 * One primitive control with composable strategies for:
 * - Alignment (left/right/center)
 * - Adornments (currency symbols, icons, pickers)
 * - Formatters (display formatting)
 * - Parsers (input → value conversion, including expression evaluation)
 *
 * Design principles:
 * - Controls are "dumb pipes" - never block input
 * - All inputs are type="text" - no browser validation
 * - Formatters run on blur/display, parsers run on commit
 * - Adornments are lightweight in readonly, full-featured in edit mode
 */
// ============================================================================
// Built-in Strategy Implementations
// ============================================================================
// --- Alignment Strategies ---
export const leftAlign = {
    getAlignment: () => 'left'
};
export const rightAlign = {
    getAlignment: () => 'right'
};
export const centerAlign = {
    getAlignment: () => 'center'
};
// --- Text Strategy (passthrough) ---
export const textStrategy = {
    alignment: leftAlign,
    formatter: {
        format: (value) => String(value ?? '')
    },
    parser: {
        parse: (input) => ({ success: true, value: input })
    }
};
// ============================================================================
// Strategy Composition Helper
// ============================================================================
export function composeStrategies(...strategies) {
    const result = {};
    for (const strategy of strategies) {
        if (strategy.alignment)
            result.alignment = strategy.alignment;
        if (strategy.adornment) {
            result.adornment = {
                ...result.adornment,
                ...strategy.adornment
            };
        }
        if (strategy.formatter)
            result.formatter = strategy.formatter;
        if (strategy.parser)
            result.parser = strategy.parser;
    }
    return result;
}
/**
 * Build a strategy key from components
 */
export function buildStrategyKey(dataType, displayMode = 'editing', hints = []) {
    const parts = [dataType, displayMode, ...hints.filter(Boolean).sort()];
    return parts.join(':');
}
/**
 * Parse a strategy key back to components
 */
export function parseStrategyKey(key) {
    const [dataType, displayMode, ...hints] = key.split(':');
    return {
        dataType: (dataType || 'text'),
        displayMode: (displayMode || 'editing'),
        hints
    };
}
// Factories by data type - used to create new strategies
const factoryMap = new Map();
// Cached strategy instances by full key - ensures referential stability
const strategyCache = new Map();
/**
 * Convert hints array to options object for factory
 * This is where hint strings become typed options
 */
function hintsToOptions(dataType, hints) {
    const options = {};
    for (const hint of hints) {
        // Expression parser: expr-math, expr-date, expr-percentage
        const exprMatch = hint.match(/^expr-(.+)$/);
        if (exprMatch) {
            options.expressionParser = exprMatch[1];
            continue;
        }
        // Decimal places: dp0, dp2, dp4
        const dpMatch = hint.match(/^dp(\d+)$/);
        if (dpMatch) {
            options.decimalPlaces = parseInt(dpMatch[1], 10);
            continue;
        }
        // Currency symbols
        if (['gbp', 'usd', 'eur', 'jpy'].includes(hint)) {
            const symbols = { gbp: '£', usd: '$', eur: '€', jpy: '¥' };
            options.currencySymbol = symbols[hint];
            continue;
        }
        // Boolean labels
        if (hint === 'yesno') {
            options.labels = { true: 'Yes', false: 'No', undefined: '—' };
            continue;
        }
        if (hint === 'truefalse') {
            options.labels = { true: 'True', false: 'False', undefined: '—' };
            continue;
        }
        if (hint === 'onoff') {
            options.labels = { true: 'On', false: 'Off', undefined: '—' };
            continue;
        }
        // Boolean control types
        if (hint === 'toggle') {
            options.controlType = 'toggle';
            continue;
        }
        if (hint === 'checkbox') {
            options.controlType = 'checkbox';
            continue;
        }
        // Number formatting
        if (hint === 'thousands') {
            options.thousandsSeparator = true;
            continue;
        }
        if (hint === 'nonegative') {
            options.allowNegative = false;
            continue;
        }
        // Money style
        if (hint === 'accounting') {
            options.negativeStyle = 'parentheses';
            continue;
        }
        // Unknown hint - store as-is for custom strategies
        options[hint] = true;
    }
    return options;
}
export const strategyRegistry = {
    get: (key) => {
        // Check cache first
        const cached = strategyCache.get(key);
        if (cached) {
            return cached;
        }
        // Parse key and create new strategy
        const { dataType, displayMode, hints } = parseStrategyKey(key);
        const factory = factoryMap.get(dataType);
        if (factory) {
            const options = hintsToOptions(dataType, hints);
            const strategy = factory(options);
            strategyCache.set(key, strategy);
            return strategy;
        }
        // Fall back to text strategy
        strategyCache.set(key, textStrategy);
        return textStrategy;
    },
    getByType: (dataType, displayMode = 'editing', hints = []) => {
        const key = buildStrategyKey(dataType, displayMode, hints);
        return strategyRegistry.get(key);
    },
    registerFactory: (dataType, factory) => {
        factoryMap.set(dataType, factory);
        // Clear any cached strategies for this type (they'll be recreated on next get)
        for (const key of strategyCache.keys()) {
            if (key.startsWith(dataType + ':')) {
                strategyCache.delete(key);
            }
        }
    },
    registerStrategy: (key, strategy) => {
        strategyCache.set(key, strategy);
    },
    has: (key) => strategyCache.has(key),
    clearCache: () => strategyCache.clear()
};
// Register text as default
strategyRegistry.registerFactory('text', () => textStrategy);
//# sourceMappingURL=inputStrategies.js.map