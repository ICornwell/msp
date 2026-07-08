import { test, expect, describe } from 'vitest';
import { SimpleMonthlyInstallmentStrategy, SimpleQuarterlyInstallmentStrategy } from './installmentStrategies';
import { LinearEarningStrategy, WindstormEarningStrategy } from './earningStrategies';

describe('Domain Rules Validation Mapping (Lloyds)', () => {

    test('Installments divides accurately generating string records safely', () => {
        const results = SimpleMonthlyInstallmentStrategy.calculateInstallments("USD: 1000.00: 2dp", "2024-01-01", "2025-01-01", { dayOfMonth: 5 });
        
        expect(results).toHaveLength(12);
        // Load First is mapped in the strategy!
        expect(results[0].amount).toBe("USD: 83.37: 2dp"); 
        expect(results[1].amount).toBe("USD: 83.33: 2dp");
    });

    test('Earnings computes accurately resolving complex mathematical closures cleanly', () => {
        const results = WindstormEarningStrategy.calculateEarnings("USD: 1000.00: 2dp", "2024-01-01", "2025-01-01", { hurricaneSeasonLoadMonth: 8 });
        
        // 50% is $500. $500 is mapped perfectly among remaining 11
        // Using LoadLast in Earnings mathematical configuration mapping!
        expect(results[10].amountToEarn).toBe("USD: 45.50: 2dp"); // $500 / 11 = 45.4545 + leftover 0.05
        expect(results[9].amountToEarn).toBe("USD: 45.45: 2dp");
    });
});
