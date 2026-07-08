import { describe, it, expect } from 'vitest';
import { bindRiskView, bookPremiumView, marketSigningsView } from '../src/data/viewsByOperation.js';

describe('Business Operations to Graph Views Mapping', () => {

    it('Bind Risk view maintains structural integrity for counterparties', () => {
        expect(bindRiskView.rootElement.object).toBe('policyObject');
        expect(bindRiskView.rootElement.subElements?.find(r => r.object === 'syndicateObject')?.relationFromParent).toBe('subscribedBy');
        expect(bindRiskView.rootElement.subElements?.find(r => r.object === 'brokerObject')?.relationFromParent).toBe('brokedBy');
    });

    it('Market Signings view binds MarketShare to Syndicates', () => {
        const marketShareRelation = marketSigningsView.rootElement.subElements?.find(r => r.object === 'marketShareObject');
        expect(marketShareRelation?.relationFromParent).toBe('hasSignings');
        expect(marketShareRelation?.subElements?.find(r => r.object === 'syndicateObject')?.relationFromParent).toBe('allocatedTo');
    });

    it('Book Premium view maintains installment hierarchy', () => {
        const installmentRelation = bookPremiumView.rootElement.subElements?.find(r => r.object === 'installmentObject');
        expect(installmentRelation?.relationFromParent).toBe('hasInstallments');
    });

});
