const { fp, fpStr, ccy, dim } = require('./index.js');

describe('Integration Tests', () => {

  describe('End-to-End Financial Scenarios', () => {
    test('should calculate restaurant bill with tip (fpStr)', () => {
      const subtotal = '45.50: 2dp';
      const tipRate = '0.18: 2dp'; 
      
      const tip = fpStr.multiply(subtotal, tipRate); // this might actually require a percentage logic
      const total = fpStr.add(subtotal, tip);
      
      expect(tip).toBe('8.19: 2dp');
      expect(total).toBe('53.69: 2dp');
    });

    test('should calculate compound investment', () => {
      let balance = '1000.00: 2dp';
      const rate = '1.05: 2dp'; // 5% growth multiplier
      
      balance = fpStr.multiply(balance, rate);
      balance = fpStr.multiply(balance, rate);
      balance = fpStr.multiply(balance, rate);
      
      expect(balance).toBe('1157.62: 2dp');
    });
  });
});
