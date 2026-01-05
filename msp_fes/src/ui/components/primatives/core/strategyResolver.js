/**
 * Strategy Resolver
 *
 * Resolves strategies based on dataType, displayMode, and hints.
 * Supports wildcard patterns (*) for flexible matching.
 *
 * Resolution priority (tightest fit wins):
 *   1. Exact match: "number:editing:dp2:gbp"
 *   2. Partial hints: "number:editing:dp2"
 *   3. Wildcards: "number:*:dp2", "*:editing:dp2", "number:*"
 *   4. Factory fallback: "number" → numberStrategy factory
 *   5. Default: textStrategy
 *
 * Pattern Examples:
 *   "number:editing:dp2:thousands"  - exact match for this combo
 *   "number:editing:*"              - any number in editing mode
 *   "number:*:dp2"                  - any number with dp2 hint
 *   "*:readonly"                    - anything in readonly mode
 *   "money:*"                       - any money field
 */
import { buildStrategyKey, strategyRegistry, textStrategy } from './inputStrategies';
// ============================================================================
// Pattern Matching
// ============================================================================
/**
 * Calculate specificity score for a pattern (higher = more specific)
 *
 * Scoring:
 *   - Each non-wildcard segment: +10
 *   - Each hint (after displayMode): +5
 *   - Wildcard segment: +1 (still better than no match)
 */
function calculatePatternPriority(pattern) {
    const parts = pattern.split(':');
    let score = 0;
    parts.forEach((part, index) => {
        if (part === '*') {
            score += 1; // Wildcard gets minimal score
        }
        else if (index < 2) {
            score += 10; // dataType or displayMode
        }
        else {
            score += 5; // hints
        }
    });
    // Bonus for more specific patterns (more parts)
    score += parts.length;
    return score;
}
/**
 * Check if a key matches a pattern
 *
 * Pattern segments:
 *   - Exact match: "number" matches "number"
 *   - Wildcard: "*" matches anything
 *   - Hints can be in any order
 */
function patternMatches(pattern, key) {
    const patternParts = pattern.split(':');
    const keyParts = key.split(':');
    // DataType (index 0)
    if (patternParts[0] !== '*' && patternParts[0] !== keyParts[0]) {
        return false;
    }
    // DisplayMode (index 1)
    if (patternParts.length > 1 && patternParts[1] !== '*' && patternParts[1] !== keyParts[1]) {
        return false;
    }
    // Hints (index 2+) - pattern hints must all be present in key hints
    const patternHints = patternParts.slice(2).filter(h => h !== '*');
    const keyHints = keyParts.slice(2);
    for (const hint of patternHints) {
        if (!keyHints.includes(hint)) {
            return false;
        }
    }
    return true;
}
// ============================================================================
// Resolver Implementation
// ============================================================================
export function createStrategyResolver(config = {}) {
    const patterns = [];
    const defaultStrategy = config.defaultStrategy ?? textStrategy;
    // Add initial patterns
    if (config.patterns) {
        for (const p of config.patterns) {
            patterns.push({
                ...p,
                priority: p.priority ?? calculatePatternPriority(p.pattern)
            });
        }
    }
    // Sort by priority descending
    const sortPatterns = () => {
        patterns.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    };
    sortPatterns();
    return {
        resolve: (dataType, displayMode = 'editing', hints = []) => {
            const key = buildStrategyKey(dataType, displayMode, hints);
            return resolver.resolveFromKey(key);
        },
        resolveFromKey: (key) => {
            // 1. Check custom patterns (sorted by priority)
            for (const { pattern, strategy } of patterns) {
                if (patternMatches(pattern, key)) {
                    return strategy;
                }
            }
            // 2. Try the strategy registry (factory-based with caching)
            const registryStrategy = strategyRegistry.get(key);
            if (registryStrategy !== textStrategy || key.startsWith('text:')) {
                return registryStrategy;
            }
            // 3. Fall back to default
            return defaultStrategy;
        },
        addPattern: (pattern, strategy, priority) => {
            // Remove existing pattern with same name
            const existing = patterns.findIndex(p => p.pattern === pattern);
            if (existing >= 0) {
                patterns.splice(existing, 1);
            }
            patterns.push({
                pattern,
                strategy,
                priority: priority ?? calculatePatternPriority(pattern)
            });
            sortPatterns();
        },
        addPatterns: (newPatterns) => {
            for (const p of newPatterns) {
                const existing = patterns.findIndex(ep => ep.pattern === p.pattern);
                if (existing >= 0) {
                    patterns.splice(existing, 1);
                }
                patterns.push({
                    ...p,
                    priority: p.priority ?? calculatePatternPriority(p.pattern)
                });
            }
            sortPatterns();
        },
        removePattern: (pattern) => {
            const index = patterns.findIndex(p => p.pattern === pattern);
            if (index >= 0) {
                patterns.splice(index, 1);
            }
        },
        clearPatterns: () => {
            patterns.length = 0;
        },
        listPatterns: () => [...patterns]
    };
    // Reference for closure
    const resolver = {
        resolve: null,
        resolveFromKey: null,
        addPattern: null,
        addPatterns: null,
        removePattern: null,
        clearPatterns: null,
        listPatterns: null
    };
}
// ============================================================================
// Default Global Resolver
// ============================================================================
/** Default resolver instance - can be replaced or extended */
export const defaultStrategyResolver = createStrategyResolver();
/**
 * Apply a strategy set to a resolver
 */
export function applyStrategySet(resolver, strategySet) {
    resolver.addPatterns(strategySet.patterns);
}
/**
 * Create common strategy sets for reuse
 */
export const commonStrategySets = {
    /** Accounting/financial formatting */
    accounting: (currencySymbol = '£') => ({
        name: 'accounting',
        description: 'Financial formatting with accounting conventions',
        patterns: [
        // Import strategies dynamically to avoid circular deps
        ]
    }),
    /** Read-only mode for all fields */
    readonlyAll: () => ({
        name: 'readonly-all',
        description: 'Force all fields to readonly display',
        patterns: [
        // Will be populated with readonly strategies
        ]
    })
};
//# sourceMappingURL=strategyResolver.js.map