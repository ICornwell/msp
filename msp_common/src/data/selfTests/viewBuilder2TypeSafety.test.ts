import { describe, it, expect } from 'vitest';
import { createView } from '../fluent/viewBuilder.js';
import { createSchema } from '../fluent/schemaBuilder.js';
import { createEntityObject, createValueObject } from '../fluent/objectBuilder.js';
import { createRelations } from '../fluent/objectRelationsBuilder.js';

describe('Declarative View Builder - Type Safety', () => {
  it('should provide type-safe sub-element names', () => {
    // Define schemas
    const accountSchema = createSchema('account')
      .withFQId({ namespace: 'test', version: '1.0'})
      .withProperty('accountId')
        .forType<string>()
        .withDictionaryId('dict-account-id', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Account ID')
        .endProperty()
      .buildSchema();

    const personSchema = createSchema('person')
      .withFQId({ namespace: 'test', version: '1.0'})
      .withProperty('name')
        .forType<string>()
        .withDictionaryId('dict-name', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Name')
        .endProperty()
      .buildSchema();

    const orderSchema = createSchema('order')
      .withFQId({ namespace: 'test', version: '1.0'})
      .withProperty('orderId')
        .forType<string>()
        .withDictionaryId('dict-order-id', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Order ID')
        .endProperty()
      .buildSchema();

    const itemSchema = createSchema('item')
      .withFQId({ namespace: 'test', version: '1.0'})
      .withProperty('itemId')
        .forType<string>()
        .withDictionaryId('dict-item-id', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Item ID')
        .endProperty()
      .buildSchema();

    const accountObject = createValueObject('account', accountSchema)
      .withFQId({ namespace: 'test', version: '1.0'})
      .buildObject();

    const personObject = createValueObject('person', personSchema)
      .withFQId({ namespace: 'test', version: '1.0'})
      .buildObject();

    const orderObject = createValueObject('order', orderSchema)
      .withFQId({ namespace: 'test', version: '1.0'})
      .buildObject();
    const itemObject = createValueObject('item', itemSchema)
      .withFQId({ namespace: 'test', version: '1.0'})
      .buildObject();

    const relsObjs = createRelations()
        .allowRelationFromTo('hasPerson', accountObject, personObject, true)
        .allowRelationFromTo('hasOrder', accountObject, orderObject, true)
        .allowRelationFromTo('hasItem', orderObject, itemObject, true)
        .buildRelatedObjects();


    // Build view - TypeScript will enforce that only 'person' or 'order' are valid
    const testViewB = createView('test-view')
      .withVersion('1.0')
      .withConfigSet('main')
     .useBusinessKey()
      .withRootElement(relsObjs.account, false)
        // TypeScript knows the valid children are: 'person' and 'order'
        // Try to configure 'person' - this should work
        .withNamedSubElement('person', relsObjs.person, false)
          .withRelation('hasPerson')
        
        .end()  // person has no children, go back to root
        // Now configure 'order'
        .withNamedSubElement('order', relsObjs.order, true)
          .withRelation('hasOrder')

          // TypeScript knows 'order' has one valid child: 'item'
          .withNamedSubElement('item', relsObjs.item, false)
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
    const level1Schema = createSchema('level1')
      .withFQId({ namespace: 'test', version: '1.0'})
      .withProperty('id1')
        .forType<string>()
        .withDictionaryId('dict-id1', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Level 1 ID')
        .endProperty()
      .buildSchema();

    const level2Schema = createSchema('level2')
      .withFQId({ namespace: 'test', version: '1.0'})
      .withProperty('id2')
        .forType<string>()
        .withDictionaryId('dict-id2', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Level 2 ID')
        .endProperty()
      .buildSchema();

    const level3Schema = createSchema('level3')
      .withFQId({ namespace: 'test', version: '1.0'})
      .withProperty('id3')
        .forType<string>()
        .withDictionaryId('dict-id3', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Level 3 ID')
        .endProperty()
      .buildSchema();

    const level4Schema = createSchema('level4')
      .withFQId({ namespace: 'test', version: '1.0'})
      .withProperty('id4')
        .forType<string>()
        .withDictionaryId('dict-id4', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Level 4 ID')
        .endProperty()
      .buildSchema();

    const level1Object = createValueObject('level1', level1Schema)
      .withFQId({ namespace: 'test', version: '1.0'})
      .buildObject();

    const level2Object = createValueObject('level2', level2Schema)
      .withFQId({ namespace: 'test', version: '1.0'})
      .buildObject();

    const level3Object = createValueObject('level3', level3Schema)
      .withFQId({ namespace: 'test', version: '1.0'})
      .buildObject();

    const level4Object = createValueObject('level4', level4Schema)
      .withFQId({ namespace: 'test', version: '1.0'})
      .buildObject(); 

    const testview = createView('deep-view')
      .withVersion('1.0')
      .withConfigSet('main')
     .useBusinessKey()
      .withRootElement(level1Object, false)
        .withNamedSubElement('l2', level2Object,  false)
          .withNamedSubElement('l3', level3Object, false)
            .withNamedSubElement('l4', level4Object  ,false)
            .end()
          .end()
        .end()
      .end()
      .endView()
      .build();

    expect(testview.name).toBe('deep-view');
    const l2 = testview.rootElement.subElements![0] as any;
    expect(l2.queryObjectId).toBe('level2');
    const l3 = l2.subElements![0] as any;
    expect(l3.queryObjectId).toBe('level3');
    const l4 = l3.subElements![0] as any;
    expect(l4.queryObjectId).toBe('level4');
  });
});
