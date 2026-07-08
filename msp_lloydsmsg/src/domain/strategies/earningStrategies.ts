import { createStrategy } from 'msp_fp_js';
import { EarningStrategy } from './types.js';

const EarningsMathStrategy = createStrategy('Earnings')
    .withPrecision(2)
    .withRounding('Bankers')
    .withInstallmentDistribution('LoadLast') 
    .build();

export const LinearEarningStrategy: EarningStrategy = {
    strategyName: 'Linear',
    getConfigParams: () => [],
    calculateEarnings: (totalPremium, inceptionDate, expiryDate, config) => {
        const { ccy } = EarningsMathStrategy.fpTypes();
        const slices = ccy(totalPremium).divideInto(12);
        
        let currentDate = new Date(inceptionDate);
        return slices.map((slice, index) => {
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
        const peakMonth = config.hurricaneSeasonLoadMonth || 8;
        const { ccy, dec } = EarningsMathStrategy.fpTypes();
        
        const totalAmount = ccy(totalPremium);
        // Load 50% cleanly mathematically into peak month 
        const peakAmount = totalAmount.percentageOfRounded(dec("50.0: 1dp"));
        const restAmount = totalAmount.subtract(peakAmount);
        
        // Spread the rest evenly across the 11 other months loading leftovers onto the final bound
        const restSlices = restAmount.divideInto(11);
        
        return restSlices.map((slice, i) => {
            // Simplified mapping return just to demonstrate mathematical use-case.
            return {
                periodEndDate: "Y-M-D Placeholder",
                amountToEarn: slice.toString()
            };
        });
    }
};