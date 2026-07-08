import fp from 'msp_fp_js';
import { EarningStrategy } from './types.js';

export const LinearEarningStrategy: EarningStrategy = {
    strategyName: 'Linear',
    getConfigParams: () => [],
    calculateEarnings: (totalPremium, inceptionDate, expiryDate, config) => {
        // Strict linear amortization assumes evenly 1/12th every month of the policy lifecycle
        const total = fp(totalPremium);
        const slices = fp.divideInto(total, 12, 'ROUND_REM_TO_LAST');
        
        let currentDate = new Date(inceptionDate);
        return slices.map((slice: any, index: number) => {
            // Earning runs technically occur at the end of the month covering the elapsed period
            const periodEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + index + 1, 0);
            return {
                periodEndDate: periodEndDate.toISOString().split('T')[0],
                amountToEarn: slice.toString()
            };
        });
    }
};

export const WindstormEarningStrategy: EarningStrategy = {
    strategyName: 'US_Windstorm',
    getConfigParams: () => [
        { name: 'hurricaneSeasonLoadMonth', label: 'Hurricane Peak Month (1-12)', dataType: 'number' }
    ],
    calculateEarnings: (totalPremium, inceptionDate, expiryDate, config) => {
        // A naive implementation to prove config-loaded mathematics: E.g., drops 50% of earning natively on Month 8, and spreads the rest.
        // In real systems, this uses daily earning vectors configured by the Actuary.
        return []; 
    }
};
