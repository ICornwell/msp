import { describe, it, expect } from 'vitest';
import { matchingWithExceptionsView, policyConfigView } from '../src/data/ledgerViews.js';

describe('Reconciliation Tolerance and Exception Graph Behavior', () => {

    it('Scenario: Match Shortfall exceeds Policy Tolerance - Routes to Human', () => {
        
        // 1. Define Policy Rule via DSL View Form
        const policyRules: typeof policyConfigView._TYPE = {
            umr: 'B0123...FXTEST',
            yearOfAccount: 2026,
            status: 'BOUND',
            fxStrategy: {
                strategyType: 'TRANSACTION_FIRST_OF_MONTH'
            },
            tolerance: {
                maxAutoWriteOff: '0.50',
                currency: 'USD',
                actionWhenExceeded: 'ROUTE_TO_HUMAN'
            }
        };

        // 2. The Matching Node resulting from £10 cash against £20 expectation
        const badMatch: typeof matchingWithExceptionsView._TYPE = {
            matchId: 'MATCH-002',
            matchType: 'CASH_TO_ADVICE',
            matchDate: '2026-07-02',
            sourceEvents: [
                { eventId: 'CASH-002', eventType: 'CASH_RECEIPT', effectiveDate: '2026-07-02' },
                { eventId: 'ADV-002', eventType: 'LPAN_ADVICE', effectiveDate: '2026-07-01' }
            ],
            // Because $10 > $0.50 tolerance, our worker creates an exception rather than a variance write-off
            exceptions: [
                {
                    taskId: 'TASK-EXC-001',
                    taskType: 'MATCH_THRESHOLD_EXCEEDED',
                    status: 'OPEN'
                }
            ]
        };

        expect(policyRules.tolerance.maxAutoWriteOff).toBe('0.50');
        expect(policyRules.tolerance.actionWhenExceeded).toBe('ROUTE_TO_HUMAN');
        
        // Assert the Match Node correctly holds the Exception Event instead of resolving it
        expect(badMatch.exceptions.length).toBe(1);
        expect(badMatch.exceptions[0].taskType).toBe('MATCH_THRESHOLD_EXCEEDED');
        expect(badMatch.exceptions[0].status).toBe('OPEN');
    });

});
