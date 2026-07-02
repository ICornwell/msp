const fp = require('./index.js');

console.log('🔍 Testing the Insight: What SHOULD work with flexible precision\n');

console.log('Your insight was correct! If we allowed different precisions:');
console.log('2 + 0.5 = 2.5 → Round to precision of first operand (0) = different results!\n');

console.log('❌ Current limitation: Both operands must have same precision');
console.log('✅ Better design: Allow different precisions, use result precision rule\n');

console.log('🎯 The Simple Test That Would Have Worked:');
console.log('');
console.log('Test: 2 + 0.5 = 2.5 (rounded to 0 decimals)');
console.log('• HALF_TO_EVEN: 2 + 0.5 = 2  (banker\'s rounding)');
console.log('• HALF_UP:      2 + 0.5 = 3  (round up)');  
console.log('• HALF_DOWN:    2 + 0.5 = 2  (round down)');
console.log('');
console.log('Test: 3 + 0.5 = 3.5 (rounded to 0 decimals)');
console.log('• HALF_TO_EVEN: 3 + 0.5 = 4  (round to even)');
console.log('• HALF_UP:      3 + 0.5 = 4  (round up)');
console.log('• HALF_DOWN:    3 + 0.5 = 3  (round down)');
console.log('');

console.log('💡 Key Insight Benefits:');
console.log('1. No need for complex multiplication/division tests');
console.log('2. Simple addition would show all rounding differences');
console.log('3. More intuitive test cases (2 + 0.5 vs 1.25 × 2.0)');
console.log('4. Would have discovered rounding was working much earlier');
console.log('');

console.log('🔧 Implementation Improvement:');
console.log('Instead of requiring same precision, we could:');
console.log('• Use the higher precision for calculation');
console.log('• Round result to specified target precision');
console.log('• Allow mixed-precision arithmetic');

try {
    // Show what we CAN test with same precision that still demonstrates the concept
    console.log('\n📝 Current Workaround (same precision, but crafted to need rounding):');
    
    // We can still demonstrate the concept by using values that, when added,
    // exceed the precision in their intermediate calculation
    console.log('Using same precision but values that might trigger internal rounding...');
    
    const strategies = ['HALF_TO_EVEN', 'HALF_UP', 'HALF_DOWN'];
    
    // This might work if the internal fpdec calculation has rounding
    for (const strategy of strategies) {
        try {
            // Both precision 0, but maybe internal calc has rounding?
            const result = fp.addWithRounding('2', 0, '0', 0, strategy);
            console.log(`${strategy}: 2 + 0 = ${result} (no rounding needed, shows baseline)`);
        } catch (e) {
            console.log(`${strategy}: Error - ${e.message}`);
        }
    }
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
}
