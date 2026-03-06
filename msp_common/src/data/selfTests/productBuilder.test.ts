import { describe, it, expect } from 'vitest';
import { schema } from '../fluent/schemaBuilder.js';
import { view } from '../fluent/viewBuilder.js';
import { product } from '../fluent/productBuilder.js';

import { domainObject } from '../fluent/objectBuilder.js';
import { relationsBuilder } from '../fluent/objectRelationsBuilder.js';

describe('Product Builder Integration', () => {
  it('should build a complete product with schemas and views', () => {
    // Define schemas
    const personSchema = schema('personSchema')
      .withId('person', '1.0')
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

    const accountSchema = schema('accountSchema')
      .withId('account', '1.0')
      .withProperty('accountNumber')
        .withDictionaryId('dict-account-num', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Account Number')
      .endProperty()
      .buildSchema();

    const personObject = domainObject('person', personSchema)
      .withId('person-789', '1.0')
      .buildDomainObject();

    const accountObject = domainObject('account', accountSchema)
      .withId('account-789', '1.0')
      .buildDomainObject();

    const relObjs = relationsBuilder()
        .allowRelationFrom('belongsTo', accountObject, personObject, true)
        .buildRelatedObjects();

    // Build a view
    const accountView = view('account-person-view')
      .withVersion('1.0')
      .withRootKey('accountNumber')
      .withRootElement(relObjs.account, false)
        .withSubElement('person', relObjs.person, false)
          .withRelation('belongsTo')
        .end()
      .end()
      .endView()
      .build();

    // Build a product
    const myProduct = product()
      .withName('Account Management')
      .withId('account-mgmt', '1.0.0')
      .withDomain({ id: 'banking', version: '1.0' })
      .addView(accountView)
      .buildProduct();

    // Assertions
    expect(myProduct.name).toBe('Account Management');
    expect(myProduct.id).toEqual({ id: 'account-mgmt', version: '1.0.0' });
    expect(myProduct.domain).toEqual({ id: 'banking', version: '1.0' });
    expect(myProduct.views).toHaveLength(1);
    expect(myProduct.views[0].name).toBe('account-person-view');
    
    // Check that view is bound to product
    expect(myProduct.views[0].domain).toEqual({ id: 'banking', version: '1.0' });
    expect(myProduct.views[0].product).toEqual({ id: 'account-mgmt', version: '1.0.0' });
  });

  it('should support product version inheritance', () => {
    // Version 1.0
    const personSchemaV1 = schema('personSchema')
      .withId('person', '1.0')
      .withProperty('name')
        .withDictionaryId('dict-name', '1.0')
        .withInfoType('Text')
      .endProperty()
      .buildSchema();

    const domainObjectV1 = domainObject('person', personSchemaV1)
      .withId('person-001', '1.0')
      .buildDomainObject();

    const viewV1 = view('person-view')
      .withVersion('1.0')
      .withRootKey('id')
      .withRootElement(domainObjectV1, true)
      .end()
      .endView()
      .build();

    const productV1 = product()
      .withName('Person Management')
      .withId('person-mgmt', '1.0.0')
      .addView(viewV1)
      .buildProduct();

    // Version 1.1 - inherits from 1.0 and adds new schema
    const addressSchema = schema('addressSchema')
      .withId('address', '1.0')
      .withProperty('street')
        .withDictionaryId('dict-street', '1.0')
        .withInfoType('Text')
      .endProperty()
      .withProperty('city')
        .withDictionaryId('dict-city', '1.0')
        .withInfoType('Text')
      .endProperty()
      .buildSchema();

    const addressObject = domainObject('address', addressSchema)
      .withId('address-001', '1.0')
      .buildDomainObject();

    const addressView = view('address-view')
      .withVersion('1.0')
      .withRootKey('id')
      .withRootElement(addressObject, true)
      .end()
      .endView()
      .build();

    const productV1_1 = product()
      .withName('Person Management')
      .withId('person-mgmt', '1.1.0')
      .inheritsFrom(productV1)
      .addView(addressView)
      .buildProduct();

    // Assertions
    expect(productV1_1.views).toHaveLength(2); // Inherited + new
    expect(productV1_1.views[0].name).toBe('person-view'); // Inherited
    expect(productV1_1.views[1].name).toBe('address-view'); // New
    expect(productV1_1.inheritsFrom).toEqual({ id: 'person-mgmt', version: '1.0.0' });
  });

  it('should generate correct ViewObjectType', () => {
    // Define schemas
    const orderSchema = schema('orderSchema')
      .withId('order', '1.0')
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

    const itemSchema = schema('itemSchema')
      .withId('item', '1.0')
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

    const orderObject = domainObject('order', orderSchema)
      .withId('order-123', '1.0')
      .buildDomainObject();

    const itemObject = domainObject('item', itemSchema)
      .withId('item-456', '1.0')
      .buildDomainObject();

    const relObjs = relationsBuilder()
        .allowRelationFrom('hasItem', orderObject, itemObject, true)
        .buildRelatedObjects();

    const orderViewBuilder = view('order-items-view')
      .withVersion('1.0')
      .withRootKey('orderId')
      .withRootElement(relObjs.order, false)
        .withSubElement('item',relObjs.item, true)
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
