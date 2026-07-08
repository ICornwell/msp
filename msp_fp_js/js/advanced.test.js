const { fpStr } = require('./index.js');

describe('Advanced Features', () => {
  describe('Performance Considerations', () => {
    test('should handle large numbers without significant delay', () => {
      const start = Date.now();
      const largeNumber = '999999999999.99: 2dp';
      const result = fpStr.add(largeNumber, largeNumber);
      const elapsed = Date.now() - start;
      
      expect(result).toBe('1999999999999.98: 2dp');
      expect(elapsed).toBeLessThan(100); 
    });
  });
});
