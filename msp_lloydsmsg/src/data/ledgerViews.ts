import { createView } from 'msp_common';
import { relObjs } from './viewRelations.js';

export const transactionLedgerView = createView('transactionLedgerView')
  .withRootElement(relObjs.businessEventObject, false)
    .withNamedSubElementList('journals', relObjs.journalObject)
      .withRelation('generatesJournal')
      // Removed .withNamedSubElement('money', moneyObject) mapping as well
      .withNamedSubElement('account', relObjs.accountObject, false)
        .withRelation('postsToAccount')
        .end()
      .end()
    .end()
  .endView()
  .build();

export const doubleEntryAccountView = createView('doubleEntryAccountView')
  .withRootElement(relObjs.accountObject, false)
    .withNamedSubElementList('entries', relObjs.journalObject)
      .withRelation('hasEntry')
      .withNamedSubElement('transaction', relObjs.businessEventObject, false)
        .withRelation('originatedFrom')
        .end()
      .end()
    .end()
  .endView()
  .build();

export const matchingView = createView('matchingView')
  .withRootElement(relObjs.matchJunctionObject, false)
    .withNamedSubElementList('sourceEvents', relObjs.businessEventObject)
      .withRelation('linksEvent')
      .end()
    .end()
  .endView()
  .build();

export const matchingWithExceptionsView = createView('matchingWithExceptionsView')
  .withRootElement(relObjs.matchJunctionObject, false)
    .withNamedSubElementList('sourceEvents', relObjs.businessEventObject)
      .withRelation('linksEvent')
      .end()
    .withNamedSubElementList('exceptions', relObjs.exceptionTaskObject)
      .withRelation('raisedException')
      .end()
    .end()
  .endView()
  .build();

export const policyConfigView = createView('policyConfigView')
  .withRootElement(relObjs.policyObject, false)
    .withNamedSubElement('fxStrategy', relObjs.fxResolutionStrategyObject, false)
      .withRelation('usesFxStrategy')
      .end()
    .withNamedSubElement('tolerance', relObjs.reconciliationToleranceObject, false)
      .withRelation('appliesTolerance')
      .end()
    .end()
  .endView()
  .build();
