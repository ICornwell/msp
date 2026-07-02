const fp = require('./index.js');

describe('Financial Context and Advanced Features', () => {
  // Note: These tests are based on the API described in the context files
  // Some functions may not be implemented yet in the current bridge
  
  describe('Financial Context', () => {
    test('should be able to require the module without errors', () => {
      expect(fp).toBeDefined();
      expect(typeof fp).toBe('object');
    });

    // These tests will be skipped if the functions aren't implemented yet
    describe('Context Creation (if implemented)', () => {
      test.skip('should create financial context', () => {
        if (fp.createFinancialContext) {
          const context = fp.createFinancialContext('EUR', 4);
          expect(context).toBeDefined();
        }
      });

      test.skip('should get rounding strategy info', () => {
        if (fp.getRoundingStrategyInfo) {
          const info = fp.getRoundingStrategyInfo();
          expect(info).toBeDefined();
          expect(info).toHaveProperty('available_strategies');
        }
      });
    });
  });

  describe('Rounding Strategies (if implemented)', () => {
    const testValue1 = '2.15';
    const testValue2 = '0.1';
    const precision1 = 2;
    const precision2 = 2;

    const strategies = [
      'HALF_TO_EVEN',
      'HALF_UP', 
      'HALF_DOWN',
      'UP',
      'DOWN',
      'TRUNCATE'
    ];

    strategies.forEach(strategy => {
      test.skip(`should handle ${strategy} rounding strategy`, () => {
        if (fp.addWithRounding) {
          expect(() => {
            const result = fp.addWithRounding(testValue1, precision1, testValue2, precision2, strategy);
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
          }).not.toThrow();
        }
      });
    });

    test.skip('should handle invalid rounding strategy', () => {
      if (fp.addWithRounding) {
        expect(() => {
          fp.addWithRounding('1.00', 2, '1.00', 2, 'INVALID_STRATEGY');
        }).toThrow();
      }
    });
  });

  describe('Precision Strategies (if implemented)', () => {
    const strategies = [
      'USE_FIRST_OPERAND_PRECISION',
      'USE_SECOND_OPERAND_PRECISION',
      'USE_LOWEST_PRECISION', 
      'USE_HIGHEST_PRECISION',
      'USE_SPECIFIC_PRECISION:3'
    ];

    test.skip('should get precision strategy info', () => {
      if (fp.getPrecisionStrategyInfo) {
        const info = fp.getPrecisionStrategyInfo();
        expect(info).toBeDefined();
        expect(info).toHaveProperty('available_strategies');
        expect(info).toHaveProperty('description');
      }
    });

    strategies.forEach(strategy => {
      test.skip(`should handle ${strategy} precision strategy`, () => {
        if (fp.addWithPrecisionStrategy) {
          expect(() => {
            const result = fp.addWithPrecisionStrategy('12.34', 2, '5.678', 3, strategy);
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
          }).not.toThrow();
        }
      });
    });
  });

  describe('Currency Operations (if implemented)', () => {
    test.skip('should create currency context', () => {
      if (fp.createCurrencyContext) {
        const context = fp.createCurrencyContext();
        expect(context).toBeDefined();
      }
    });

    test.skip('should add currency rate', () => {
      if (fp.addCurrencyRate) {
        expect(() => {
          fp.addCurrencyRate('USD', 'EUR', '0.85', 4);
        }).not.toThrow();
      }
    });

    test.skip('should convert currency', () => {
      if (fp.convertCurrency) {
        // This would need a context with rates set up
        const result = fp.convertCurrency('100.00', 'USD', 'EUR');
        expect(result).toBeDefined();
      }
    });
  });

  describe('API Consistency', () => {
    test('should have consistent function exports', () => {
      // Test that our core functions are exported
      expect(fp.createFixedDecimal).toBeDefined();
      expect(fp.add).toBeDefined();
      expect(fp.subtract).toBeDefined();
      expect(fp.multiply).toBeDefined();
      expect(fp.divide).toBeDefined();
      
      // All should be functions
      expect(typeof fp.createFixedDecimal).toBe('function');
      expect(typeof fp.add).toBe('function');
      expect(typeof fp.subtract).toBe('function');
      expect(typeof fp.multiply).toBe('function');
      expect(typeof fp.divide).toBe('function');
    });

    test('should handle consistent error types', () => {
      // Test that errors are thrown consistently across functions
      expect(() => fp.createFixedDecimal('invalid', 2)).toThrow();
      expect(() => fp.add('invalid', 2, '1.00', 2)).toThrow();
      expect(() => fp.divide('1.00', 2, '0.00', 2)).toThrow();
    });
  });

  describe('Performance Considerations', () => {
    test('should handle multiple operations efficiently', () => {
      const start = Date.now();
      
      // Perform 100 operations
      for (let i = 0; i < 100; i++) {
        const val1 = (i * 1.23).toFixed(2);
        const val2 = ((i + 1) * 0.45).toFixed(2);
        
        fp.add(val1, 2, val2, 2);
        fp.multiply(val1, 2, val2, 2);
      }
      
      const elapsed = Date.now() - start;
      
      // Should complete in reasonable time (under 1 second for 200 operations)
      expect(elapsed).toBeLessThan(1000);
    });

    test('should handle large numbers without significant delay', () => {
      const start = Date.now();
      
      const largeNumber = '999999999999.99';
      fp.createFixedDecimal(largeNumber, 2);
      fp.add(largeNumber, 2, largeNumber, 2);
      
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100); // Should be very fast
    });
  });
});
