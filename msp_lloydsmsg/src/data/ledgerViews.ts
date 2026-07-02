import { createView } from 'msp_common';
import { 
  accountObject, journalObject, businessEventObject, matchJunctionObject, moneyObject
} from './schemas.js';

export const transactionLedgerView = createView('transactionLedgerView')
  .withRootElement(businessEventObject, false)
    .withNamedSubElementList('journals', journalObject)
      .withRelation('generatesJournal')
      .withNamedSubElement('money', moneyObject, false)
        .withRelation('forAmount')
        .end()
      .withNamedSubElement('account', accountObject, false)
        .withRelation('postsToAccount')
        .end()
      .end()
  .__build();

export const doubleEntryAccountView = createView('doubleEntryAccountView')
  .withRootElement(accountObject, false)
    .withNamedSubElementList('entries', journalObject)
      .withRelation('hasEntry')
      .withNamedSubElement('money', moneyObject, false)
        .withRelation('forAmount')
        .end()
      .withNamedSubElement('transaction', businessEventObject, false)
        .withRelation('originatedFrom')
        .end()
      .end()
  .__build();

export const matchingView = createView('matchingView')
  .withRootElement(matchJunctionObject, false)
    .withNamedSubElementList('sourceEvents', businessEventObject)
      .withRelation('linksEvent')
      .end()
  .__build();

import { fxResolutionStrategyObject, reconciliationToleranceObject, exceptionTaskObject } from './schemas.js';

// Extend the matching view to understand exceptions
export const matchingWithExceptionsView = createView('matchingWithExceptionsView')
  .withRootElement(matchJunctionObject, false)
    .withNamedSubElementList('sourceEvents', businessEventObject)
      .withRelation('linksEvent')
      .end()
    .withNamedSubElementList('exceptions', exceptionTaskObject)
      .withRelation('raisedException')
      .end()
  .__build();

export const policyConfigView = createView('policyConfigView')
  .withRootElement(policyObject, false)
    .withNamedSubElement('fxStrategy', fxResolutionStrategyObject, false)
      .withRelation('usesFxStrategy')
      .end()
    .withNamedSubElement('tolerance', reconciliationToleranceObject, false)
      .withRelation('appliesTolerance')
      .end()
  .__build();
