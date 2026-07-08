import * as fp from 'msp_fp_js';
import { InstallmentStrategy } from './types.js';

// The input looks like "USD: 100000.00: 2dp" 
// We parse the string out and split it apart
function parseFpMoneyString(moneyStr: string): { currency: string, amount: string, dp: number } {
    const parts = moneyStr.split(':').map(s => s.trim());
    return {
        currency: parts[0],
        amount: parts[1],
        dp: parseInt(parts[2].replace('dp', ''), 10)
    };
}

function assembleFpMoneyString(currency: string, amount: string, dp: number): string {
    return `${currency}: ${amount}: ${dp}dp`;
}

export const SimpleMonthlyInstallmentStrategy: InstallmentStrategy = {
    strategyName: 'SimpleMonthly',
    getConfigParams: () => [
        { name: 'dayOfMonth', label: 'Day of Month', dataType: 'number' }
    ],
    calculateInstallments: (totalPremium, inceptionDate, expiryDate, config) => {
        const dayOfMonth = config.dayOfMonth || 1;
        
        const parsed = parseFpMoneyString(totalPremium);
        // Using "FIRST" remainder strategy as default
        const result = fp.divideInto(parsed.amount, parsed.dp, 12, "FIRST");
        
        const [year, month, _day] = inceptionDate.split('-').map(Number);
        
        const res = [];
        for(let i=0; i<12; i++) {
            const d = new Date(Date.UTC(year, month - 1 + i, dayOfMonth));
            res.push({
                dueDate: d.toISOString().split('T')[0],
                amount: assembleFpMoneyString(parsed.currency, result.parts[i], parsed.dp)
            });
        }
        return res;
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
        
        const parsed = parseFpMoneyString(totalPremium);
        // "FIRST" strategy
        const result = fp.divideInto(parsed.amount, parsed.dp, 4, "FIRST");
        
        const res = [];
        for(let i=0; i<4; i++) {
            const d = new Date(Date.UTC(year, startMonth + (i*3), dayOfMonth));
            res.push({
                dueDate: d.toISOString().split('T')[0],
                amount: assembleFpMoneyString(parsed.currency, result.parts[i], parsed.dp)
            });
        }
        return res;
    }
};
