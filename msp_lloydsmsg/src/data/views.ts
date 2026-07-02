import { createRelations } from 'msp_common';
import { createView } from 'msp_common';
import { View } from 'msp_common';
import { 
    policyObject, 
    syndicateObject, 
    brokerObject, 
    usmSettlementObject,
    moneyObject,
    installmentObject,
    marketShareObject,
    chargeObject
} from './schemas.js';

// -----------------------------------------------------------------------------
// STEP 5: DEFINE ALLOWED RELATIONSHIPS (EDGES)
// -----------------------------------------------------------------------------
// The names dictate the edge direction. By separating entities and value objects,
// we ensure the graph maintains strict traversal roots.

export const lloydsRelations = createRelations()
  // --- Policy Root Edges ---
  .allowRelationFromTo('placedByBroker', policyObject, brokerObject, false) // Many policies -> 1 Broker
  .allowRelationFromTo('hasInstallment', policyObject, installmentObject, true) // 1 Policy -> Many Installments
  
  // --- Market Distribution Edges ---
  .allowRelationFromTo('participatesVia', policyObject, marketShareObject, true) 
  .allowRelationFromTo('carrier', marketShareObject, syndicateObject, false) // Link the share to the true Syndicate entity

  // --- Financial Values (Bound to objects providing context) ---
  .allowRelationFromTo('installmentGrossAmount', installmentObject, moneyObject, false) // Original Currency
  .allowRelationFromTo('installmentNetAmount', installmentObject, moneyObject, false)
  .allowRelationFromTo('hasDeduction', installmentObject, chargeObject, true) // Break down of deductions on the installment

  // Charges also need a financial magnitude defined
  .allowRelationFromTo('chargeAmount', chargeObject, moneyObject, false)

  // --- Cash Movement / USM Routing ---
  // Many-to-Many cash allocation between a USM settling an expected Installment.
  // Note: in a pure graph mapping, 'allocateTo' can be the edge containing a weight/value.
  // But for msp_bus_data, usually we define an explicit bridge entity for allocation if we need to store data on the edge.
  // We'll define a simple edge here for now:
  .allowRelationFromTo('allocatesToInstallment', usmSettlementObject, installmentObject, true)
  .buildRelatedObjects();
// -----------------------------------------------------------------------------
// STEP 7: CREATE VIEWS FOR SPECIFIC BUSINESS OPERATIONS
// -----------------------------------------------------------------------------

// View A: The Binding & Booking View
// Used to insert or diff the expected shape of the risk before cash arrives.
export const policyBookingViewContext = createView('policy-booking-view')
  .withVersion('1.0')
  .withConfigSet('lloyds')
  .useBusinessKey()
  .withRootElement(lloydsRelations.policyObject, false)
    // Broker Context
    .withNamedSubElement('broker', lloydsRelations.brokerObject, false)
      .withRelation('placedByBroker')
    .end()
    
    // Market Split
      .withNamedSubElement('marketShares', lloydsRelations.marketShareObject, true)
        .withRelation('participatesVia')
        
      .withNamedSubElement('syndicate', lloydsRelations.syndicateObject, false)
        .withRelation('carrier')  
      .end()
    

    // Expected Installments
//    .withNamedList('installments', lloydsRelations.installmentObject, false)
      .withNamedSubElement('grossPremium', lloydsRelations.moneyObject, true)
        .end()
      .withNamedSubElement('netPremium', lloydsRelations.moneyObject, false)
       
        .end()
      .withNamedSubElement('deductions', lloydsRelations.chargeObject, true)
       .withRelation('')
        .withNamedSubElement('amount', lloydsRelations.moneyObject, false)
        .end() // Return from deduction to installment
      .end() // Return from installment to policy map
      .end()
    
  .endView(); // Close view before build

export const policyBookingView = policyBookingViewContext.build() as View<any>;
export type PolicyBookingData = typeof policyBookingView.dataType;


// View B: USM Settlement View
// Used to process an incoming EDIFACT USM and allocate it to existing Policy Installments.
export const usmSettlementViewContext = createView('usm-settlement-view')
  .withVersion('1.0')
  .withConfigSet('lloyds')
  .useBusinessKey()
  .withRootElement(usmSettlementObject, false)
    .withNamedList('allocations', installmentObject, false) // Target existing installments by ID
  .endView();

export const usmSettlementView = usmSettlementViewContext.build() as View<any>;
export type UsmSettlementData = typeof usmSettlementView.dataType;
