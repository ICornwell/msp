// import fp from 'msp_fp_js';
// import { v4 as uuid } from 'uuid';
import { bindRiskView, bookPremiumView, marketSigningsView } from '../data/viewsByOperation.js';
import { SimpleMonthlyInstallmentStrategy, SimpleQuarterlyInstallmentStrategy } from '../domain/strategies/installmentStrategies.js';

export const BindRiskActivity = {

    execute: (
        requestShape: typeof bindRiskView.dataType,
        installmentsParams: { strategy: 'MONTHLY'|'QUARTERLY', totalPremium: string, inceptionDate: string, expiryDate: string }
    ) => {
        // 1. Validation Layer
        if (!requestShape?.umr?.startsWith('B')) {
            throw new Error('UMR must begin with B');
        }

        // 2. Select dynamic mathematical strategy Based on Config
        const strategyFactory = installmentsParams.strategy === 'MONTHLY' 
            ? SimpleMonthlyInstallmentStrategy
            : SimpleQuarterlyInstallmentStrategy;

        const calculatedInstallments = strategyFactory.calculateInstallments(
            installmentsParams.totalPremium, 
            installmentsParams.inceptionDate, 
            installmentsParams.expiryDate, 
            { dayOfMonth: 15 } // Config param fallback
        );

        // 3. Domain Mutation / Structural Graph Linking
        const marketShareNodes: typeof marketSigningsView.dataType[] = [];
        if (requestShape.syndicate && requestShape.syndicate.length === 2) {
             marketShareNodes.push({
                 umr: requestShape.umr,
                 yearOfAccount: requestShape.yearOfAccount,
                 status: 'BOUND',
                 marketShare: [
                     {
                         writtenLinePercentage: '60.00',
                         signedLinePercentage: '0.00', // Pre-LPAN
                         syndicate: { syndicateCode: requestShape.syndicate[0].syndicateCode, name: requestShape.syndicate[0].name }
                     },
                     {
                         writtenLinePercentage: '40.00',
                         signedLinePercentage: '0.00',
                         syndicate: { syndicateCode: requestShape.syndicate[1].syndicateCode, name: requestShape.syndicate[1].name }
                     }
                 ]
             });
        }

        const installmentNodes: typeof bookPremiumView.dataType[] = [{
            umr: requestShape.umr,
            yearOfAccount: requestShape.yearOfAccount,
            status: 'BOUND',
            installment: calculatedInstallments.map((calc, index) => ({
                installmentId: `INST-${requestShape.umr}-${index+1}`,
                dueDate: calc.dueDate,
                status: 'EXPECTED',
                // Map the fpMoney output string mapped to our primitive Money schema
                amount: calc.amount
            }))
        }];

        return {
            policyNodes: [requestShape],
            marketShareNodes,
            installments: installmentNodes
        };
    }

};
