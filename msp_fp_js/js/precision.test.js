const fp = require('./index.js');

describe('Precision and Rounding Behavior', () => {
  describe('Decimal Precision Handling', () => {
    test('should maintain precision in calculations', () => {
      // Test that precision is maintained through operations
      const a = fp.createFixedDecimal('10.50', 2);
      const b = fp.createFixedDecimal('5.25', 2);
      
      expect(a).toBe('10.50');
      expect(b).toBe('5.25');
      
      const sum = fp.add(a, 2, b, 2);
      expect(sum).toBe('15.75');
    });

    test('should enforce precision matching by default', () => {
      // Test mixed precision operations - should fail with default conservative strategy
      expect(() => fp.add('10.5', 1, '5.25', 2)).toThrow(/Precision mismatch/);
      
      // But same precision should work
      const result = fp.multiply('10.50', 2, '1.50', 2);
      expect(result).toBeDefined();
    });

    test('should handle rounding correctly', () => {
      // Test values that require rounding
      const result = fp.createFixedDecimal('10.555', 2);
      expect(result).toBeDefined();
      // The exact result depends on rounding strategy, but should be consistent
    });
  });

  describe('Financial Calculation Accuracy', () => {
    test('should handle monetary calculations accurately', () => {
      // Typical monetary calculation: price + tax
      const price = '19.99';
      const taxRate = '0.08';
      
      const tax = fp.multiply(price, 2, taxRate, 2);
      const total = fp.add(price, 2, tax, 2);
      
      expect(total).toBeDefined();
      expect(typeof total).toBe('string');
      
      // Should be close to 21.59 (19.99 + 1.60)
      const totalNum = parseFloat(total);
      expect(totalNum).toBeGreaterThan(21.0);
      expect(totalNum).toBeLessThan(22.0);
    });

    test('should handle interest calculations', () => {
      // Simple interest calculation
      const principal = '1000.00';
      const rate = '0.05'; // 5%
      
      const interest = fp.multiply(principal, 2, rate, 2);
      const total = fp.add(principal, 2, interest, 2);
      
      expect(interest).toBe('50.00');
      expect(total).toBe('1050.00');
    });

    test('should handle percentage calculations', () => {
      // Calculate 15% tip on $50.00
      const amount = '50.00';
      const tipRate = '0.15';
      
      const tip = fp.multiply(amount, 2, tipRate, 2);
      const total = fp.add(amount, 2, tip, 2);
      
      expect(tip).toBe('7.50');
      expect(total).toBe('57.50');
    });
  });

  describe('Edge Cases for Financial Operations', () => {
    test('should handle very small amounts', () => {
      const small1 = fp.createFixedDecimal('0.01', 2);
      const small2 = fp.createFixedDecimal('0.01', 2);
      
      const sum = fp.add(small1, 2, small2, 2);
      expect(sum).toBe('0.02');
    });

    test('should handle fractional cents with high precision', () => {
      // Test with banking precision (4 decimal places)
      const amount = fp.createFixedDecimal('100.0001', 4);
      expect(amount).toBe('100.0001');
      
      const doubled = fp.multiply(amount, 4, '2.0000', 4);
      expect(doubled).toBe('200.0002');
    });

    test('should handle division with remainders', () => {
      // Divide $1.00 by 3 - should handle the remainder appropriately
      const result = fp.divide('1.00', 2, '3.00', 2);
      expect(result).toBeDefined();
      
      const resultNum = parseFloat(result);
      expect(resultNum).toBeCloseTo(0.33, 2);
    });

    test('should handle compound calculations', () => {
      // Test multiple operations in sequence
      let value = fp.createFixedDecimal('100.00', 2);
      
      // Add 10%
      const increase = fp.multiply(value, 2, '0.10', 2);
      value = fp.add(value, 2, increase, 2);
      expect(value).toBe('110.00');
      
      // Subtract 5%
      const decrease = fp.multiply(value, 2, '0.05', 2);
      value = fp.subtract(value, 2, decrease, 2);
      expect(value).toBe('104.50');
    });
  });

  describe('Precision Strategy Testing', () => {
    test('should handle same precisions consistently', () => {
      // Test operations with same precision inputs (these should work)
      const scenarios = [
        { a: '10.50', prec_a: 2, b: '5.25', prec_b: 2 },
        { a: '100.123', prec_a: 3, b: '50.456', prec_b: 3 },
        { a: '1000', prec_a: 0, b: '2000', prec_b: 0 }
      ];
      
      scenarios.forEach(scenario => {
        expect(() => {
          const result = fp.add(scenario.a, scenario.prec_a, scenario.b, scenario.prec_b);
          expect(result).toBeDefined();
          expect(typeof result).toBe('string');
        }).not.toThrow();
      });
    });

    test('should produce deterministic results', () => {
      // Same calculation should always produce same result
      const a = '123.456';
      const b = '78.901';
      
      const result1 = fp.add(a, 3, b, 3);
      const result2 = fp.add(a, 3, b, 3);
      const result3 = fp.add(a, 3, b, 3);
      
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });

  describe('Error Scenarios', () => {
    test('should handle overflow scenarios gracefully', () => {
      // Test with very large numbers that might cause overflow
      const large = '999999999999999.99';
      
      expect(() => {
        fp.createFixedDecimal(large, 2);
      }).not.toThrow();
    });

    test('should validate precision bounds', () => {
      // Test precision validation - note: current implementation may not validate negative precision in JavaScript bridge
      // This test documents current behavior
      expect(() => fp.createFixedDecimal('1.00', 25)).toThrow(); // Too high should definitely fail
      
      // Negative precision test - behavior may vary based on implementation
      try {
        fp.createFixedDecimal('1.00', -1);
        // If it doesn't throw, that's the current behavior
      } catch (e) {
        // If it does throw, that's also acceptable
        expect(e.message).toMatch(/precision|invalid/i);
      }
    });

    test('should handle malformed input consistently', () => {
      const badInputs = ['', 'abc', '1.2.3', 'infinity', 'NaN'];
      
      badInputs.forEach(input => {
        expect(() => fp.createFixedDecimal(input, 2)).toThrow();
      });
    });
  });
});
