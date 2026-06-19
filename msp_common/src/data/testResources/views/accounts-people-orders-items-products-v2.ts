import { createView } from '../../fluent/viewBuilder.js';
import { createSchema } from '../../fluent/schemaBuilder.js';

import { createEntityObject } from '../../fluent/objectBuilder.js';
import { createRelations } from '../../fluent/objectRelationsBuilder.js';

// Define schemas for each entity
export const accountSchema = createSchema('account')
  .withFQId({name: 'account', version: '1.0'})
  .withProperty('accountNumber')
    .forType<string>()
    .withDictionaryId('dict-account-number', '1.0')
    .withInfoType('Text')
    .withDefaultLabel('Account Number')
    .endProperty()
  .buildSchema();

export const personSchema = createSchema('person')
  .withFQId({name: 'person', version: '1.0'})
  .withProperty('name')
    .forType<string>()
    .withDictionaryId('dict-name', '1.0')
    .withInfoType('Text')
    .withDefaultLabel('Name')
    .endProperty()
  .buildSchema();

export const orderSchema = createSchema('order')
  .withFQId({name: 'order', version: '1.0'})
  .withProperty('orderId')
    .forType<string>()
    .withDictionaryId('dict-order-id', '1.0')
    .withInfoType('Text')
    .withDefaultLabel('Order ID')
    .endProperty()
  .buildSchema();

export const orderItemSchema = createSchema('orderItem')
  .withFQId({name: 'orderItem', version: '1.0'})
  .withProperty('itemId')
    .forType<string>()
    .withDictionaryId('dict-item-id', '1.0')
    .withInfoType('Text')
    .withDefaultLabel('Item ID')
    .endProperty()
  .buildSchema();

export const productSchema = createSchema('product')
  .withFQId({name: 'product', version: '1.0'})
  .withProperty('productId')
    .forType<string>()
    .withDictionaryId('dict-product-id', '1.0')
    .withInfoType('Text')
    .withDefaultLabel('Product ID')
    .endProperty()
  .withProperty('name')
    .forType<string>()
    .withDictionaryId('dict-product-name', '1.0')
    .withInfoType('Text')
    .withDefaultLabel('Product Name')
    .endProperty()
  .buildSchema();

  const accountObject = createEntityObject('accountObject', accountSchema)
        .withFQId({name: 'acc-123', version: '1.0'})
        .forDomain({ name: 'sales', version: '1.0' })
        .buildObject();

         const personObject = createEntityObject('personObject', personSchema)
        .withFQId({name: 'person-123', version: '1.0'})
        .forDomain({ name: 'sales', version: '1.0' })
        .buildObject();
  
      const orderObject = createEntityObject('orderObject', orderSchema)
        .withFQId({name: 'order-123', version: '1.0'})
        .forDomain({ name: 'sales', version: '1.0' })
        .buildObject();
  
      const itemObject = createEntityObject('itemObject', orderItemSchema)
        .withFQId({name: 'item-123', version: '1.0'})
        .forDomain({ name: 'sales', version: '1.0' })
        .buildObject();
  
      const productObject = createEntityObject('productObject', productSchema)
        .withFQId({name: 'product-123', version: '1.0'})
        .forDomain({ name: 'sales', version: '1.0' })
        .buildObject();
  
      const relObjs = createRelations()
      .allowRelationFromTo('hasOrder', accountObject, orderObject, true)
      .allowRelationFromTo('belongsTo', accountObject, personObject, true)
      .allowRelationFromTo('hasItem', orderObject, itemObject, true)
      .allowRelationFromTo('orderedProduct', itemObject, productObject, false)
      .buildRelatedObjects();

// Build view with fluent syntax
export const accountsPeopleOrdersItemsProductsView2Context = createView('account-people')
  .withVersion('1.0')
  .withConfigSet('main')
  .withRootKey('accountNumber')
  .withRootElement(relObjs.accountObject, false)
  
    .withNamedSubElement('person', relObjs.personObject, false)
      .withRelation('belongsTo')
      .end()
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
  .endView();
export const accountsPeopleOrdersItemsProductsView2 = accountsPeopleOrdersItemsProductsView2Context.build();

// Type automatically inferred from the builder context!
export type AccountsPeopleOrdersItemsProductsData2 = typeof accountsPeopleOrdersItemsProductsView2Context.data;

// Test data with full type safety
export const testData: AccountsPeopleOrdersItemsProductsData2 = {
  accountNumber: "ACC-12345",
  person: {
    name: "John Doe"
  },
  order: [
    {
      orderId: "ORD-001",
      orderItem: [
        {
          itemId: "ITEM-001",
          product: {
            productId: "PROD-001",
            name: "Widget"
          }
        }
      ]
    }
  ]
};
