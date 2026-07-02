#!/usr/bin/env node

const fp = require('./rs/target/release/fp_js.node');

console.log('Testing basic functions...');

try {
    // Test basic add function
    const result = fp.add('10.50', '5.25', 2);
    console.log('add(10.50, 5.25, 2) =', result);
    
    // Test multiply function
    const result2 = fp.multiply('3.14', '2.0', 2);
    console.log('multiply(3.14, 2.0, 2) =', result2);
    
    // Test createFixedDecimal if it exists
    if (typeof fp.createFixedDecimal === 'function') {
        const decimal = fp.createFixedDecimal('123.45', 2);
        console.log('createFixedDecimal(123.45, 2) =', decimal);
    } else {
        console.log('createFixedDecimal function not found');
    }
    
    console.log('All tests completed successfully!');
} catch (error) {
    console.error('Error during testing:', error);
}
