const { fp, fpStr } = require('./index.js');

describe('Basic FP Operations (Object & String based)', () => {
  describe('String Based (fpStr)', () => {
    test('should add two amounts correctly', () => {
      expect(fpStr.add('10.50: 2dp', '5.25: 2dp')).toBe('15.75: 2dp');
    });

    test('should subtract amounts correctly', () => {
      expect(fpStr.subtract('10.50: 2dp', '5.25: 2dp')).toBe('5.25: 2dp');
    });

    test('should multiply amounts correctly', () => {
      // 10.50 * 2.0 = 21.00
      expect(fpStr.multiply('10.50: 2dp', '2.0: 1dp')).toBe('21.00: 2dp');
    });

    test('should divide amounts correctly', () => {
      expect(fpStr.divide('10.50: 2dp', '2.0: 1dp')).toBe('5.25: 2dp');
    });

    test('should divide into equal parts handling remainders (LoadLast)', () => {
      const parts = fpStr.divideInto('10.00: 2dp', 3, 'LoadLast');
      expect(parts).toEqual(['3.33: 2dp', '3.33: 2dp', '3.34: 2dp']);
    });
  });
});
