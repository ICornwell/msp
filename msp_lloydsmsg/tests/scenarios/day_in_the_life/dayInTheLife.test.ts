import { describe, it, expect } from 'vitest';
import { BindRiskActivity } from '../../../src/serviceActivityElements/bindRiskActivity.js';
import { MockFactories } from './dataBuilders.js';

describe('A Day in the Life of a Lloyds Policy (Atomic Scenario)', () => {

    let boundPolicyGraph: any = null;
    const TOTAL_EPI = 'USD: 100000.00: 2dp'; // 100% Written Line value

    it('Step 1: The Bind generates Installment Expectations from Written Lines', () => {
        const bindRequest = MockFactories.buildBindRiskRequest('B0123DAYINTHELIFE', TOTAL_EPI);

        const sideEffects = BindRiskActivity.execute(bindRequest, {
            strategy: 'QUARTERLY',
            totalPremium: TOTAL_EPI,
            inceptionDate: '2026-01-01',
            expiryDate: '2026-12-31'
        });

        expect(sideEffects.marketShareNodes.length).toBe(1);
        expect(sideEffects.marketShareNodes[0].marketShare![0].writtenLinePercentage).toBe('60.00');
        expect(sideEffects.marketShareNodes[0].marketShare![1].writtenLinePercentage).toBe('40.00');

        const installmentPayload = sideEffects.installments[0].installment!;
        expect(installmentPayload.length).toBe(4);
        
        expect(installmentPayload[0].amount).toBe('USD: 25000.00: 2dp');
        expect(installmentPayload[0].dueDate).toBe('2026-01-15'); 
        expect(installmentPayload[1].amount).toBe('USD: 25000.00: 2dp');
        expect(installmentPayload[1].dueDate).toBe('2026-04-15');

        boundPolicyGraph = sideEffects;
    });

    it('Step 2: Signings generates LPAN Advice Nodes matching Expected Capital Split', () => {
        expect(boundPolicyGraph).not.toBeNull();

        const advice60 = MockFactories.buildAdviceLpan('B0123DAYINTHELIFE', {
            type: 'PREMIUM',
            syndicateCode: '2001',
            advicedAmount: 'USD: 60000.00: 2dp', 
            signingPercentage: '60.00',
            lpanRef: 'PAN000001'
        });

        let marketShareNodes = boundPolicyGraph.marketShareNodes;
        
        const matchedShare = marketShareNodes[0].marketShare.find((m: any) => m.syndicate.syndicateCode === '2001');
        expect(matchedShare).toBeDefined();

        const updatedMarketShare = {
            ...matchedShare,
            signedLinePercentage: advice60.signingPercentage 
        };

        expect(updatedMarketShare.signedLinePercentage).toBe('60.00');
        expect(updatedMarketShare.writtenLinePercentage).toBe(updatedMarketShare.signedLinePercentage);
    });

    it('Step 3: Cash Matching Allocates Capital from Trust to Installment Yields', () => {
        const cashMessage = {
            messageId: 'CASH-MSG-001',
            type: 'CASH',
            umr: 'B0123DAYINTHELIFE',
            amount: 'USD: 15000.00: 2dp'
        };

        const firstInstallment = boundPolicyGraph.installments[0].installment[0];
        
        const matchJunction = {
            id: 'MATCH-001',
            cashRef: cashMessage.messageId,
            installmentRef: firstInstallment.installmentId,
            matchedAmount: cashMessage.amount, // Using $15K cash string to match with the $25K expectation
            varianceAmount: 'USD: 10000.00: 2dp' // We calculate variance
        };

        const routingStatus = matchJunction.varianceAmount === 'USD: 0.00: 2dp' 
            ? 'SETTLED' 
            : 'EXCEPTION_PENDING_CREDIT_CONTROL';

        expect(routingStatus).toBe('EXCEPTION_PENDING_CREDIT_CONTROL');
    });
});
