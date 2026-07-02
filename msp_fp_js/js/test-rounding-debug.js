const fp = require('./index.js');

console.log('🧪 Testing Pure Rounding Functionality\n');

// The key insight: rounding only matters when the mathematical result
// has more precision than the target precision. Let's test this properly.

console.log('=== Testing Rounding with Precision Reduction ===');

try {
    // Test: Create values that, when added, need rounding to target precision
    // Let's use specific decimal values that force rounding
    
    console.log('Creating test values that will force rounding...\n');
    
    // First, let's see what happens with simple cases that we know should round
    const strategies = ['HALF_TO_EVEN', 'HALF_UP', 'HALF_DOWN'];
    
    // The issue: our current tests don't force rounding because the result precision
    // equals the input precision. Let me try to find values where fpdec's internal
    // arithmetic creates intermediate results that need rounding.
    
    console.log('Test 1: Adding values where internal calculation may exceed precision');
    console.log('1.235 + 1.235 (both with precision 3, result should be rounded to precision 3)');
    
    for (const strategy of strategies) {
        try {
            const result = fp.addWithRounding('1.235', 3, '1.235', 3, strategy);
            console.log(`${strategy}: 1.235 + 1.235 = ${result}`);
        } catch (e) {
            console.log(`${strategy}: Error - ${e.message}`);
        }
    }
    
    console.log('\nTest 2: Small values that might trigger rounding differences');
    console.log('0.0025 + 0.0025 (both with precision 4, might trigger internal rounding)');
    
    for (const strategy of strategies) {
        try {
            const result = fp.addWithRounding('0.0025', 4, '0.0025', 4, strategy);
            console.log(`${strategy}: 0.0025 + 0.0025 = ${result}`);
        } catch (e) {
            console.log(`${strategy}: Error - ${e.message}`);
        }
    }
    
    console.log('\nTest 3: Let me try a different approach - values that should show differences');
    
    // Try creating Decimals with different precision and see the toString output
    console.log('Creating individual FixedDecimals to see precision handling:');
    
    try {
        const val1 = fp.createFixedDecimal('2.5', 0);  // Should be rounded to integer
        const val2 = fp.createFixedDecimal('3.5', 0);  // Should be rounded to integer
        console.log('2.5 with precision 0:', val1);
        console.log('3.5 with precision 0:', val2);
    } catch (e) {
        console.log('FixedDecimal creation failed:', e.message);
    }
    
} catch (error) {
    console.error('❌ Rounding tests failed:', error.message);
}

console.log('\n🔍 Analysis:');
console.log('The rounding is working in Rust (verified by tests), but may not be');
console.log('visible in JavaScript because:');
console.log('1. Result precision = input precision (no precision reduction)');
console.log('2. Mathematical results don\'t exceed the precision limit');
console.log('3. Need operations that force intermediate rounding (multiply/divide)');
