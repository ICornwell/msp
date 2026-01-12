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

import { 
  InputStrategy, 
  DataTypeHint, 
  DisplayModeHint,
  StrategyKey,
  buildStrategyKey,
  strategyRegistry,
  textStrategy
} from './inputStrategies.js';

// ============================================================================
// Types
// ============================================================================

export interface StrategyPattern {
  /** Pattern string with optional wildcards */
  pattern: string;
  /** The strategy to use when pattern matches */
  strategy: InputStrategy;
  /** Priority override (higher = checked first). Auto-calculated if not set */
  priority?: number;
}

export interface ResolverConfig {
  /** Custom patterns to check before factory fallback */
  patterns?: StrategyPattern[];
  /** Default strategy if nothing matches */
  defaultStrategy?: InputStrategy;
}

export interface StrategyResolver {
  /** Resolve a strategy from components */
  resolve: (
    dataType: DataTypeHint,
    displayMode?: DisplayModeHint,
    hints?: string[]
  ) => InputStrategy;
  
  /** Resolve from a pre-built key */
  resolveFromKey: (key: StrategyKey) => InputStrategy;
  
  /** Add a pattern-based strategy */
  addPattern: (pattern: string, strategy: InputStrategy, priority?: number) => void;
  
  /** Add multiple patterns at once */
  addPatterns: (patterns: StrategyPattern[]) => void;
  
  /** Remove a pattern */
  removePattern: (pattern: string) => void;
  
  /** Clear all custom patterns */
  clearPatterns: () => void;
  
  /** List all registered patterns */
  listPatterns: () => StrategyPattern[];
}

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
function calculatePatternPriority(pattern: string): number {
  const parts = pattern.split(':');
  let score = 0;
  
  parts.forEach((part, index) => {
    if (part === '*') {
      score += 1; // Wildcard gets minimal score
    } else if (index < 2) {
      score += 10; // dataType or displayMode
    } else {
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
function patternMatches(pattern: string, key: StrategyKey): boolean {
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

export function createStrategyResolver(config: ResolverConfig = {}): StrategyResolver {
  const patterns: StrategyPattern[] = [];
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
    resolve: (
      dataType: DataTypeHint,
      displayMode: DisplayModeHint = 'editing',
      hints: string[] = []
    ): InputStrategy => {
      const key = buildStrategyKey(dataType, displayMode, hints);
      return resolver.resolveFromKey(key);
    },
    
    resolveFromKey: (key: StrategyKey): InputStrategy => {
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
    
    addPattern: (pattern: string, strategy: InputStrategy, priority?: number) => {
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
    
    addPatterns: (newPatterns: StrategyPattern[]) => {
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
    
    removePattern: (pattern: string) => {
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
    resolve: null as any,
    resolveFromKey: null as any,
    addPattern: null as any,
    addPatterns: null as any,
    removePattern: null as any,
    clearPatterns: null as any,
    listPatterns: null as any
  };
}

// ============================================================================
// Default Global Resolver
// ============================================================================

/** Default resolver instance - can be replaced or extended */
export const defaultStrategyResolver = createStrategyResolver();

// ============================================================================
// Helper for UI Plan Builder integration
// ============================================================================

export interface StrategySet {
  /** Name for this strategy set */
  name: string;
  /** Description */
  description?: string;
  /** Patterns in this set */
  patterns: StrategyPattern[];
}

/**
 * Apply a strategy set to a resolver
 */
export function applyStrategySet(resolver: StrategyResolver, strategySet: StrategySet): void {
  resolver.addPatterns(strategySet.patterns);
}

/**
 * Create common strategy sets for reuse
 */
export const commonStrategySets = {
  /** Accounting/financial formatting */
  accounting: (_currencySymbol: string = '£'): StrategySet => ({
    name: 'accounting',
    description: 'Financial formatting with accounting conventions',
    patterns: [
      // Import strategies dynamically to avoid circular deps
    ]
  }),
  
  /** Read-only mode for all fields */
  readonlyAll: (): StrategySet => ({
    name: 'readonly-all',
    description: 'Force all fields to readonly display',
    patterns: [
      // Will be populated with readonly strategies
    ]
  })
};
