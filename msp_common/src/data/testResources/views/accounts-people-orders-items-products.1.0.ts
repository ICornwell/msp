import { v4 as uuid } from 'uuid';

import { createView } from '../../fluent/viewBuilder.js';
import { createSchema } from '../../fluent/schemaBuilder.js';
import { createRelations } from '../../fluent/objectRelationsBuilder.js';
import { createValueObject, createEntityObject } from '../../fluent/objectBuilder.js';
import { View } from '../../../index.js';

// Define schemas for each entity
export const accountSchema = createSchema('account')
  .withId('acc-123', '1.0')
  .withProperty('accountNumber')
  .forType<string>()
  .withDictionaryId('dict-account-number', '1.0')
  .withInfoType('Text')
  .withDefaultLabel('Account Number')
  .endProperty()
  .buildSchema();

export const personSchema = createSchema('person')
  .withId('person-123', '1.0')
  .withProperty('name')
  .forType<string>()
  .withDictionaryId('dict-name', '1.0')
  .withInfoType('Text')
  .withDefaultLabel('Name')
  .endProperty()
  .buildSchema();

export const addressSchema = createSchema('address')
  .withId('address-123', '1.0')
  .withProperty('street')
  .forType<string>()
  .withDictionaryId('dict-street', '1.0')
  .withInfoType('Text')
  .withDefaultLabel('Street')
  .endProperty()
  .withProperty('city')
  .forType<string>()
  .withDictionaryId('dict-city', '1.0')
  .withInfoType('Text')
  .withDefaultLabel('City')
  .endProperty()
  .withProperty('postalCode')
  .forType<string>()
  .withDictionaryId('dict-postal-code', '1.0')
  .withInfoType('Text')
  .withDefaultLabel('Postal Code')
  .endProperty()
  .buildSchema();

export const orderSchema = createSchema('order')
  .withId('order-123', '1.0')
  .withProperty('orderId')
  .forType<string>()
  .withDictionaryId('dict-order-id', '1.0')
  .withInfoType('Text')
  .withDefaultLabel('Order ID')
  .endProperty()
  .buildSchema();

export const orderItemSchema = createSchema('orderItem')
  .withId('item-123', '1.0')
  .withProperty('itemId')
  .forType<string>()
  .withDictionaryId('dict-item-id', '1.0')
  .withInfoType('Text')
  .withDefaultLabel('Item ID')
  .endProperty()
  .withProperty('numberOfUnits')
  .forType<number>()
  .withDictionaryId('dict-number-of-units', '1.0')
  .withInfoType('Integer')
  .withDefaultLabel('Number of Units')
  .endProperty()
  .buildSchema();

export const productSchema = createSchema('product')
  .withId('product-123', '1.0')
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
  .withId('acc-123', '1.0')
  .forDomain({ name: 'sales', version: '1.0' })
  .buildObject();

const personObject = createEntityObject('personObject', personSchema)
  .withId('person-123', '1.0')
  .forDomain({ name: 'sales', version: '1.0' })
  .buildObject();

const addressObject = createValueObject('addressObject', addressSchema)
  .withId('address-123', '1.0')
  .forDomain({ name: 'sales', version: '1.0' })
  .buildObject();

const orderObject = createValueObject('orderObject', orderSchema)
  .withId('order-123', '1.0')
  .forDomain({ name: 'sales', version: '1.0' })
  .buildObject();

const itemObject = createValueObject('itemObject', orderItemSchema)
  .withId('item-123', '1.0')
  .forDomain({ name: 'sales', version: '1.0' })
  .buildObject();

const productObject = createEntityObject('productObject', productSchema)
  .withId('product-123', '1.0')
  .forDomain({ name: 'sales', version: '1.0' })

  .buildObject();

const relObjs = createRelations()
  .allowRelationFromTo('hasOrder', accountObject, orderObject, true)
  .allowRelationFromTo('belongsTo', accountObject, personObject, true)
  .allowRelationFromTo('hasItem', orderObject, itemObject, true)
  .allowRelationFromTo('orderedProduct', itemObject, productObject, false)
  .allowRelationFromTo('hasAddress', personObject, addressObject, false)
  .buildRelatedObjects();


// Build the view using the fluent builder with schemas
export const accountsPeopleOrdersItemsProductsViewContext = createView('account-people')
  .withVersion('1.0')
  .withConfigSet('main')
  .withRootKey('accountNumber')
  .withRootElement(relObjs.accountObject, false)
  .withNamedSubElement('person', relObjs.personObject, false)
    .withRelation('belongsTo')
    .withNamedSubElement('address', relObjs.addressObject, false)
      .withRelation('hasAddress')
      .end()
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

export const simplePersonViewContext = createView('person-view')
  .withVersion('1.0')
  .withConfigSet('main')
  .withRootKey('email')
  .withRootElement(relObjs.personObject, false)
    .withNamedSubElement('address', relObjs.addressObject, false)
      .withRelation('hasAddress')
      .end()
    .end()
  .endView();



export const accountsPeopleOrdersItemsProductsView = accountsPeopleOrdersItemsProductsViewContext.build() as View<any>;
export const simplePersonView = simplePersonViewContext.build() as View<any>;

// Type is now automatically extracted from the builder context!
export type AccountsPeopleOrdersItemsProductsData = typeof accountsPeopleOrdersItemsProductsView.dataType;

// Example data matching the inferred type
export function testData(): AccountsPeopleOrdersItemsProductsData {
  return {
    accountNumber: `ACC-12345-${uuid()}`,
    person: {
      name: "John Doe",
      email: `john.doe.${uuid()}@example.com`,
      address: {
        street: "123 Main St",
        //   city: "Anytown",
        postalCode: "12345"
      }
    },
    order: [
      {
        orderId: `ORD-001-${uuid()}`,
        orderItem: [
          {
            itemId: `ITEM-001-${uuid()}`,
            numberOfUnits: 2,
            product: {
              productId: `PROD-001-${uuid()}`,
              name: "Widget"
            }
          }
        ]
      }
    ]
  };
}



