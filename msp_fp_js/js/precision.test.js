const { fpStr } = require('./index.js');

describe('Precision and Rounding Behavior', () => {
  describe('Decimal Precision Handling', () => {
    test('should enforce precision matching by default in strict mode', () => {
      expect(() => fpStr.add('10.5: 1dp', '5.25: 2dp')).toThrow();
    });

    test('division should handle repeating decimals within precision', () => {
      const result = fpStr.divide('10.00: 2dp', '3.0: 1dp');
      // Assuming rounding occurs to 2dp
      expect(result).toBe('3.33: 2dp');
    });
  });
});
