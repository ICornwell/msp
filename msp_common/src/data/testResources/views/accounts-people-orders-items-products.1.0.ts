import { view } from '../../fluent/viewBuilder.js';
import { schema } from '../../fluent/schemaBuilder.js';
import { relationsBuilder } from '../../fluent/objectRelationsBuilder.js';
import { domainObject } from '../../fluent/objectBuilder.js';

// Define schemas for each entity
export const accountSchema = schema('account')
  .withId('acc-123', '1.0')
  .withProperty('accountNumber')
    .forType<string>()
    .withDictionaryId('dict-account-number', '1.0')
    .withInfoType('Text')
    .withDefaultLabel('Account Number')
    .endProperty()
  .buildSchema();

export const personSchema = schema('person')
  .withId('person-123', '1.0')
  .withProperty('name')
    .forType<string>()
    .withDictionaryId('dict-name', '1.0')
    .withInfoType('Text')
    .withDefaultLabel('Name')
    .endProperty()
  .buildSchema();

export const addressSchema = schema('address')
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

export const orderSchema = schema('order')
  .withId('order-123', '1.0')
  .withProperty('orderId')
    .forType<string>()
    .withDictionaryId('dict-order-id', '1.0')
    .withInfoType('Text')
    .withDefaultLabel('Order ID')
    .endProperty()
  .buildSchema();

export const orderItemSchema = schema('orderItem')
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

export const productSchema = schema('product')
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

   const accountObject = domainObject('accountObject', accountSchema)
          .withId('acc-123', '1.0')
          .forDomain({ id: 'sales', version: '1.0' })
          .withIsEntity(true)
          .buildDomainObject();
  
   const personObject = domainObject('personObject', personSchema)
          .withId('person-123', '1.0')
          .forDomain({ id: 'sales', version: '1.0' })
          .withIsEntity(true)
          .buildDomainObject();

    const addressObject = domainObject('addressObject', addressSchema)
          .withId('address-123', '1.0')
          .forDomain({ id: 'sales', version: '1.0' })
          .withIsEntity(false)
          .buildDomainObject();
    
    const orderObject = domainObject('orderObject', orderSchema)
          .withId('order-123', '1.0')
          .forDomain({ id: 'sales', version: '1.0' })
          .withIsEntity(false)
          .buildDomainObject();
    
    const itemObject = domainObject('itemObject', orderItemSchema)
          .withId('item-123', '1.0')
          .forDomain({ id: 'sales', version: '1.0' })
          .withIsEntity(false)
          .buildDomainObject();
    
    const productObject = domainObject('productObject', productSchema)
          .withId('product-123', '1.0')
          .forDomain({ id: 'sales', version: '1.0' })
          .withIsEntity(true)
          .buildDomainObject();
    
    const relObjs = relationsBuilder()
        .allowRelationFrom('hasOrder', accountObject, orderObject, true)
        .allowRelationFrom('belongsTo', accountObject, personObject, true)
        .allowRelationFrom('hasItem', orderObject, itemObject, true)
        .allowRelationFrom('orderedProduct', itemObject, productObject, false)
        .allowRelationFrom('hasAddress', personObject, addressObject, false)
        .buildRelatedObjects();
  

// Build the view using the fluent builder with schemas
export const accountsPeopleOrdersItemsProductsViewContext = view('account-people')
  .withVersion('1.0')
  .withConfigSet('main')
  .withRootKey('accountNumber')
  .withRootElement(relObjs.accountObject, false)
    .withSubElement('person', relObjs.personObject, false)
      .withRelation('belongsTo')
      .withSubElement('address', relObjs.addressObject, false)
          .withRelation('hasAddress')
          .end()
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
    

export const accountsPeopleOrdersItemsProductsView = accountsPeopleOrdersItemsProductsViewContext.build();

// Type is now automatically extracted from the builder context!
export type AccountsPeopleOrdersItemsProductsData = typeof accountsPeopleOrdersItemsProductsView.dataType;

// Example data matching the inferred type
export const testData: AccountsPeopleOrdersItemsProductsData = {
accountNumber: "ACC-12345",
  person: {
    name: "John Doe",
    address: {
      street: "123 Main St",
   //   city: "Anytown",
      postalCode: "12345"
    }
  },
  order: [
    {
      orderId: "ORD-001",
      orderItem: [
        {
          itemId: "ITEM-001",
          numberOfUnits: 2,
          product: {
            productId: "PROD-001",
            name: "Widget"
          }
        }
      ]
    }
  ]
};




