import { createView } from 'msp_common';
import { relObjs } from './viewRelations.js';

export const bindRiskView = createView('bindRiskView')
  .withRootElement(relObjs.policyObject, false)
    .withNamedSubElementList('syndicate', relObjs.syndicateObject)
      .withRelation('subscribedBy')
      .end()
    .withNamedSubElement('broker', relObjs.brokerObject, false)
      .withRelation('brokedBy')
      .end()
  .end()
  .endView()
  .build();

export const marketSigningsView = createView('marketSigningsView')
  .withRootElement(relObjs.policyObject, false)
    .withNamedSubElementList('marketShare', relObjs.marketShareObject)
      .withRelation('hasSignings')
      .withNamedSubElement('syndicate', relObjs.syndicateObject, false)
        .withRelation('allocatedTo')
        .end()
      .end()
    .end()
  .endView()
  .build();

export const bookPremiumView = createView('bookPremiumView')
  .withRootElement(relObjs.policyObject, false)
    .withNamedSubElementList('installment', relObjs.installmentObject)
      .withRelation('hasInstallments')
      .end()
  .end()
  .endView()
  .build();

export const settlePremiumView = createView('settlePremiumView')
  .withRootElement(relObjs.brokerObject, false)
  // We need to define new relational bridging without moneyObject if settle is required here.
  // Actually, settle behavior mapping belongs in ledger reconciling.
  .end()
  .endView()
  .build();

