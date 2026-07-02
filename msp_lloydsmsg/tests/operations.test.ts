import { describe, it, expect } from 'vitest';
import { bindRiskView, bookPremiumView, settlePremiumView, marketSigningsView } from '../src/data/viewsByOperation.js';

describe('Business Operations to Graph Views Mapping', () => {
    it('Bind Risk view maintains structural integrity for counterparties', () => {
        expect(bindRiskView.object).toBe('policyObject');
        expect(bindRiskView.subElements?.find(r => r.object === 'syndicateObject')?.relationFromParent).toBe('subscribedBy');
        expect(bindRiskView.subElements?.find(r => r.object === 'brokerObject')?.relationFromParent).toBe('brokedBy');
    });

    it('Market Signings view binds MarketShare to Syndicates', () => {
        const marketShareRelation = marketSigningsView.subElements?.find(r => r.object === 'marketShareObject');
        expect(marketShareRelation?.relationFromParent).toBe('hasSignings');
        expect(marketShareRelation?.subElements?.find(r => r.object === 'syndicateObject')?.relationFromParent).toBe('allocatedTo');
    });

    it('Book Premium view maintains installment hierarchy', () => {
        const installmentRelation = bookPremiumView.subElements?.find(r => r.object === 'installmentObject');
        expect(installmentRelation?.relationFromParent).toBe('hasInstallments');
        expect(installmentRelation?.subElements?.find(r => r.object === 'moneyObject')?.relationFromParent).toBe('forAmount');
    });

    it('Settle Premium view bridges Broker payments to Installments/Policies', () => {
        expect(settlePremiumView.object).toBe('brokerObject');
        const moneyRelation = settlePremiumView.subElements?.find(r => r.object === 'moneyObject');
        expect(moneyRelation?.relationFromParent).toBe('paysAmount');
        expect(moneyRelation?.subElements?.find(r => r.object === 'installmentObject')?.relationFromParent).toBe('settlesInstallment');
        expect(moneyRelation?.subElements?.find(r => r.object === 'policyObject')?.relationFromParent).toBe('settlesPolicy');
    });
});
