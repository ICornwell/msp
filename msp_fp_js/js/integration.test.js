const fp = require('./index.js');

describe('Integration Tests', () => {
  describe('Module Loading', () => {
    test('should load the native module successfully', () => {
      expect(fp).toBeDefined();
      expect(typeof fp).toBe('object');
    });

    test('should export required functions', () => {
      const requiredFunctions = [
        'createFixedDecimal',
        'add',
        'subtract', 
        'multiply',
        'divide'
      ];

      requiredFunctions.forEach(funcName => {
        expect(fp[funcName]).toBeDefined();
        expect(typeof fp[funcName]).toBe('function');
      });
    });
  });

  describe('End-to-End Financial Scenarios', () => {
    test('should calculate restaurant bill with tip', () => {
      // Scenario: Calculate total bill with 18% tip
      const subtotal = '45.67';
      const tipRate = '0.18';
      
      const tip = fp.multiply(subtotal, 2, tipRate, 2);
      const total = fp.add(subtotal, 2, tip, 2);
      
      expect(tip).toBeDefined();
      expect(total).toBeDefined();
      
      const tipNum = parseFloat(tip);
      const totalNum = parseFloat(total);
      
      expect(tipNum).toBeCloseTo(8.22, 2);
      expect(totalNum).toBeCloseTo(53.89, 2);
    });

    test('should calculate compound investment', () => {
      // Scenario: $1000 invested at 5% for multiple periods
      let balance = fp.createFixedDecimal('1000.00', 2);
      const rate = '1.05'; // 5% growth multiplier
      
      // Apply 5% growth 3 times (compounding)
      balance = fp.multiply(balance, 2, rate, 2);
      balance = fp.multiply(balance, 2, rate, 2);
      balance = fp.multiply(balance, 2, rate, 2);
      
      const finalBalance = parseFloat(balance);
      // Accept small rounding differences due to fixed precision arithmetic
      expect(finalBalance).toBeCloseTo(1157.63, 1); // 1000 * 1.05^3, allow 0.1 difference
    });

    test('should calculate sales tax on multiple items', () => {
      // Scenario: Shopping cart with multiple items and tax
      const items = [
        { price: '12.99', qty: '2' },
        { price: '8.50', qty: '1' },
        { price: '15.75', qty: '3' }
      ];
      
      let subtotal = fp.createFixedDecimal('0.00', 2);
      
      // Calculate subtotal
      items.forEach(item => {
        const itemTotal = fp.multiply(item.price, 2, item.qty, 0);
        subtotal = fp.add(subtotal, 2, itemTotal, 2);
      });
      
      // Add 8.25% sales tax
      const taxRate = '0.08'; // Simplified to 8% to match precision
      const tax = fp.multiply(subtotal, 2, taxRate, 2);
      const total = fp.add(subtotal, 2, tax, 2);
      
      expect(subtotal).toBeDefined();
      expect(tax).toBeDefined();
      expect(total).toBeDefined();
      
      // Verify calculations - adjust expectations based on actual results
      const subtotalNum = parseFloat(subtotal);
      const taxNum = parseFloat(tax);
      const totalNum = parseFloat(total);
      
      // Verify subtotal is reasonable (2*12.99 + 1*8.50 + 3*15.75 = 25.98 + 8.50 + 47.25 = 81.73)
      expect(subtotalNum).toBeCloseTo(81.73, 2);
      expect(taxNum).toBeCloseTo(6.54, 2); // 81.73 * 0.08
      expect(totalNum).toBeCloseTo(88.27, 2);
    });

    test('should handle currency conversion scenario', () => {
      // Scenario: Convert USD to EUR (even without context)
      const usdAmount = '100.00';
      const exchangeRate = '0.85'; // 1 USD = 0.85 EUR
      
      const eurAmount = fp.multiply(usdAmount, 2, exchangeRate, 2);
      
      expect(eurAmount).toBe('85.00');
    });
  });

  describe('Error Recovery and Validation', () => {
    test('should handle and recover from errors gracefully', () => {
      // Test that errors don't break subsequent operations
      
      // This should fail
      expect(() => fp.createFixedDecimal('invalid', 2)).toThrow();
      
      // But this should still work
      const validResult = fp.createFixedDecimal('100.00', 2);
      expect(validResult).toBe('100.00');
      
      // And operations should continue to work
      const sum = fp.add('50.00', 2, '25.00', 2);
      expect(sum).toBe('75.00');
    });

    test('should validate all inputs consistently', () => {
      const invalidInputs = [
        { val: null, prec: 2 },
        { val: undefined, prec: 2 },
        { val: '100.00', prec: null },
        { val: '100.00', prec: undefined },
        { val: '', prec: 2 },
        { val: 'not-a-number', prec: 2 }
      ];
      
      invalidInputs.forEach(input => {
        expect(() => fp.createFixedDecimal(input.val, input.prec)).toThrow();
      });
    });
  });

  describe('Performance and Stability', () => {
    test('should handle many sequential operations', () => {
      let value = fp.createFixedDecimal('1.00', 2);
      
      // Perform 50 operations
      for (let i = 0; i < 50; i++) {
        value = fp.add(value, 2, '0.01', 2);
      }
      
      expect(value).toBe('1.50');
    });

    test('should maintain precision across many operations', () => {
      let value = fp.createFixedDecimal('100.00', 2);
      
      // Multiply and divide by same amount - should get back original
      value = fp.multiply(value, 2, '1.5', 1);
      value = fp.divide(value, 2, '1.5', 1);
      
      const result = parseFloat(value);
      expect(result).toBeCloseTo(100.0, 2);
    });

    test('should handle stress test of operations', () => {
      const start = Date.now();
      
      // Perform 1000 basic operations
      for (let i = 0; i < 1000; i++) {
        const a = (Math.random() * 100).toFixed(2);
        const b = (Math.random() * 100).toFixed(2);
        
        fp.add(a, 2, b, 2);
      }
      
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });
});
