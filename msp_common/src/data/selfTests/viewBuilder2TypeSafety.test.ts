import { describe, it, expect } from 'vitest';
import { view } from '../fluent/viewBuilder.js';
import { schema } from '../fluent/schemaBuilder.js';
import { domainObject } from '../fluent/objectBuilder.js';
import { relationsBuilder } from '../fluent/objectRelationsBuilder.js';

describe('Declarative View Builder - Type Safety', () => {
  it('should provide type-safe sub-element names', () => {
    // Define schemas
    const accountSchema = schema('account')
      .withId('account', '1.0')
      .withProperty('accountId')
        .forType<string>()
        .withDictionaryId('dict-account-id', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Account ID')
        .endProperty()
      .buildSchema();

    const personSchema = schema('person')
      .withId('person', '1.0')
      .withProperty('name')
        .forType<string>()
        .withDictionaryId('dict-name', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Name')
        .endProperty()
      .buildSchema();

    const orderSchema = schema('order')
      .withId('order', '1.0')
      .withProperty('orderId')
        .forType<string>()
        .withDictionaryId('dict-order-id', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Order ID')
        .endProperty()
      .buildSchema();

    const itemSchema = schema('item')
      .withId('item', '1.0')
      .withProperty('itemId')
        .forType<string>()
        .withDictionaryId('dict-item-id', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Item ID')
        .endProperty()
      .buildSchema();

    const accountObject = domainObject('account', accountSchema)
      .withId('account-123', '1.0')
      .buildDomainObject();

    const personObject = domainObject('person', personSchema)
      .withId('person-456', '1.0')
      .buildDomainObject();

    const orderObject = domainObject('order', orderSchema)
      .withId('order-789', '1.0')
      .buildDomainObject();
    const itemObject = domainObject('item', itemSchema)
      .withId('item-101', '1.0')
      .buildDomainObject();

    const relsObjs = relationsBuilder()
        .allowRelationFrom('hasPerson', accountObject, personObject, true)
        .allowRelationFrom('hasOrder', accountObject, orderObject, true)
        .allowRelationFrom('hasItem', orderObject, itemObject, true)
        .buildRelatedObjects();


    // Build view - TypeScript will enforce that only 'person' or 'order' are valid
    const testViewB = view('test-view')
      .withVersion('1.0')
      .withConfigSet('main')
      .withRootKey('accountId')
      .withRootElement(relsObjs.account, false)
        // TypeScript knows the valid children are: 'person' and 'order'
        // Try to configure 'person' - this should work
        .withSubElement('person', relsObjs.person, false)
          .withRelation('hasPerson')
        
        .end()  // person has no children, go back to root
        // Now configure 'order'
        .withSubElement('order', relsObjs.order, true)
          .withRelation('hasOrder')

          // TypeScript knows 'order' has one valid child: 'item'
          .withSubElement('item', relsObjs.item, false)
          .end()  // back to order
        .end()  // back to root
      .end()  // back to view
    .endView();

    const testView = testViewB.build();

    // Verify the view was built correctly
    expect(testView.name).toBe('test-view');
    expect(testView.rootElement.object).toBe('account');
    
    const person = testView.rootElement.subElements![0] as any;
    expect(person.object).toBe('person');
    expect(person.queryObjectId).toBe('person');
    
    const order = testView
    .rootElement.subElements![1] as any;
    expect(order.object).toBe('order');
    expect(order.queryObjectId).toBe('order');
    
    const item = order.subElements![0] as any;
    expect(item.object).toBe('item');
    expect(item.queryObjectId).toBe('item');
  });

  it('should work with deeply nested structures', () => {
    const level1Schema = schema('level1')
      .withId('level1', '1.0')
      .withProperty('id1')
        .forType<string>()
        .withDictionaryId('dict-id1', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Level 1 ID')
        .endProperty()
      .buildSchema();

    const level2Schema = schema('level2')
      .withId('level2', '1.0')
      .withProperty('id2')
        .forType<string>()
        .withDictionaryId('dict-id2', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Level 2 ID')
        .endProperty()
      .buildSchema();

    const level3Schema = schema('level3')
      .withId('level3', '1.0')
      .withProperty('id3')
        .forType<string>()
        .withDictionaryId('dict-id3', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Level 3 ID')
        .endProperty()
      .buildSchema();

    const level4Schema = schema('level4')
      .withId('level4', '1.0')
      .withProperty('id4')
        .forType<string>()
        .withDictionaryId('dict-id4', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Level 4 ID')
        .endProperty()
      .buildSchema();

    const level1Object = domainObject('level1', level1Schema)
      .withId('l1-123', '1.0')
      .buildDomainObject();

    const level2Object = domainObject('level2', level2Schema)
      .withId('l2-123', '1.0')
      .buildDomainObject();

    const level3Object = domainObject('level3', level3Schema)
      .withId('l3-123', '1.0')
      .buildDomainObject();

    const level4Object = domainObject('level4', level4Schema)
      .withId('l4-123', '1.0')
      .buildDomainObject(); 

    const testview = view('deep-view')
      .withVersion('1.0')
      .withConfigSet('main')
      .withRootKey('id1')
      .withRootElement(level1Object, false)
        .withSubElement('l2', level2Object,  false)
          .withSubElement('l3', level3Object, false)
            .withSubElement('l4', level4Object  ,false)
            .end()
          .end()
        .end()
      .end()
      .endView()
      .build();

    expect(testview.name).toBe('deep-view');
    const l2 = testview.rootElement.subElements![0] as any;
    expect(l2.queryObjectId).toBe('l2');
    const l3 = l2.subElements![0] as any;
    expect(l3.queryObjectId).toBe('l3');
    const l4 = l3.subElements![0] as any;
    expect(l4.queryObjectId).toBe('l4');
  });
});
