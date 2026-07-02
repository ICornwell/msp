import { createView } from 'msp_common';
import { 
  policyObject, syndicateObject, brokerObject, moneyObject, installmentObject, marketShareObject 
} from './schemas.js';

export const bindRiskView = createView('bindRiskView')
  .withRootElement(policyObject, false)
    .withNamedSubElementList('syndicate', syndicateObject)
      .withRelation('subscribedBy')
      .end()
    .withNamedSubElement('broker', brokerObject, false)
      .withRelation('brokedBy')
      .end()
  .__build();

export const marketSigningsView = createView('marketSigningsView')
  .withRootElement(policyObject, false)
    .withNamedSubElementList('marketShare', marketShareObject)
      .withRelation('hasSignings')
      .withNamedSubElement('syndicate', syndicateObject, false)
        .withRelation('allocatedTo')
        .end()
      .end()
  .__build();

export const bookPremiumView = createView('bookPremiumView')
  .withRootElement(policyObject, false)
    .withNamedSubElementList('installment', installmentObject)
      .withRelation('hasInstallments')
      .withNamedSubElement('money', moneyObject, false)
        .withRelation('forAmount')
        .end()
      .end()
  .__build();

export const settlePremiumView = createView('settlePremiumView')
  .withRootElement(brokerObject, false)
    .withNamedSubElementList('money', moneyObject)
      .withRelation('paysAmount')
      .withNamedSubElement('installment', installmentObject, false)
        .withRelation('settlesInstallment')
        .end()
      .withNamedSubElement('policy', policyObject, false)
        .withRelation('settlesPolicy')
        .end()
      .end()
  .__build();
