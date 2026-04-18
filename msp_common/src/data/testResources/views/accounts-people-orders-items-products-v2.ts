import { createView } from '../../fluent/viewBuilder.js';
import { createSchema } from '../../fluent/schemaBuilder.js';

import { domainObject } from '../../fluent/objectBuilder.js';
import { createRelations } from '../../fluent/objectRelationsBuilder.js';

// Define schemas for each entity
export const accountSchema = createSchema('account')
  .withId('account', '1.0')
  .withProperty('accountNumber')
    .forType<string>()
    .withDictionaryId('dict-account-number', '1.0')
    .withInfoType('Text')
    .withDefaultLabel('Account Number')
    .endProperty()
  .buildSchema();

export const personSchema = createSchema('person')
  .withId('person', '1.0')
  .withProperty('name')
    .forType<string>()
    .withDictionaryId('dict-name', '1.0')
    .withInfoType('Text')
    .withDefaultLabel('Name')
    .endProperty()
  .buildSchema();

export const orderSchema = createSchema('order')
  .withId('order', '1.0')
  .withProperty('orderId')
    .forType<string>()
    .withDictionaryId('dict-order-id', '1.0')
    .withInfoType('Text')
    .withDefaultLabel('Order ID')
    .endProperty()
  .buildSchema();

export const orderItemSchema = createSchema('orderItem')
  .withId('orderItem', '1.0')
  .withProperty('itemId')
    .forType<string>()
    .withDictionaryId('dict-item-id', '1.0')
    .withInfoType('Text')
    .withDefaultLabel('Item ID')
    .endProperty()
  .buildSchema();

export const productSchema = createSchema('product')
  .withId('product', '1.0')
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

  const accountObject = domainObject('accountObject', accountSchema)
        .withId('acc-123', '1.0')
        .forDomain({ name: 'sales', version: '1.0' })
        .withIsEntity(true)
        .buildDomainObject();

         const personObject = domainObject('personObject', personSchema)
        .withId('person-123', '1.0')
        .forDomain({ name: 'sales', version: '1.0' })
        .withIsEntity(true)
        .buildDomainObject();
  
      const orderObject = domainObject('orderObject', orderSchema)
        .withId('order-123', '1.0')
        .forDomain({ name: 'sales', version: '1.0' })
        .withIsEntity(true)
        .buildDomainObject();
  
      const itemObject = domainObject('itemObject', orderItemSchema)
        .withId('item-123', '1.0')
        .forDomain({ name: 'sales', version: '1.0' })
        .withIsEntity(true)
        .buildDomainObject();
  
      const productObject = domainObject('productObject', productSchema)
        .withId('product-123', '1.0')
        .forDomain({ name: 'sales', version: '1.0' })
        .withIsEntity(true)
        .buildDomainObject();
  
      const relObjs = createRelations()
      .allowRelationFrom('hasOrder', accountObject, orderObject, true)
      .allowRelationFrom('belongsTo', accountObject, personObject, true)
      .allowRelationFrom('hasItem', orderObject, itemObject, true)
      .allowRelationFrom('orderedProduct', itemObject, productObject, false)
      .buildRelatedObjects();

// Build view with fluent syntax
export const accountsPeopleOrdersItemsProductsView2Context = createView('account-people')
  .withVersion('1.0')
  .withConfigSet('main')
  .withRootKey('accountNumber')
  .withRootElement(relObjs.accountObject, false)
  
    .withSubElement('person', relObjs.personObject, false)
      .withRelation('belongsTo')
      .end()
    .withSubElement('order', relObjs.orderObject, true)
      .withRelation('hasOrder')
      .withSubElement('orderItem', relObjs.itemObject, true)
        .withRelation('hasItem')
        .withSubElement('product', relObjs.productObject, false)
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
