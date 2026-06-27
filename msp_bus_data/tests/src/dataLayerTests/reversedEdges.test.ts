
import { createView, View } from 'msp_common';
import { testData, accountsPeopleOrdersItemsProductsView,
   relObjs,
   } from '../../../../msp_common/dist/data/testResources/views/accounts-people-orders-items-products.1.0.js';
import { WriteData, ReadData } from './integratedTestsSdk.js';

const peopleAccountViewContext = createView('peopleAccount')
  .withVersion('1.0')
  .withConfigSet('main')
 .useBusinessKey()
  .withRootElement(relObjs.personObject, false)
  .withNamedSubElement('address', relObjs.addressObject, false)
      .withRelation('hasAddress')
      .end()
  .withNamedSubElement('account', relObjs.accountObject, false)
    .withBackRelation('belongsTo')
      .withNamedSubElement('order', relObjs.orderObject, true)
        .withRelation('hasOrder')
        .withNamedSubElement('orderItem', relObjs.itemObject, true)
          .withRelation('hasItem')
          .withNamedSubElement('product', relObjs.productObject, false)
            .withRelation('orderedProduct')
            .end()
          .end()
        .end()
      .end()
    .end()
  .endView();

/* export const simpleAccountViewContext = createView('person-view')
  .withVersion('1.0')
  .withConfigSet('main')
 .useBusinessKey()
  .withRootElement(relObjs.personObject, false)
    .withNamedSubElement('account', relObjs.accountObject, false)
      .withBackRelation('belongsTo')
      .end()
    .end()
  .endView(); */



export const peopleAccountView = peopleAccountViewContext.build() as View<any>;
// export const simpleAccountView = simpleAccountViewContext.build() as View<any>;

// Type is now automatically extracted from the builder context!
// export type PeopleAccountViewData = typeof peopleAccountView.dataType;
 
describe('reversed edges / withRelationBack for view reads', () => {
  const debugTimeOut: number = 600000
  it('should read reversed edges correctly', async () => {
    const v = accountsPeopleOrdersItemsProductsView;
    console.log('Using view:', v.name, 'version:', v.version);
    const initialData = testData()
    const r1 = await WriteData(accountsPeopleOrdersItemsProductsView, initialData)
    const eid = r1.entityId
    const readBackData = await ReadData(accountsPeopleOrdersItemsProductsView, eid)

    // Step 2: Update the inserted record
    let person = readBackData?.person

    let personBusinessKey = person?.__businessKey

    const readBackData2 = await ReadData(peopleAccountView, personBusinessKey, true)

    expect(readBackData2?.account?.__businessKey).toBe(initialData.__businessKey);
    
    
  }, debugTimeOut)
})