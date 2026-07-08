import { createStrategy } from 'msp_fp_js';
import { InstallmentStrategy } from './types.js';

// Setup strict context targeting typical standard Monthly Installment Loaders
const InstallmentMathStrategy = createStrategy('Installments')
    .withPrecision(2)
    .withRounding('Bankers')
    .withInstallmentDistribution('LoadFirst') // Load the odd penny into the first installment
    .build();

export const SimpleMonthlyInstallmentStrategy: InstallmentStrategy = {
    strategyName: 'SimpleMonthly',
    getConfigParams: () => [
        { name: 'dayOfMonth', label: 'Day of Month', dataType: 'number' }
    ],
    calculateInstallments: (totalPremium, inceptionDate, expiryDate, config) => {
        const dayOfMonth = config.dayOfMonth || 1;
        
        // We utilize the strict contextual ccy wrapper
        const { ccy } = InstallmentMathStrategy.fpTypes();
        const installments = ccy(totalPremium).divideInto(12);
        
        const [year, month, _day] = inceptionDate.split('-').map(Number);
        
        return installments.map((part, i) => {
            const d = new Date(Date.UTC(year, month - 1 + i, dayOfMonth));
            return {
                dueDate: d.toISOString().split('T')[0],
                amount: part.toString()
            };
        });
    }
};

export const SimpleQuarterlyInstallmentStrategy: InstallmentStrategy = {
    strategyName: 'SimpleQuarterly',
    getConfigParams: () => [
        { name: 'startMonth', label: 'Start Month', dataType: 'number' },
        { name: 'dayOfMonth', label: 'Day of Month', dataType: 'number' }
    ],
    calculateInstallments: (totalPremium, inceptionDate, expiryDate, config) => {
        const [year, month, _day] = inceptionDate.split('-').map(Number);
        const startMonth = config.startMonth || (month - 1);
        const dayOfMonth = config.dayOfMonth || 1;
        
        const { ccy } = InstallmentMathStrategy.fpTypes();
        const installments = ccy(totalPremium).divideInto(4);
        
        return installments.map((part, i) => {
            const d = new Date(Date.UTC(year, startMonth + (i*3), dayOfMonth));
            return {
                dueDate: d.toISOString().split('T')[0],
                amount: part.toString()
            };
        });
    }
};
