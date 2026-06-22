import { describe, it, expect } from 'vitest';
import { createSchema } from '../fluent/schemaBuilder.js';
import { createView } from '../fluent/viewBuilder.js';
import { product } from '../fluent/productBuilder.js';

import { createValueObject } from '../fluent/objectBuilder.js';
import { createRelations } from '../fluent/objectRelationsBuilder.js';

describe('Product Builder Integration', () => {
  it('should build a complete product with schemas and views', () => {
    // Define schemas
    const personSchema = createSchema('personSchema')
      .withFQId({ namespace: 'test', version: '1.0'})
      .withProperty('name')
        .withDictionaryId('dict-name', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Name')
      .endProperty()
      .withProperty('age')
        .withDictionaryId('dict-age', '1.0')
        .withInfoType('Integer')
        .withDefaultLabel('Age')
      .endProperty()
      .buildSchema();

    const accountSchema = createSchema('accountSchema')
      .withFQId({ namespace: 'test', version: '1.0'})
      .withProperty('accountNumber')
        .withDictionaryId('dict-account-num', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Account Number')
      .endProperty()
      .buildSchema();

    const personObject = createValueObject('person', personSchema)
      .withFQId({ namespace: 'test', version: '1.0'})
      .buildObject();

    const accountObject = createValueObject('account', accountSchema)
      .withFQId({ namespace: 'test', version: '1.0'})
      .buildObject();

    const relObjs = createRelations()
        .allowRelationFromTo('belongsTo', accountObject, personObject, true)
        .buildRelatedObjects();

    // Build a view
    const accountView = createView('account-person-view')
      .withVersion('1.0')
      .withRootKey('accountNumber')
      .withRootElement(relObjs.account, false)
        .withNamedSubElement('person', relObjs.person, false)
          .withRelation('belongsTo')
        .end()
      .end()
      .endView()
      .build();

    // Build a product
    const myProduct = product('Account Management')
      .withFQId({ namespace: 'test', version: '1.0.0'})
      .withDomain({ name: 'banking', version: '1.0' })
      .addView(accountView)
      .buildProduct();

    // Assertions
    expect(myProduct.name).toBe('Account Management');
    expect(myProduct.id).toEqual({name: 'Account Management', namespace: 'test', version: '1.0.0' });
    expect(myProduct.domain).toEqual({ name: 'banking', version: '1.0' });
    expect(myProduct.views).toHaveLength(1);
    expect(myProduct.views[0].name).toBe('account-person-view');
    
    // Check that view is bound to operational namespace
    expect(myProduct.views[0].namespace).toBe('banking');
  });

  it('should support product version inheritance', () => {
    // Version 1.0
    const personSchemaV1 = createSchema('personSchema')
      .withFQId({ namespace: 'test', version: '1.0'})
      .withProperty('name')
        .withDictionaryId('dict-name', '1.0')
        .withInfoType('Text')
      .endProperty()
      .buildSchema();

    const domainObjectV1 = createValueObject('person', personSchemaV1)
      .withFQId({ namespace: 'test', version: '1.0'})
      .buildObject();

    const viewV1 = createView('person-view')
      .withVersion('1.0')
      .withRootKey('id')
      .withRootElement(domainObjectV1, true)
      .end()
      .endView()
      .build();

    const productV1 = product('Person Management')
      .withFQId({ namespace: 'test', version: '1.0.0'})
      .addView(viewV1)
      .buildProduct();

    // Version 1.1 - inherits from 1.0 and adds new schema
    const addressSchema = createSchema('addressSchema')
      .withFQId({ namespace: 'test', version: '1.0'})
      .withProperty('street')
        .withDictionaryId('dict-street', '1.0')
        .withInfoType('Text')
      .endProperty()
      .withProperty('city')
        .withDictionaryId('dict-city', '1.0')
        .withInfoType('Text')
      .endProperty()
      .buildSchema();

    const addressObject = createValueObject('address', addressSchema)
      .withFQId({ namespace: 'test', version: '1.0'})
      .buildObject();

    const addressView = createView('address-view')
      .withVersion('1.0')
      .withRootKey('id')
      .withRootElement(addressObject, true)
      .end()
      .endView()
      .build();

    const productV1_1 = product('Person Management')
      .withFQId({ namespace: 'test', version: '1.1.0'})
      .inheritsFrom(productV1)
      .addView(addressView)
      .buildProduct();

    // Assertions
    expect(productV1_1.views).toHaveLength(2); // Inherited + new
    expect(productV1_1.views[0].name).toBe('person-view'); // Inherited
    expect(productV1_1.views[1].name).toBe('address-view'); // New
    expect(productV1_1.inheritsFrom).toEqual({ name: 'Person Management', namespace: 'test', version: '1.0.0' });
  });

  it('should generate correct ViewObjectType', () => {
    // Define schemas
    const orderSchema = createSchema('orderSchema')
      .withFQId({ namespace: 'test', version: '1.0'})
      .withProperty('orderId')
        .forType<string>()
        .withDictionaryId('dict-order-id', '1.0')
        .withInfoType('Text')
      .endProperty()
      .withProperty('total')
        .withDictionaryId('dict-total', '1.0')
        .withInfoType('Money')
      .endProperty()
      .buildSchema();

    const itemSchema = createSchema('itemSchema')
      .withFQId({ namespace: 'test', version: '1.0'})
      .withProperty('itemName')
        .forType<string>()
        .withDictionaryId('dict-item-name', '1.0')
        .withInfoType('Text')
      .endProperty()
      .withProperty('quantity')
        .forType<number>()  
        .withDictionaryId('dict-qty', '1.0')
        .withInfoType('Integer')
      .endProperty()
      .buildSchema();

    const orderObject = createValueObject('order', orderSchema)
      .withFQId({ namespace: 'test', version: '1.0'})
      .buildObject();

    const itemObject = createValueObject('item', itemSchema)
      .withFQId({ namespace: 'test', version: '1.0'})
      .buildObject();

    const relObjs = createRelations()
        .allowRelationFromTo('hasItem', orderObject, itemObject, true)
        .buildRelatedObjects();

    const orderViewBuilder = createView('order-items-view')
      .withVersion('1.0')
      .withRootKey('orderId')
      .withRootElement(relObjs.order, false)
        .withNamedSubElement('item',relObjs.item, true)
          .withRelation('hasItem')
        .end()
      .end()
      .endView();

 
    // Generate type
    type OrderViewData = typeof orderViewBuilder.data;

    // Type assertion (compile-time check)
    const data: OrderViewData = {
      orderId: 'ORD-001',
      total: 100.50,
      item: [
        { itemName: 'Widget', quantity: 2 },
        { itemName: 'Gadget', quantity: 1 }
      ]
    };

    expect(data.orderId).toBe('ORD-001');
    expect(data.item).toHaveLength(2);
  });
});
