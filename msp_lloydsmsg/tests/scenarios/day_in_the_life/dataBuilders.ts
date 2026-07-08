import { v4 as uuid } from 'uuid';
import { bindRiskView } from '../../../src/data/viewsByOperation.js';

// Centralised test data factories to prevent fragile tests when schemas change.
// Uses Type Inference straight from the fluent builders.

export const MockFactories = {
    
    // Returns a shape strictly adhering to what the BindRisk operation requires
    buildBindRiskRequest: (
        umr: string, 
        baseAmount: string, 
        currency: string = 'GBP'
    ): typeof bindRiskView.dataType => {
        return {
            umr,
            yearOfAccount: new Date().getFullYear(),
            status: 'BOUND',
            syndicate: [
                { syndicateCode: '2001', name: 'Lead Capital' },
                { syndicateCode: '2002', name: 'Follow Capital' }
            ],
            broker: {
                brokerCode: 'BKR-XCH',
                brokerPseudonym: 'AON'
            }
        };
    },

    buildAdviceLpan: (umr: string, data: any) => {
        return {
            eventId: uuid(),
            eventType: 'LPAN_ADVICE' as const,
            umr,
            effectiveDate: new Date().toISOString().split('T')[0],
            ...data
        };
    }
};
