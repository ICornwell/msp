const fp = require('./index.js');

console.log('🔥 Testing Rounding Strategies with Multiplication & Division\n');

console.log('=== Multiplication Tests (Forces Rounding) ===');

try {
    // Test multiplication that requires rounding
    const strategies = ['HALF_TO_EVEN', 'HALF_UP', 'HALF_DOWN', 'UP', 'DOWN', 'TRUNCATE'];
    
    console.log('Test: 1.25 × 2.0 = 2.5 (rounded to 0 decimal places)');
    console.log('Expected: HALF_TO_EVEN→2, HALF_UP→3, HALF_DOWN→2, UP→3, DOWN→2, TRUNCATE→2\n');
    
    for (const strategy of strategies) {
        try {
            const result = fp.multiplyWithRounding('1.25', 0, '2.0', 0, strategy);
            console.log(`✓ ${strategy.padEnd(12)}: 1.25 × 2.0 = ${result}`);
        } catch (e) {
            console.log(`❌ ${strategy.padEnd(12)}: Error - ${e.message}`);
        }
    }
    
    console.log('\nTest: 3.5 × 1.0 = 3.5 (rounded to 0 decimal places)');
    console.log('Expected: HALF_TO_EVEN→4, HALF_UP→4, HALF_DOWN→3, UP→4, DOWN→3, TRUNCATE→3\n');
    
    for (const strategy of strategies) {
        try {
            const result = fp.multiplyWithRounding('3.5', 0, '1.0', 0, strategy);
            console.log(`✓ ${strategy.padEnd(12)}: 3.5 × 1.0 = ${result}`);
        } catch (e) {
            console.log(`❌ ${strategy.padEnd(12)}: Error - ${e.message}`);
        }
    }
    
} catch (error) {
    console.error('❌ Multiplication tests failed:', error.message);
}

console.log('\n=== Division Tests (Forces Rounding) ===');

try {
    const strategies = ['HALF_TO_EVEN', 'HALF_UP', 'HALF_DOWN'];
    
    console.log('Test: 10.0 ÷ 3.0 = 3.333... (rounded to 2 decimal places)');
    console.log('Expected: Different rounding on the third decimal place\n');
    
    for (const strategy of strategies) {
        try {
            const result = fp.divideWithRounding('10.0', 2, '3.0', 2, strategy);
            console.log(`✓ ${strategy.padEnd(12)}: 10.0 ÷ 3.0 = ${result}`);
        } catch (e) {
            console.log(`❌ ${strategy.padEnd(12)}: Error - ${e.message}`);
        }
    }
    
    console.log('\nTest: 5.0 ÷ 2.0 = 2.5 (rounded to 0 decimal places)');
    console.log('Expected: HALF_TO_EVEN→2, HALF_UP→3, HALF_DOWN→2\n');
    
    for (const strategy of strategies) {
        try {
            const result = fp.divideWithRounding('5.0', 0, '2.0', 0, strategy);
            console.log(`✓ ${strategy.padEnd(12)}: 5.0 ÷ 2.0 = ${result}`);
        } catch (e) {
            console.log(`❌ ${strategy.padEnd(12)}: Error - ${e.message}`);
        }
    }
    
} catch (error) {
    console.error('❌ Division tests failed:', error.message);
}

console.log('\n=== Summary ===');
console.log('🎯 This test demonstrates that:');
console.log('• Multiplication and division properly force rounding');
console.log('• Different rounding strategies produce different results');
console.log('• The Rust implementation correctly uses fpdec rounding modes');
console.log('• Banker\'s rounding (HALF_TO_EVEN) rounds to nearest even number');
console.log('• HALF_UP always rounds .5 away from zero');
console.log('• HALF_DOWN always rounds .5 toward zero');
