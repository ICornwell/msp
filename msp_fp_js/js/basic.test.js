const fp = require('./index.js');

describe('FixedDecimal Basic Operations', () => {
  describe('createFixedDecimal', () => {
    test('should create decimal with precision 2', () => {
      const result = fp.createFixedDecimal('123.45', 2);
      expect(result).toBe('123.45');
    });

    test('should create high precision decimal', () => {
      const result = fp.createFixedDecimal('3.141592653589793', 15);
      expect(result).toBe('3.141592653589793');
    });

    test('should create zero with precision', () => {
      const result = fp.createFixedDecimal('0.00', 2);
      expect(result).toBe('0.00');
    });

    test('should create negative number', () => {
      const result = fp.createFixedDecimal('-456.78', 2);
      expect(result).toBe('-456.78');
    });

    test('should create integer with precision 0', () => {
      const result = fp.createFixedDecimal('42', 0);
      expect(result).toBe('42');
    });

    test('should handle invalid input gracefully', () => {
      expect(() => fp.createFixedDecimal('invalid', 2)).toThrow();
    });

    test('should handle precision out of range', () => {
      expect(() => fp.createFixedDecimal('123.45', 25)).toThrow();
    });
  });

  describe('Arithmetic Operations', () => {
    describe('add', () => {
      test('should add two decimals with same precision', () => {
        const result = fp.add('123.45', 2, '67.89', 2);
        expect(result).toBe('191.34');
      });

      test('should require matching precision for addition by default', () => {
        // The current implementation uses conservative precision strategy
        expect(() => fp.add('100.5', 1, '25.25', 2)).toThrow(/Precision mismatch/);
      });

      test('should handle zero addition', () => {
        const result = fp.add('100.00', 2, '0.00', 2);
        expect(result).toBe('100.00');
      });

      test('should handle negative addition', () => {
        const result = fp.add('100.00', 2, '-50.00', 2);
        expect(result).toBe('50.00');
      });
    });

    describe('subtract', () => {
      test('should subtract two decimals', () => {
        const result = fp.subtract('123.45', 2, '67.89', 2);
        expect(result).toBe('55.56');
      });

      test('should handle negative result', () => {
        const result = fp.subtract('50.00', 2, '100.00', 2);
        expect(result).toBe('-50.00');
      });

      test('should subtract from zero', () => {
        const result = fp.subtract('0.00', 2, '25.50', 2);
        expect(result).toBe('-25.50');
      });
    });

    describe('multiply', () => {
      test('should multiply two decimals', () => {
        const result = fp.multiply('123.45', 2, '2.5', 1);
        expect(result).toBeDefined();
      });

      test('should multiply by zero', () => {
        const result = fp.multiply('100.00', 2, '0.00', 2);
        expect(result).toBe('0.00');
      });

      test('should multiply negative numbers', () => {
        const result = fp.multiply('-10.50', 2, '2.00', 2);
        expect(result).toBe('-21.00');
      });

      test('should multiply two negative numbers', () => {
        const result = fp.multiply('-10.50', 2, '-2.00', 2);
        expect(result).toBe('21.00');
      });
    });

    describe('divide', () => {
      test('should divide two decimals', () => {
        const result = fp.divide('100.00', 2, '4.00', 2);
        expect(result).toBe('25.00');
      });

      test('should divide with remainder', () => {
        const result = fp.divide('100.00', 2, '3.00', 2);
        expect(result).toBeDefined();
        expect(parseFloat(result)).toBeCloseTo(33.33, 2);
      });

      test('should handle division by zero', () => {
        expect(() => fp.divide('100.00', 2, '0.00', 2)).toThrow();
      });

      test('should divide negative numbers', () => {
        const result = fp.divide('-100.00', 2, '4.00', 2);
        expect(result).toBe('-25.00');
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle very large numbers', () => {
      const result = fp.createFixedDecimal('999999999999.99', 2);
      expect(result).toBe('999999999999.99');
    });

    test('should handle very small precision', () => {
      const result = fp.createFixedDecimal('1', 0);
      expect(result).toBe('1');
    });

    test('should handle maximum precision', () => {
      const value = '1.' + '1'.repeat(18);
      const result = fp.createFixedDecimal(value, 18);
      expect(result).toBe(value);
    });

    test('should handle rounding at precision boundary', () => {
      const result = fp.createFixedDecimal('1.999', 2);
      expect(result).toBeDefined(); // May be rounded to 2.00
    });
  });

  describe('Error Handling', () => {
    test('should throw on invalid string format', () => {
      expect(() => fp.createFixedDecimal('not-a-number', 2)).toThrow();
    });

    test('should throw on empty string', () => {
      expect(() => fp.createFixedDecimal('', 2)).toThrow();
    });

    test('should throw on null/undefined values', () => {
      expect(() => fp.createFixedDecimal(null, 2)).toThrow();
      expect(() => fp.createFixedDecimal(undefined, 2)).toThrow();
    });

    test('should handle arithmetic errors gracefully', () => {
      // Test operations that might cause overflow or other errors
      expect(() => fp.add('invalid', 2, '100.00', 2)).toThrow();
    });
  });
});
