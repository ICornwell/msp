import { createSchema, createEntityObject, createValueObject } from 'msp_common';

const DOMAIN = { name: 'lloyds-accounting', version: '1.0' };
const NAMESPACE = 'lloyds-core';
const FQID = { namespace: NAMESPACE, version: '1.0' };

// -----------------------------------------------------------------------------
// VALUE OBJECTS (Bound to entities, meaningless without context)
// -----------------------------------------------------------------------------

// 2. Installment - Expected future cashflow slice
export const installmentSchema = createSchema('installment')
  .withFQId(FQID)
  .withProperty('installmentId')
    .forType<string>()
    .withDictionaryId('dict-installment-id', '1.0')
    .withInfoType('Text')
    .endProperty()
  .withProperty('dueDate')
    .forType<string>() // ISO8601 date string
    .withDictionaryId('dict-due-date', '1.0')
    .withInfoType('Text')
    .endProperty()
  .withProperty('status')
    .forType<'EXPECTED' | 'SETTLED' | 'CANCELLED'>()
    .withDictionaryId('dict-status', '1.0')
    .withInfoType('Text')
    .endProperty()
  .withProperty('amount')
    .forType<string>() // Must be string to support fixed-point precision
    .withDictionaryId('dict-amount', '1.0')
    .withInfoType('Money')
    .endProperty()
  .buildSchema();

export const installmentObject = createValueObject('installmentObject', installmentSchema)
  .withFQId(FQID)
  .forDomain(DOMAIN)
  .buildObject();

// 3. MarketShare - The split configuration
export const marketShareSchema = createSchema('marketShare')
  .withFQId(FQID)
  .withProperty('writtenLinePercentage')
    .forType<string>() // Keep as string for fixed-point math
    .withDictionaryId('dict-written-pct', '1.0')
    .withInfoType('Percentage')
    .endProperty()
  .withProperty('signedLinePercentage')
    .forType<string>() 
    .withDictionaryId('dict-signed-pct', '1.0')
    .withInfoType('Percentage')
    .endProperty()
  .buildSchema();

export const marketShareObject = createValueObject('marketShareObject', marketShareSchema)
  .withFQId(FQID)
  .forDomain(DOMAIN)
  .buildObject();

// 4. Charge - Line item for dynamic deductions (Brokerage, FIL taxes, etc)
export const chargeSchema = createSchema('charge')
  .withFQId(FQID)
  .withProperty('chargeType')
    .forType<'PREMIUM' | 'CLAIM' | 'BROKERAGE' | 'FIL_TAX' | 'COMMISSION'>()
    .withDictionaryId('dict-charge-type', '1.0')
    .withInfoType('Text')
    .endProperty()
  .withProperty('description')
    .forType<string>()
    .withDictionaryId('dict-charge-description', '1.0')
    .withInfoType('Text')
    .endProperty()
  .withProperty('amount')
    .forType<string>() // Must be string to support fixed-point precision
    .withDictionaryId('dict-amount', '1.0')
    .withInfoType('Money')
    .endProperty()
  .buildSchema();

export const chargeObject = createValueObject('chargeObject', chargeSchema)
  .withFQId(FQID)
  .forDomain(DOMAIN)
  .buildObject();


// -----------------------------------------------------------------------------
// ENTITIES (Independent lifecycle, strong immutable identities)
// -----------------------------------------------------------------------------

// 1. PolicyLedger - The Root Risk definition
export const policySchema = createSchema('policyLedger')
  .withFQId(FQID)
  .withProperty('umr')
    .forType<string>() // Unique Market Reference
    .withDictionaryId('dict-umr', '1.0')
    .withInfoType('Text')
    .endProperty()
  .withProperty('yearOfAccount')
    .forType<number>()
    .withDictionaryId('dict-yoa', '1.0')
    .withInfoType('Integer')
    .endProperty()
  .withProperty('status')
    .forType<'BOUND' | 'SIGNED' | 'LAPSED'>()
    .withDictionaryId('dict-policy-status', '1.0')
    .withInfoType('Text')
    .endProperty()
  .buildSchema();

export const policyObject = createEntityObject('policyObject', policySchema)
  .withFQId(FQID)
  .forDomain(DOMAIN)
  .withUniqueBusinessKey(d => d.umr)
  .buildObject();

// 2. Syndicate - The Risk Carrier
export const syndicateSchema = createSchema('syndicate')
  .withFQId(FQID)
  .withProperty('syndicateCode')
    .forType<string>() // e.g., '2987'
    .withDictionaryId('dict-syndicate-code', '1.0')
    .withInfoType('Text')
    .endProperty()
  .withProperty('name')
    .forType<string>()
    .withDictionaryId('dict-syndicate-name', '1.0')
    .withInfoType('Text')
    .endProperty()
  .buildSchema();

export const syndicateObject = createEntityObject('syndicateObject', syndicateSchema)
  .withFQId(FQID)
  .forDomain(DOMAIN)
  .withUniqueBusinessKey(d => d.syndicateCode)
  .buildObject();

// 3. Broker - The Intermediary
export const brokerSchema = createSchema('broker')
  .withFQId(FQID)
  .withProperty('brokerPseudonym')
    .forType<string>()
    .withDictionaryId('dict-broker-pseudo', '1.0')
    .withInfoType('Text')
    .endProperty()
  .withProperty('brokerCode')
    .forType<string>()
    .withDictionaryId('dict-broker-code', '1.0')
    .withInfoType('Text')
    .endProperty()
  .buildSchema();

export const brokerObject = createEntityObject('brokerObject', brokerSchema)
  .withFQId(FQID)
  .forDomain(DOMAIN)
  .withUniqueBusinessKey(d => d.brokerCode)
  .buildObject();

// 4. USM Settlement (Cash) - The firm message moving the ledger
export const usmSettlementSchema = createSchema('usmSettlement')
  .withFQId(FQID)
  .withProperty('transactionStatusReference')
    .forType<string>() // The primary key linking Lloyd's messages
    .withDictionaryId('dict-usm-tsr', '1.0')
    .withInfoType('Text')
    .endProperty()
  .withProperty('processingDate')
    .forType<string>()
    .withDictionaryId('dict-usm-date', '1.0')
    .withInfoType('Text')
    .endProperty()
  .buildSchema();

export const usmSettlementObject = createEntityObject('usmSettlementObject', usmSettlementSchema)
  .withFQId(FQID)
  .forDomain(DOMAIN)
  .withUniqueBusinessKey(d => d.transactionStatusReference)
  .buildObject();

// -----------------------------------------------------------------------------
// LEDGER SCHEMAS: Implementing 'Abstract Expressionism'
// Immutable nodes representing state, intent, and reconciliation.
// -----------------------------------------------------------------------------

// 1. Account Node (Immutable structure identifying a balance pot)
export const accountSchema = createSchema('account')
  .withFQId(FQID)
  .withProperty('accountRef')
    .forType<string>()
    .withDictionaryId('dict-account-ref', '1.0')
    .withInfoType('Text')
    .endProperty()
  .withProperty('accountType')
    .forType<'RECEIVABLE' | 'UPR' | 'CASH' | 'EARNED_PREMIUM' | 'VARIANCE_WRITE_OFF' | 'CARRIER_PAYABLE' | 'MGA_INCOME'>()
    .withDictionaryId('dict-account-type', '1.0')
    .withInfoType('Text')
    .endProperty()
  .buildSchema();

export const accountObject = createEntityObject('accountObject', accountSchema)
  .withFQId(FQID)
  .forDomain(DOMAIN)
  .withUniqueBusinessKey(d => d.accountRef)
  .buildObject();

// 2. Journal Entry (Sub-graph leg of a Transaction)
export const journalSchema = createSchema('journal')
  .withFQId(FQID)
  .withProperty('journalId')
    .forType<string>()
    .withDictionaryId('dict-journal-id', '1.0')
    .withInfoType('Text')
    .endProperty()
  .withProperty('entryType')
    .forType<'DEBIT' | 'CREDIT'>()
    .withDictionaryId('dict-entry-type', '1.0')
    .withInfoType('Text')
    .endProperty()
  .withProperty('amount')
    .forType<string>() // Must be string to support fixed-point precision
    .withDictionaryId('dict-amount', '1.0')
    .withInfoType('Money')
    .endProperty()
  .buildSchema();

export const journalObject = createEntityObject('journalObject', journalSchema)
  .withFQId(FQID)
  .forDomain(DOMAIN)
  .withUniqueBusinessKey(d => d.journalId)
  .buildObject();

// 3. Business Event / Transaction Node (Advice, Cash, Variance)
export const businessEventSchema = createSchema('businessEvent')
  .withFQId(FQID)
  .withProperty('eventId')
    .forType<string>()
    .withDictionaryId('dict-event-id', '1.0')
    .withInfoType('Text')
    .endProperty()
  .withProperty('eventType')
    .forType<'LPAN_ADVICE' | 'CASH_RECEIPT' | 'FX_VARIANCE' | 'EARNING_RUN' | 'OUTWARD_ALLOCATION'>()
    .withDictionaryId('dict-event-type', '1.0')
    .withInfoType('Text')
    .endProperty()
  .withProperty('effectiveDate')
    .forType<string>()
    .withDictionaryId('dict-event-date', '1.0')
    .withInfoType('Text')
    .endProperty()
  .buildSchema();

export const businessEventObject = createEntityObject('businessEventObject', businessEventSchema)
  .withFQId(FQID)
  .forDomain(DOMAIN)
  .withUniqueBusinessKey(d => d.eventId)
  .buildObject();

// 4. Match / Junction Node
export const matchJunctionSchema = createSchema('matchJunction')
  .withFQId(FQID)
  .withProperty('matchId')
    .forType<string>()
    .withDictionaryId('dict-match-id', '1.0')
    .withInfoType('Text')
    .endProperty()
  .withProperty('matchDate')
    .forType<string>()
    .withDictionaryId('dict-match-date', '1.0')
    .withInfoType('Date')
    .endProperty()
  .withProperty('matchType')
    .forType<'CASH_TO_ADVICE' | 'CASH_TO_VARIANCE' | 'ADVICE_TO_EARNING'>()
    .withDictionaryId('dict-match-type', '1.0')
    .withInfoType('Text')
    .endProperty()
  .buildSchema();

export const matchJunctionObject = createEntityObject('matchJunctionObject', matchJunctionSchema)
  .withFQId(FQID)
  .forDomain(DOMAIN)
  .withUniqueBusinessKey(d => d.matchId)
  .buildObject();

// -----------------------------------------------------------------------------
// BUSINESS RULES & STRATEGIES (Declarative behavior configurations)
// -----------------------------------------------------------------------------

// 1. FX Strategy Node
export const fxResolutionStrategySchema = createSchema('fxResolutionStrategy')
  .withFQId(FQID)
  .withProperty('strategyType')
    // The engine maps these literals to pure mathematical calculator functions
    .forType<'INCEPTION_DATE_RATE' | 'TRANSACTION_FIRST_OF_MONTH' | 'FIRM_ORDER_FIXED' | 'ROVER_ACTUAL'>()
    .withDictionaryId('dict-fx-strategy', '1.0')
    .withInfoType('Text')
    .endProperty()
  .withProperty('fixedRateOverride') // Used only if FIRM_ORDER_FIXED
    .forType<string>()
    .withDictionaryId('dict-fx-rate', '1.0')
    .withInfoType('Text')
    .endProperty()
  .buildSchema();

export const fxResolutionStrategyObject = createValueObject('fxResolutionStrategyObject', fxResolutionStrategySchema)
  .withFQId(FQID)
  .forDomain(DOMAIN)
  .buildObject();

// 2. Reconciliation Tolerance Node
export const reconciliationToleranceSchema = createSchema('reconciliationTolerance')
  .withFQId(FQID)
  .withProperty('maxAutoWriteOff')
    .forType<string>() // e.g. "0.50"
    .withDictionaryId('dict-tolerance-amount', '1.0')
    .withInfoType('Money')
    .endProperty()
  .withProperty('actionWhenExceeded')
    .forType<'ROUTE_TO_HUMAN' | 'REJECT_CASH' | 'AUTO_ACCEPT_WITH_WARNING'>()
    .withDictionaryId('dict-tolerance-action', '1.0')
    .withInfoType('Text')
    .endProperty()
  .buildSchema();

export const reconciliationToleranceObject = createValueObject('reconciliationToleranceObject', reconciliationToleranceSchema)
  .withFQId(FQID)
  .forDomain(DOMAIN)
  .buildObject();

// 3. Exception Task / Work Item Node (When human intervention is needed)
export const exceptionTaskSchema = createSchema('exceptionTask')
  .withFQId(FQID)
  .withProperty('taskId')
    .forType<string>()
    .withDictionaryId('dict-task-id', '1.0')
    .withInfoType('Text')
    .endProperty()
  .withProperty('taskType')
    .forType<'MATCH_THRESHOLD_EXCEEDED' | 'MISSING_FX_RATE'>()
    .withDictionaryId('dict-task-type', '1.0')
    .withInfoType('Text')
    .endProperty()
  .withProperty('status')
    .forType<'OPEN' | 'RESOLVED_BY_HUMAN' | 'REJECTED'>()
    .withDictionaryId('dict-task-status', '1.0')
    .withInfoType('Text')
    .endProperty()
  .buildSchema();

export const exceptionTaskObject = createEntityObject('exceptionTaskObject', exceptionTaskSchema)
  .withFQId(FQID)
  .forDomain(DOMAIN)
  .withUniqueBusinessKey(d => d.taskId)
  .buildObject();
