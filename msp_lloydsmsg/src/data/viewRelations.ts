import { createRelations } from 'msp_common';
import { 
  accountObject, journalObject, businessEventObject, matchJunctionObject, policyObject,
  syndicateObject, brokerObject, installmentObject, marketShareObject,
  fxResolutionStrategyObject, reconciliationToleranceObject, exceptionTaskObject
} from './schemas.js';

export const relObjs = createRelations()
  // viewsByOperation relations
  .allowRelationFromTo('subscribedBy', policyObject, syndicateObject, true)
  .allowRelationFromTo('brokedBy', policyObject, brokerObject, false)
  .allowRelationFromTo('hasSignings', policyObject, marketShareObject, true)
  .allowRelationFromTo('allocatedTo', marketShareObject, syndicateObject, false)
  .allowRelationFromTo('hasInstallments', policyObject, installmentObject, true)
  // Removed `forAmount` links to standalone money object 
  // removed `paysAmount`, `settlesInstallment`, `settlesPolicy` coming from money object
  // ledgerViews.ts relations
  .allowRelationFromTo('generatesJournal', businessEventObject, journalObject, true)
  .allowRelationFromTo('postsToAccount', journalObject, accountObject, false)
  .allowRelationFromTo('hasEntry', accountObject, journalObject, true)
  .allowRelationFromTo('originatedFrom', journalObject, businessEventObject, false)
  .allowRelationFromTo('linksEvent', matchJunctionObject, businessEventObject, true)
  .allowRelationFromTo('raisedException', matchJunctionObject, exceptionTaskObject, true)
  // Policy config views
  .allowRelationFromTo('usesFxStrategy', policyObject, fxResolutionStrategyObject, false)
  .allowRelationFromTo('appliesTolerance', policyObject, reconciliationToleranceObject, false)
  .buildRelatedObjects();
