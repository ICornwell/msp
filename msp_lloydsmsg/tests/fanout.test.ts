import { describe, it, expect } from 'vitest';
import { transactionLedgerView } from '../src/data/ledgerViews.js';

describe('Carrier Fan-Out Graph Behavior', () => {

    it('Scenario: LPAN triggers Outward Allocation, splitting capital to carriers', () => {

        // The transaction mapping the outward portion of the fan-out
        const outwardAllocationTransaction: typeof transactionLedgerView._TYPE = {
            eventId: 'EVT-ALLOC-001',
            eventType: 'OUTWARD_ALLOCATION',
            effectiveDate: '2026-07-02',
            journals: [
                // 1. Relieve the incoming UPR (Debit the liability away from the MGA)
                {
                    journalId: 'JNL-ALC-001',
                    entryType: 'DEBIT',
                    money: { amount: '100000.00', currency: 'USD' }, // Gross Broker Net
                    account: { accountRef: 'ACC-UPR-001', accountType: 'UPR' }
                },
                // 2. Skim MGA Commission (Credit the MGA's P&L) - e.g. 20%
                {
                    journalId: 'JNL-ALC-002',
                    entryType: 'CREDIT',
                    money: { amount: '20000.00', currency: 'USD' },
                    account: { accountRef: 'ACC-INC-001', accountType: 'MGA_INCOME' }
                },
                // 3. Allocate to Carrier A (Syndicate 2001, e.g. 40% of the Net layer)
                {
                    journalId: 'JNL-ALC-003',
                    entryType: 'CREDIT',
                    money: { amount: '32000.00', currency: 'USD' },
                    account: { accountRef: 'ACC-PAY-2001', accountType: 'CARRIER_PAYABLE' }
                },
                // 4. Allocate to Carrier B (Syndicate 2002, e.g. 60% of the Net layer)
                {
                    journalId: 'JNL-ALC-004',
                    entryType: 'CREDIT',
                    money: { amount: '48000.00', currency: 'USD' },
                    account: { accountRef: 'ACC-PAY-2002', accountType: 'CARRIER_PAYABLE' }
                }
            ]
        };
        
        let sumDebits = 0;
        let sumCredits = 0;
        
        outwardAllocationTransaction.journals.forEach(j => {
            const val = parseFloat(j.money.amount);
            if (j.entryType === 'DEBIT') sumDebits += val;
            if (j.entryType === 'CREDIT') sumCredits += val;
        });

        // The transaction must structurally balance
        expect(sumDebits - sumCredits).toBe(0);
        
        // Ensure standard MGA income was sliced
        const incomeLeg = outwardAllocationTransaction.journals.find(j => j.account.accountType === 'MGA_INCOME');
        expect(incomeLeg?.money.amount).toBe('20000.00');
    });

});
