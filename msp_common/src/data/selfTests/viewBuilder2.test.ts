import { describe, it, expect } from 'vitest';

import { view } from '../fluent/viewBuilder.js';
import { schema } from '../fluent/schemaBuilder.js';

import { domainObject } from '../fluent/objectBuilder.js';
import { relationsBuilder } from '../fluent/objectRelationsBuilder.js';

describe('Declarative View Builder', () => {

    const accountSchema = schema('account')
    .withId('account', '1.0')
    .withProperty('accountNumber')
      .forType<string>()
      .withDictionaryId('dict-account-number', '1.0')
      .withInfoType('Text')
      .withDefaultLabel('Account Number')
      .endProperty()
    .withProperty('opened')
      .forType<Date>()
      .withDictionaryId('dict-account-number', '1.0')
      .withInfoType('Date')
      .withDefaultLabel('Account Number')
      .endProperty()
    .buildSchema();

  const personSchema = schema('person')
    .withId('person', '1.0')
    .withProperty('name').withDictionaryId('dict-account-number', '1.0')
      .forType<string>()
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

  const orderItemSchema = schema('orderItem')
    .withId('orderItem', '1.0')
    .withProperty('itemId')
      .forType<string>()
      .withDictionaryId('dict-item-id', '1.0')
      .withInfoType('Text')
      .withDefaultLabel('Item ID')
      .endProperty()
    .buildSchema();

  const productSchema = schema('product')
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
    .forDomain({ id: 'banking', version: '1.0' })
    .withIsEntity(true)
    .buildDomainObject();

  const personObject = domainObject('personObject', personSchema)
    .withId('person-123', '1.0')
    .forDomain({ id: 'banking', version: '1.0' })
    .withIsEntity(true)
    .buildDomainObject();

  const orderObject = domainObject('orderObject', orderSchema)
    .withId('order-123', '1.0')
    .forDomain({ id: 'banking', version: '1.0' })
    .withIsEntity(true)
    .buildDomainObject();

  const orderItemObject = domainObject('orderItemObject', orderItemSchema)
    .withId('orderItem-123', '1.0')
    .forDomain({ id: 'banking', version: '1.0' })
    .withIsEntity(true)
    .buildDomainObject();

  const productObject = domainObject('productObject', productSchema)
    .withId('product-123', '1.0')
    .forDomain({ id: 'banking', version: '1.0' })
    .withIsEntity(true)
    .buildDomainObject();

  const relatedObjs = relationsBuilder()
    .allowRelationFrom('belongsTo', accountObject, personObject, false)
    .allowRelationFrom('accountOwner', personObject, accountObject, false)
    .allowRelationFrom('hasOrder', accountObject, orderObject, true)
    .allowRelationFrom('withItem', orderObject, orderItemObject, true)
    .allowRelationFrom('forProduct', orderItemObject, productObject, false)
    .allowRelationFrom('fromSellingPerson', orderItemObject, personObject, false)
    .buildRelatedObjects();


  it('should build view with declarative structure and infer correct types', () => {
    // Define schemas


    // Build view with declarative structure using TypeScript-native array syntax
    const simpleViewContext = view('account-people-orders')
      .withVersion('1.0')
      .withRootKey('accountNumber')
      .withRootElement(relatedObjs.accountObject, false)  // Object notation with element name
        .withSubElement("person", relatedObjs.personObject, false)  // Object notation
          .withRelation('belongsTo')
          .end()
        .withSubElement("order", relatedObjs.orderObject, true)  // Object notation
          .withRelation('hasOrder')
          .withSubElement("orderItem", relatedObjs.orderItemObject, true)  // Object notation
            .withRelation('withItem')
              .withSubElement("product", relatedObjs.productObject, false)  // Object notation
                .withRelation('forProduct')
                .end()
            .end()
          .end()
        .end()
    .endView()

    const accView = simpleViewContext.build();

    type SimpleViewType = typeof accView.dataType;

    // Extract the data type
   // type SimpleViewData = typeof simpleViewContext.data;

    // Test runtime structure
    expect(accView.name).toBe('account-people-orders');

    expect(accView.rootElement.object).toBe('accountObject');
    expect(accView.rootElement.isCollection).toBe(false);
    expect(accView.rootElement.subElements).toHaveLength(2);

    // person is a single element
    const person = accView.rootElement.subElements![0] as any;
    expect(person.object).toBe('person');
    expect(person.isCollection).toBe(false);

    // order is a collection
    const order = accView.rootElement.subElements![1] as any;
    expect(order.object).toBe('order');
    expect(order.isCollection).toBe(true);
    expect(order.subElements).toHaveLength(1);

    // orderItem is a collection nested in order
    const orderItem = order.subElements![0] as any;
    expect(orderItem.object).toBe('orderItem');
    expect(orderItem.isCollection).toBe(true);
    expect(orderItem.subElements).toHaveLength(1);

    // product is a single element nested in orderItem
    const product = orderItem.subElements![0] as any;
    expect(product.object).toBe('product');
    expect(product.isCollection).toBe(false);

    // Type extraction approach 1: Use ViewDataTypeFromDef directly on the definition
    // This provides perfect type inference because the structure is visible at compile time
    // Apply Flatten to resolve any accumulated intersection types
    type DirectDataType = typeof accView.dataType;

    const testData: DirectDataType = {
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

    expect(testData.accountNumber).toBe("ACC-12345");
    expect(testData?.person?.name).toBe("John Doe");
    expect(testData?.order?.[0]?.orderId).toBe("ORD-001");
  });

  it('should build view with declarative structure and infer correct types for array roots', () => {
    // Define schemas


    // Build view with declarative structure using TypeScript-native array syntax
    const simpleViewContext = view('account-people-orders')
      .withVersion('1.0')
      .withRootKey('accountNumber')
      .withRootElement(relatedObjs.accountObject, true)  // Object notation with element name
       
          .withSubElement("person", relatedObjs.personObject, false)  // Object notation
            .withRelation('belongsTo')
            .end()
          .withSubElement("order", relatedObjs.orderObject, true)  // Object notation
            .withRelation('hasOrder')
            .withSubElement("orderItem", relatedObjs.orderItemObject, true)  // Object notation
              .withRelation('withItem')
               .withSubElement("product", relatedObjs.productObject, false)  // Object notation
                 .withRelation('forProduct')
                 .end()
              .end()
            .end()
          .end()
      .endView()

    const accView = simpleViewContext.build();

    type CollectionViewType = typeof accView.dataType;

    const testData: CollectionViewType = [
      {
        accountNumber: "ACC-12345",

        person: {
          name: "John Doe"
        }
      }
    ];
    
    expect(testData[0].accountNumber).toBe("ACC-12345");
    expect(testData[0]?.person?.name).toBe("John Doe");
  });

    it('should allow schema re-use in structure, with unique query IDs', () => {
    // Define schemas


    // Build view with declarative structure using TypeScript-native array syntax
    const simpleViewContext = view('account-people-orders')
      .withVersion('1.0')
      .withRootKey('accountNumber')
      .withRootElement(relatedObjs.accountObject, true)  // Object notation with element name
          .withSubElement("person", relatedObjs.personObject, false)  // Object notation
            .withRelation('belongsTo')
            .end()
          .withSubElement("order", relatedObjs.orderObject, true)  // Object notation
            .withRelation('hasOrder')
            .withSubElement("orderItem", relatedObjs.orderItemObject, true)  // Object notation
              .withRelation('withItem')
               .withSubElement("person", relatedObjs.personObject, false)  // Object notation
                 .withRelation('fromSellingPerson')
                 .end()
              .end()
            .end()
          .end()
      .endView()

    const accView = simpleViewContext.build();

    type CollectionViewType = typeof accView.dataType;

    const testData: CollectionViewType = [
      {
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
                 person: {
                  name: "Jane Seller"
                }
              }
            ]
          }
        ]
      }
    ];
    
    expect(testData[0].accountNumber).toBe("ACC-12345");
    expect(testData[0]?.person?.name).toBe("John Doe");
    expect(testData[0]?.order?.[0]?.orderItem?.[0]?.person?.name).toBe("Jane Seller");

    expect(accView.rootElement.subElements![0].queryObjectId).toBe('person')
    expect(accView.rootElement.subElements![1].subElements![0].subElements![0].queryObjectId).toBe('person_2');
  });

   it('should  allow schema inheritance', () => {
    // Define schemas
      const accountSchema2 = schema('account2')
        .inheritsFrom(accountSchema)
        .withId('account', '2.0')
          .withProperty('creditLimit')
          .forType<number>()
          .withDictionaryId('dict-credit-limit', '1.0')
          .withInfoType('Money')
          .withDefaultLabel('Credit Limit')
          .endProperty()
        .buildSchema();

      const personSchema2 = schema('person')
        .withId('person', '2.0')
        .inheritsFrom(personSchema)
        .withProperty('country').withDictionaryId('dict-country', '1.0')
          .forType<string>()
          .withInfoType('Text')
          .withDefaultLabel('Country')
          .endProperty()
        .buildSchema();

     const accountObject2 = domainObject('accountObject2', accountSchema2)
      .withId('acc-456', '2.0')
      .forDomain({ id: 'banking', version: '1.0' })
      .withIsEntity(true)
      .buildDomainObject();
      
    const personObject2 = domainObject('personObject2', personSchema2)
      .withId('person-456', '2.0')
      .forDomain({ id: 'banking', version: '1.0' })
      .withIsEntity(true)
      .buildDomainObject();

    const relatedObjs2 = relationsBuilder()
    .allowRelationFrom('belongsTo', accountObject2, personObject2, false)
    .buildRelatedObjects()

    

    // Build view with declarative structure using TypeScript-native array syntax
    const simpleViewContext = view('account-people-orders')
      .withVersion('1.0')
      .withRootKey('accountNumber')
      .withRootElement(relatedObjs2.accountObject2, true)  // Object notation with element name
          .withSubElement("person", relatedObjs2.personObject2, false)  // Object notation
            .withRelation('belongsTo')
            .end()
          .end()
      .endView()

    const a = personSchema2.properties

    expect(a.country?.defaultLabel).toBe("Country");
    expect(a.name?.defaultLabel).toBe("Name");  // Inherited property

    const accView = simpleViewContext.build();

    type CollectionViewType = typeof accView.dataType;

    const testData: CollectionViewType = [
      {
        accountNumber: "ACC-12345",
        creditLimit: 5000,
        person: {
          name: "John Doe",
          country: "USA"
        }
      }
    ];
    
    expect(testData[0].accountNumber).toBe("ACC-12345");
    expect(testData[0].creditLimit).toBe(5000);
    expect(testData[0]?.person?.name).toBe("John Doe");
    expect(testData[0]?.person?.country).toBe("USA");
  });

  it('should work with simpler structures', () => {
    const userSchema = schema('userSchema')
      .withId('user', '1.0')
      .withProperty('userId')
        .forType<string>()
        .withDictionaryId('dict-user-id', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('User ID')
        .endProperty()
      .withProperty('email')
        .forType<string>()
        .withDictionaryId('dict-email', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Email')
        .endProperty()
      .buildSchema();

    const postSchema = schema('postSchema')
      .withId('post', '1.0')
      .withProperty('postId')
        .forType<string>()
        .withDictionaryId('dict-post-id', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Post ID')
        .endProperty()
      .withProperty('title')
        .forType<string>()
        .withDictionaryId('dict-title', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Title')
        .endProperty()
      .buildSchema();

    const userObject = domainObject('userObject', userSchema)
      .withId('user-123', '1.0')
      .forDomain({ id: 'social', version: '1.0' })
      .withIsEntity(true)
      .buildDomainObject();
      
    const postObject = domainObject('postObject', postSchema)
      .withId('post-123', '1.0')
      .forDomain({ id: 'social', version: '1.0' })
      .withIsEntity(true)
      .buildDomainObject();

    const upviewBuilder = view('user-posts')
      .withVersion('1.0')
      .withConfigSet('main')
      .withRootKey('userId')
      .withRootElement(userObject, false)
      .withSubElement('posts', postObject, true)
        .end()  // end root element configuration
      .end()
      .endView()

    const upview = upviewBuilder.build();

    type DataType = typeof upview.dataType;

    const testData: DataType = {
      userId: "USER-123",
      email: "user@example.com",
      posts: [
        { postId: "POST-1", title: "First Post" },
        { postId: "POST-2", title: "Second Post" }
      ]
    };

    expect(testData.userId).toBe("USER-123");
    expect(testData.posts).toHaveLength(2);
  });

  it('should allow configuring sub-elements after definition', () => {
    const accountSchema = schema('accountSchema')
      .withId('account', '1.0')
      .withProperty('accountNumber')
        .forType<string>()
        .withDictionaryId('dict-account-number', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Account Number')
        .endProperty()
      .buildSchema();

    const orderSchema = schema('orderSchema')
      .withId('order', '1.0')
      .withProperty('orderId')
        .forType<string>()
        .withDictionaryId('dict-order-id', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Order ID')
        .endProperty()
      .buildSchema();

    const itemSchema = schema('itemSchema')
      .withId('item', '1.0')
      .withProperty('itemId')
        .forType<string>()
        .withDictionaryId('dict-item-id', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Item ID')
        .endProperty()
      .buildSchema();

    const productSchema = schema('productSchema')
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
      .forDomain({ id: 'sales', version: '1.0' })
      .withIsEntity(true)
      .buildDomainObject();

    const orderObject = domainObject('orderObject', orderSchema)
      .withId('order-123', '1.0')
      .forDomain({ id: 'sales', version: '1.0' })
      .withIsEntity(true)
      .buildDomainObject();

    const itemObject = domainObject('itemObject', itemSchema)
      .withId('item-123', '1.0')
      .forDomain({ id: 'sales', version: '1.0' })
      .withIsEntity(true)
      .buildDomainObject();

    const productObject = domainObject('productObject', productSchema)
      .withId('product-123', '1.0')
      .forDomain({ id: 'sales', version: '1.0' })
      .withIsEntity(true)
      .buildDomainObject();

    const relObjs = relationsBuilder()
    .allowRelationFrom('hasOrder', accountObject, orderObject, true)
    .allowRelationFrom('hasItem', orderObject, itemObject, true)
    .allowRelationFrom('orderedProduct', itemObject, productObject, false)
    .buildRelatedObjects();

    // Build view with structure, then configure sub-elements using nested builder pattern
    const aoView = view('account-orders')
      .withVersion('1.0')
      .withConfigSet('main')
      .withRootKey('accountNumber')
      .withRootElement(relObjs.accountObject, false)  // Using element name and queryObjectId
      // Now configure specific sub-elements using nested pattern
        .withSubElement('order', relObjs.orderObject, true)
          .withRelation('hasOrder')
          .withSubElement('item', relObjs.itemObject, true)
            .withRelation('hasItem')
              .withSubElement('product', relObjs.productObject, true)
              .withRelation('orderedProduct')
              .end()  // end product, back to item
            .end()  // end item, back to order
          .end()  // end order, back to root element
        .end()  // end root element, back to view builder
      .endView()
      .build();

    // Verify configuration was applied
    expect(aoView.rootElement.object).toBe('accountObject');
    expect(aoView.rootElement.queryObjectId).toBe('root');

    const order = aoView.rootElement.subElements![0] as any;
    expect(order.object).toBe('order');
    expect(order.queryObjectId).toBe('order');
    expect(order.relationFromParent).toBe('hasOrder');

    const item = order.subElements![0] as any;
    expect(item.object).toBe('item');
    expect(item.queryObjectId).toBe('item');
    expect(item.relationFromParent).toBe('hasItem');

    const product = item.subElements![0] as any;
    expect(product.object).toBe('product');
    expect(product.queryObjectId).toBe('product');
    expect(product.relationFromParent).toBe('orderedProduct');
  });
});
