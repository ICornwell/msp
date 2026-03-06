# Version Compatibility Management Guide

## The Problem

In long-lived business systems, you need to:
- Process data files created with different product versions
- Deploy updated business logic and bug fixes
- Maintain backward compatibility with older files
- Avoid breaking changes cascading to old data

Traditional approaches lead to unmaintainable code:

```typescript
// DON'T DO THIS
function processInvoice(invoice: Invoice) {
  if (invoice.version === '1.0.0') {
    // Original logic
    calculateTaxOldWay(invoice);
  } else if (invoice.version >= '2.0.0' && invoice.version < '3.0.0') {
    // Second version logic
    calculateTaxNewWay(invoice);
  } else if (invoice.version >= '3.0.0') {
    // Latest version logic
    calculateTaxWithRegionalRules(invoice);
  }
}
```

### Problems with Conditional Version Logic

1. **Complexity Explosion**: Every version change adds new conditional branches
2. **Code Duplication**: Similar logic repeated across version branches
3. **Hard to Test**: Combinatorial explosion of version paths
4. **Unclear Boundaries**: Which versions are supported becomes buried in conditionals
5. **Risky Changes**: Modifying one branch risks breaking other versions
6. **Poor Discoverability**: Hard to know what logic applies to what versions
7. **Coupling**: Business logic tightly coupled to version checking

## The Solution: Plugin-Based Version Matching

Instead of conditional logic, use **version-aware plugin selection**:

1. Each business process implementation is a separate plugin
2. Plugins declare their own version and compatibility range
3. Runtime selection uses semantic versioning (SemVer) matching
4. The system automatically picks the best plugin for each file version

### Architecture

```typescript
// Plugin manifest
interface ProcessPlugin {
  name: string;           // e.g., "calculateTax"
  version: string;        // Plugin version: "2.1.0"
  compatibleWith: string; // File versions supported: "^2.0.0"
  implementation: (...args: any[]) => any;
}

// At runtime
const fileVersion = "2.5.0";
const plugins = [
  { name: "calculateTax", version: "1.0.0", compatibleWith: "^1.0.0", ... },
  { name: "calculateTax", version: "2.0.0", compatibleWith: "^2.0.0", ... },
  { name: "calculateTax", version: "2.1.0", compatibleWith: "^2.0.0", ... },
];

// Automatically selects calculateTax v2.1.0 (highest version that supports file v2.5.0)
const selected = bestVersionMatch(
  plugins,
  fileVersion,
  p => p.name,
  p => p.version,
  p => p.compatibleWith
);
```

### How It Works

The `bestVersionMatch` function:

1. **Groups** plugins by name (e.g., all "calculateTax" implementations)
2. **Filters** to plugins whose `compatibleWith` range includes the requested file version
3. **Selects** the plugin with the highest version from the filtered set
4. **Returns** the best match for each plugin name

This ensures:
- Files always get the latest compatible processing logic
- Critical fixes in plugin updates automatically apply to old files (if compatible)
- Breaking changes in plugins naturally excluded from old files
- New features only run on file versions designed to support them

## Benefits

### 1. Clean Code
Each plugin is a standalone, focused implementation:

```typescript
// Plugin for files v2.x
export const calculateTax_v2: ProcessPlugin = {
  name: "calculateTax",
  version: "2.1.0",
  compatibleWith: "^2.0.0",
  implementation: (invoice) => {
    // Clean, focused logic for v2.x files
    return invoice.subtotal * invoice.taxRate;
  }
};

// Plugin for files v3.x with regional rules
export const calculateTax_v3: ProcessPlugin = {
  name: "calculateTax",
  version: "3.0.0",
  compatibleWith: "^3.0.0",
  implementation: (invoice) => {
    // New logic for v3.x files
    return calculateWithRegionalRules(invoice);
  }
};
```

### 2. Flexible Evolution
- Deploy new plugin versions without touching old ones
- Patch bugs by updating plugin version and keeping same compatibility range
- Introduce breaking changes by creating new plugin with different compatibility range

### 3. Declarative Compatibility
Version logic lives in metadata, not code:

```typescript
// Compatibility is metadata, not conditional logic
compatibleWith: "^2.0.0"  // Supports 2.x files
compatibleWith: ">=2.5.0 <4.0.0"  // Supports 2.5+ through 3.x
compatibleWith: "*"  // Supports all versions
```

### 4. Easy Fixes
If compatibility goes wrong:
- Update the `compatibleWith` range in the plugin manifest
- No code redeployment needed
- Selection logic immediately picks correct versions

### 5. Testability
Each plugin can be tested independently:

```typescript
describe('calculateTax v2.1.0', () => {
  it('should calculate tax for v2.0.0 files', () => {
    const invoice = createTestInvoice({ version: '2.0.0', subtotal: 100 });
    expect(calculateTax_v2.implementation(invoice)).toBe(15);
  });
  
  it('should calculate tax for v2.9.0 files', () => {
    const invoice = createTestInvoice({ version: '2.9.0', subtotal: 100 });
    expect(calculateTax_v2.implementation(invoice)).toBe(15);
  });
});
```

### 6. SOLID Principles

S - Each plugin has single responsibility, version selection separated from business logic
O - Add new plugins without modifying existing ones or the selection logic
L - Partial coverage: within a compatibility range, higher plugin versions can substitute lower ones (behaviour may change, but not break)
I - Plugin interface is minimal (just the manifest fields + implementation)
D - Selection logic depends on plugin abstractions, not concrete implementations; business code depends on the plugin interface, not specific versions

## Shared Utilities

When multiple plugins need similar logic, **extract shared utilities**:

```typescript
// shared/taxCalculations.ts
export function calculateStandardTax(subtotal: number, rate: number): number {
  return subtotal * rate;
}

export function calculateTaxWithDiscount(
  subtotal: number,
  rate: number,
  discount: number
): number {
  return (subtotal - discount) * rate;
}

// plugins/calculateTax_v2.ts
import { calculateStandardTax } from '../shared/taxCalculations';

export const calculateTax_v2: ProcessPlugin = {
  name: "calculateTax",
  version: "2.0.0",
  compatibleWith: "^2.0.0",
  implementation: (invoice) => calculateStandardTax(invoice.subtotal, invoice.taxRate)
};

// plugins/calculateTax_v3.ts
import { calculateStandardTax } from '../shared/taxCalculations';

export const calculateTax_v3: ProcessPlugin = {
  name: "calculateTax",
  version: "3.0.0",
  compatibleWith: "^3.0.0",
  implementation: (invoice) => {
    // Uses same utility but with additional logic
    const baseTax = calculateStandardTax(invoice.subtotal, invoice.taxRate);
    return applyRegionalAdjustments(baseTax, invoice.region);
  }
};
```

### Guidelines for Shared Code

1. **Extract Common Logic**: If two plugins do the same thing, share the implementation
2. **Version the Utilities**: Shared utilities can have versions too if needed
3. **Keep Plugins Thin**: Plugins should be lightweight wrappers around shared logic
4. **Document Dependencies**: Make it clear which shared utilities are used
5. **Test Utilities Separately**: Shared code gets its own comprehensive test suite

## Testing Strategy

Testing is **critical** for setting compatibility ranges correctly. Wrong ranges = wrong plugin selection = broken processing.

### 1. Unit Tests for Each Plugin

Test each plugin implementation independently:

```typescript
describe('calculateTax v2.1.0', () => {
  it('should calculate basic tax', () => {
    const result = calculateTax_v2.implementation({ subtotal: 100, taxRate: 0.15 });
    expect(result).toBe(15);
  });
  
  it('should handle zero tax rate', () => {
    const result = calculateTax_v2.implementation({ subtotal: 100, taxRate: 0 });
    expect(result).toBe(0);
  });
  
  it('should handle edge cases', () => {
    const result = calculateTax_v2.implementation({ subtotal: 0.01, taxRate: 0.15 });
    expect(result).toBeCloseTo(0.0015, 4);
  });
});
```

### 2. Compatibility Range Tests

Test that the declared compatibility range is correct:

```typescript
describe('calculateTax v2.1.0 compatibility', () => {
  const plugin = calculateTax_v2;
  
  // Test lower bound
  it('should work with minimum supported version (2.0.0)', () => {
    const invoice = createInvoice({ version: '2.0.0', subtotal: 100 });
    expect(() => plugin.implementation(invoice)).not.toThrow();
    expect(plugin.implementation(invoice)).toBeGreaterThan(0);
  });
  
  // Test within range
  it('should work with mid-range version (2.5.0)', () => {
    const invoice = createInvoice({ version: '2.5.0', subtotal: 100 });
    expect(() => plugin.implementation(invoice)).not.toThrow();
  });
  
  // Test upper bound
  it('should work with highest 2.x version (2.99.99)', () => {
    const invoice = createInvoice({ version: '2.99.99', subtotal: 100 });
    expect(() => plugin.implementation(invoice)).not.toThrow();
  });
  
  // Test exclusion (should not be selected for these)
  it('should not be selected for 1.x versions', () => {
    const plugins = [plugin];
    const selected = bestVersionMatch(plugins, '1.9.0', ...);
    expect(selected).toHaveLength(0);
  });
  
  it('should not be selected for 3.x versions', () => {
    const plugins = [plugin];
    const selected = bestVersionMatch(plugins, '3.0.0', ...);
    expect(selected).toHaveLength(0);
  });
});
```

### 3. Regression Test Suite

Maintain a regression test suite with **real historical data**:

```typescript
describe('Tax Calculation Regression Tests', () => {
  // Load archived test data from each version
  const v1_files = loadTestFiles('test-data/v1/*.json');
  const v2_files = loadTestFiles('test-data/v2/*.json');
  const v3_files = loadTestFiles('test-data/v3/*.json');
  
  describe.each(v1_files)('v1 file: $filename', ({ filename, data, expectedTax }) => {
    it('should calculate correct tax', () => {
      const plugins = getAllTaxPlugins();
      const selected = bestVersionMatch(plugins, data.version, ...);
      expect(selected).toHaveLength(1);
      
      const result = selected[0].implementation(data);
      expect(result).toBeCloseTo(expectedTax, 2);
    });
  });
  
  describe.each(v2_files)('v2 file: $filename', ({ filename, data, expectedTax }) => {
    it('should calculate correct tax', () => {
      const plugins = getAllTaxPlugins();
      const selected = bestVersionMatch(plugins, data.version, ...);
      expect(selected).toHaveLength(1);
      
      const result = selected[0].implementation(data);
      expect(result).toBeCloseTo(expectedTax, 2);
    });
  });
  
  // ... same for v3, v4, etc.
});
```

### 4. Integration Tests for Selection Logic

Test that the right plugin is selected in various scenarios:

```typescript
describe('Plugin Selection Integration', () => {
  const allPlugins = [
    calculateTax_v1,  // compatibleWith: "^1.0.0"
    calculateTax_v2,  // compatibleWith: "^2.0.0"
    calculateTax_v2_1, // compatibleWith: "^2.0.0"
    calculateTax_v3,  // compatibleWith: "^3.0.0"
  ];
  
  it('should select highest v2 plugin for v2.5.0 files', () => {
    const selected = bestVersionMatch(allPlugins, '2.5.0', ...);
    expect(selected[0]).toBe(calculateTax_v2_1); // v2.1.0, not v2.0.0
  });
  
  it('should select v1 plugin for v1.8.0 files', () => {
    const selected = bestVersionMatch(allPlugins, '1.8.0', ...);
    expect(selected[0]).toBe(calculateTax_v1);
  });
  
  it('should select v3 plugin for v3.0.0 files', () => {
    const selected = bestVersionMatch(allPlugins, '3.0.0', ...);
    expect(selected[0]).toBe(calculateTax_v3);
  });
  
  it('should handle multiple plugins of different types', () => {
    const mixedPlugins = [
      ...allPlugins,
      validateInvoice_v1,
      validateInvoice_v2,
    ];
    
    const selected = bestVersionMatch(mixedPlugins, '2.5.0', ...);
    expect(selected).toHaveLength(2); // One tax, one validation
    expect(selected.find(p => p.name === 'calculateTax')).toBe(calculateTax_v2_1);
    expect(selected.find(p => p.name === 'validateInvoice')).toBe(validateInvoice_v2);
  });
});
```

### 5. Structured Testing Approach for Setting Ranges

When creating or updating a plugin, follow this testing workflow:

#### Step 1: Define Expected Compatibility
```typescript
// Document intent before implementation
/**
 * Plugin: calculateTax v2.1.0
 * 
 * Purpose: Fix bug in discount calculation for v2.x files
 * 
 * Intended Compatibility: ^2.0.0
 * - Should work with: 2.0.0, 2.1.0, ..., 2.99.99
 * - Should NOT work with: 1.x, 3.x
 * 
 * Breaking Changes from v2.0.0: None (bug fix only)
 */
```

#### Step 2: Write Boundary Tests
```typescript
describe('calculateTax v2.1.0 - Boundary Tests', () => {
  const testCases = [
    // Lower boundary
    { version: '1.99.99', shouldMatch: false, reason: 'Below minimum' },
    { version: '2.0.0', shouldMatch: true, reason: 'Exact minimum' },
    { version: '2.0.1', shouldMatch: true, reason: 'Just above minimum' },
    
    // Mid-range
    { version: '2.5.0', shouldMatch: true, reason: 'Mid-range' },
    
    // Upper boundary
    { version: '2.99.98', shouldMatch: true, reason: 'Just below maximum' },
    { version: '2.99.99', shouldMatch: true, reason: 'Maximum 2.x' },
    { version: '3.0.0', shouldMatch: false, reason: 'Next major version' },
  ];
  
  testCases.forEach(({ version, shouldMatch, reason }) => {
    it(`${reason}: ${version} should ${shouldMatch ? '' : 'NOT '}be compatible`, () => {
      const plugins = [calculateTax_v2_1];
      const selected = bestVersionMatch(plugins, version, ...);
      
      if (shouldMatch) {
        expect(selected).toHaveLength(1);
        expect(selected[0]).toBe(calculateTax_v2_1);
      } else {
        expect(selected).toHaveLength(0);
      }
    });
  });
});
```

#### Step 3: Test Known Data Samples
```typescript
describe('calculateTax v2.1.0 - Sample Data Tests', () => {
  it('should match results from production v2.0.0 files', async () => {
    const samplesV2_0 = await loadProductionSamples('2.0.0', 10); // Load 10 samples
    
    for (const sample of samplesV2_0) {
      const result = calculateTax_v2_1.implementation(sample.invoice);
      expect(result).toBeCloseTo(sample.expectedTax, 2);
    }
  });
  
  it('should match results from production v2.9.0 files', async () => {
    const samplesV2_9 = await loadProductionSamples('2.9.0', 10);
    
    for (const sample of samplesV2_9) {
      const result = calculateTax_v2_1.implementation(sample.invoice);
      expect(result).toBeCloseTo(sample.expectedTax, 2);
    }
  });
});
```

#### Step 4: Test Against Predecessor
```typescript
describe('calculateTax v2.1.0 - Predecessor Compatibility', () => {
  it('should produce same results as v2.0.0 for standard cases', () => {
    const testInvoices = generateTestInvoices(100); // Generate variety
    
    for (const invoice of testInvoices) {
      const resultV2_0 = calculateTax_v2_0.implementation(invoice);
      const resultV2_1 = calculateTax_v2_1.implementation(invoice);
      
      expect(resultV2_1).toBeCloseTo(resultV2_0, 2);
    }
  });
  
  it('should differ from v2.0.0 only for bug case (discount)', () => {
    const invoiceWithDiscount = createInvoice({
      subtotal: 100,
      discount: 10,
      taxRate: 0.15
    });
    
    const resultV2_0 = calculateTax_v2_0.implementation(invoiceWithDiscount);
    const resultV2_1 = calculateTax_v2_1.implementation(invoiceWithDiscount);
    
    expect(resultV2_0).toBe(15); // Bug: ignored discount
    expect(resultV2_1).toBe(13.5); // Fixed: (100-10)*0.15
  });
});
```

#### Step 5: Document Test Results
```typescript
/**
 * Plugin: calculateTax v2.1.0
 * 
 * Compatibility Range: ^2.0.0
 * 
 * Test Results:
 * ✓ Boundary tests pass (2.0.0 - 2.99.99)
 * ✓ Sample data from production v2.0-v2.9 all pass
 * ✓ Regression tests against v2.0.0 pass (excluding bug case)
 * ✓ Correctly fixes discount bug
 * 
 * Approved: 2026-03-06
 * Reviewer: [Name]
 */
```

## Best Practices

### 1. Semantic Versioning
Follow SemVer strictly:
- **Patch** (1.0.x): Bug fixes, no breaking changes → keep same `compatibleWith`
- **Minor** (1.x.0): New features, backward compatible → keep same `compatibleWith`
- **Major** (x.0.0): Breaking changes → update `compatibleWith` to new range

### 2. Conservative Ranges
Start with narrow compatibility ranges and expand based on testing:
```typescript
// Start narrow
compatibleWith: "^2.0.0"  // Only 2.x

// Expand if testing proves it works
compatibleWith: ">=2.0.0 <4.0.0"  // 2.x and 3.x
```

### 3. Explicit Over Implicit
Prefer explicit ranges over wildcards:
```typescript
// Better
compatibleWith: "^2.0.0"

// Avoid unless truly universal
compatibleWith: "*"
```

### 4. Document Compatibility Decisions
Every plugin should document why its range is what it is:
```typescript
/**
 * Compatibility: ^2.0.0
 * 
 * Rationale:
 * - v2.x introduced regional tax fields
 * - v3.x changed tax calculation to use external service
 * - This plugin requires v2 structure but not v3+ features
 */
```

### 5. Test Before Deploying
Never deploy a plugin without:
- [ ] Unit tests for the implementation
- [ ] Boundary tests for the compatibility range
- [ ] Regression tests against known data
- [ ] Review of compatibility decision

### 6. Monitor in Production
Track plugin selection metrics:
- Which plugins are being selected most frequently?
- Are any file versions not matching any plugins?
- Are newer plugins being selected as expected?

## Migration Path

If you have existing conditional version logic:

### Step 1: Extract to Functions
```typescript
// Before
if (version === '1.0.0') {
  // inline logic
} else {
  // inline logic
}

// After
function processV1(data) { ... }
function processV2(data) { ... }

if (version === '1.0.0') {
  processV1(data);
} else {
  processV2(data);
}
```

### Step 2: Convert to Plugins
```typescript
const processV1: ProcessPlugin = {
  name: "process",
  version: "1.0.0",
  compatibleWith: "^1.0.0",
  implementation: processV1
};

const processV2: ProcessPlugin = {
  name: "process",
  version: "2.0.0",
  compatibleWith: "^2.0.0",
  implementation: processV2
};
```

### Step 3: Replace Conditionals
```typescript
// Before
if (version === '1.0.0') {
  processV1(data);
} else {
  processV2(data);
}

// After
const plugins = [processV1, processV2];
const selected = bestVersionMatch(plugins, version, ...);
selected[0].implementation(data);
```

### Step 4: Add Tests
Write comprehensive tests for each plugin and the selection logic.

### Step 5: Deploy and Monitor
Deploy gradually and monitor for issues.

## Conclusion

Version compatibility management through plugin selection provides:
- **Cleaner code**: No version conditionals in business logic
- **Better maintainability**: Each version's logic is isolated
- **Easier testing**: Test plugins independently
- **Flexible evolution**: Deploy new versions without touching old code
- **Declarative compatibility**: Ranges are metadata, not code

The key to success is **thorough testing** to ensure compatibility ranges are set correctly. With the right tests in place, this architecture enables fearless evolution of your business logic while maintaining backward compatibility.
