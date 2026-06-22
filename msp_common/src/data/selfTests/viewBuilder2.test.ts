import { describe, it, expect } from 'vitest';

import { createView } from '../fluent/viewBuilder.js';
import { createSchema } from '../fluent/schemaBuilder.js';

import { createValueObject, createEntityObject } from '../fluent/objectBuilder.js';
import { createRelations } from '../fluent/objectRelationsBuilder.js';

describe('Declarative View Builder', () => {

    const accountSchema = createSchema('account')
    .withFQId({ namespace: 'test', version: '1.0'})
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

  const personSchema = createSchema('person')
    .withFQId({ namespace: 'test', version: '1.0'})
    .withProperty('name').withDictionaryId('dict-account-number', '1.0')
      .forType<string>()
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

  const orderItemSchema = createSchema('orderItem')
    .withFQId({ namespace: 'test', version: '1.0'})
    .withProperty('itemId')
      .forType<string>()
      .withDictionaryId('dict-item-id', '1.0')
      .withInfoType('Text')
      .withDefaultLabel('Item ID')
      .endProperty()
    .buildSchema();

  const productSchema = createSchema('product')
    .withFQId({ namespace: 'test', version: '1.0'})
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
    .withFQId({ namespace: 'test', version: '1.0'})
    .forDomain({ name: 'banking', version: '1.0' })
  
    .buildObject();

  const personObject = createEntityObject('personObject', personSchema)
    .withFQId({ namespace: 'test', version: '1.0'})
    .forDomain({ name: 'banking', version: '1.0' })
  
    .buildObject();

  const orderObject = createEntityObject('orderObject', orderSchema)
    .withFQId({ namespace: 'test', version: '1.0'})
    .forDomain({ name: 'banking', version: '1.0' })
  
    .buildObject();

  const orderItemObject = createEntityObject('orderItemObject', orderItemSchema)
    .withFQId({ namespace: 'test', version: '1.0'})
    .forDomain({ name: 'banking', version: '1.0' })

    .buildObject();

  const productObject = createEntityObject('productObject', productSchema)
    .withFQId({ namespace: 'test', version: '1.0'})
    .forDomain({ name: 'banking', version: '1.0' })

    .buildObject();

  const relatedObjs = createRelations()
    .allowRelationFromTo('belongsTo', accountObject, personObject, false)
    .allowRelationFromTo('accountOwner', personObject, accountObject, false)
    .allowRelationFromTo('hasOrder', accountObject, orderObject, true)
    .allowRelationFromTo('withItem', orderObject, orderItemObject, true)
    .allowRelationFromTo('forProduct', orderItemObject, productObject, false)
    .allowRelationFromTo('fromSellingPerson', orderItemObject, personObject, false)
    .buildRelatedObjects();


  it('should build view with declarative structure and infer correct types', () => {
    // Define schemas


    // Build view with declarative structure using TypeScript-native array syntax
    const simpleViewContext = createView('account-people-orders')
      .withVersion('1.0')
      .withRootKey('accountNumber')
      .withRootElement(relatedObjs.accountObject, false)  // Object notation with element name
        .withNamedSubElement("person", relatedObjs.personObject, false)  // Object notation
          .withRelation('belongsTo')
          .end()
        .withNamedSubElement("order", relatedObjs.orderObject, true)  // Object notation
          .withRelation('hasOrder')
          .withNamedSubElement("orderItem", relatedObjs.orderItemObject, true)  // Object notation
            .withRelation('withItem')
              .withNamedSubElement("product", relatedObjs.productObject, false)  // Object notation
                .withRelation('forProduct')
                .end()
            .end()
          .end()
        .end()
    .endView()

    const accView = simpleViewContext.build();


    // Extract the data type
   // type SimpleViewData = typeof simpleViewContext.data;

    // Test runtime structure
    expect(accView.name).toBe('account-people-orders');

    expect(accView.rootElement.object).toBe('accountObject');
    expect(accView.rootElement.isCollection).toBe(false);
    expect(accView.rootElement.subElements).toHaveLength(2);

    // person is a single element
    const person = accView.rootElement.subElements![0] as any;
    expect(person.object).toBe('personObject');
    expect(person.isCollection).toBe(false);

    // order is a collection
    const order = accView.rootElement.subElements![1] as any;
    expect(order.object).toBe('orderObject');
    expect(order.isCollection).toBe(true);
    expect(order.subElements).toHaveLength(1);

    // orderItem is a collection nested in order
    const orderItem = order.subElements![0] as any;
    expect(orderItem.object).toBe('orderItemObject');
    expect(orderItem.isCollection).toBe(true);
    expect(orderItem.subElements).toHaveLength(1);

    // product is a single element nested in orderItem
    const product = orderItem.subElements![0] as any;
    expect(product.object).toBe('productObject');
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
    const simpleViewContext = createView('account-people-orders')
      .withVersion('1.0')
      .withRootKey('accountNumber')
      .withRootElement(relatedObjs.accountObject, true)  // Object notation with element name
       
          .withNamedSubElement("person", relatedObjs.personObject, false)  // Object notation
            .withRelation('belongsTo')
            .end()
          .withNamedSubElement("order", relatedObjs.orderObject, true)  // Object notation
            .withRelation('hasOrder')
            .withNamedSubElement("orderItem", relatedObjs.orderItemObject, true)  // Object notation
              .withRelation('withItem')
               .withNamedSubElement("product", relatedObjs.productObject, false)  // Object notation
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
    const simpleViewContext = createView('account-people-orders')
      .withVersion('1.0')
      .withRootKey('accountNumber')
      .withRootElement(relatedObjs.accountObject, true)  // Object notation with element name
          .withNamedSubElement("person", relatedObjs.personObject, false)  // Object notation
            .withRelation('belongsTo')
            .end()
          .withNamedSubElement("order", relatedObjs.orderObject, true)  // Object notation
            .withRelation('hasOrder')
            .withNamedSubElement("orderItem", relatedObjs.orderItemObject, true)  // Object notation
              .withRelation('withItem')
               .withNamedSubElement("person", relatedObjs.personObject, false)  // Object notation
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

    expect(accView.rootElement.subElements![0].queryObjectId).toBe('personObject')
    expect(accView.rootElement.subElements![1].subElements![0].subElements![0].queryObjectId).toBe('personObject_2');
  });

   it('should  allow schema inheritance', () => {
    // Define schemas
      const accountSchema2 = createSchema('account2')
        .inheritsFrom(accountSchema)
        .withFQId({ namespace: 'test', version: '2.0'})
          .withProperty('creditLimit')
          .forType<number>()
          .withDictionaryId('dict-credit-limit', '1.0')
          .withInfoType('Money')
          .withDefaultLabel('Credit Limit')
          .endProperty()
        .buildSchema();

      const personSchema2 = createSchema('person')
        .withFQId({ namespace: 'test', version: '2.0'})
        .inheritsFrom(personSchema)
        .withProperty('country').withDictionaryId('dict-country', '1.0')
          .forType<string>()
          .withInfoType('Text')
          .withDefaultLabel('Country')
          .endProperty()
        .buildSchema();

     const accountObject2 = createEntityObject('accountObject2', accountSchema2)
      .withFQId({ namespace: 'test', version: '2.0'})
      .forDomain({ name: 'banking', version: '1.0' })
      .buildObject();
      
    const personObject2 = createEntityObject('personObject2', personSchema2)
      .withFQId({ namespace: 'test', version: '2.0'})
      .forDomain({ name: 'banking', version: '1.0' })
      .buildObject();

    const relatedObjs2 = createRelations()
    .allowRelationFromTo('belongsTo', accountObject2, personObject2, false)
    .buildRelatedObjects()

    

    // Build view with declarative structure using TypeScript-native array syntax
    const simpleViewContext = createView('account-people-orders')
      .withVersion('1.0')
      .withRootKey('accountNumber')
      .withRootElement(relatedObjs2.accountObject2, true)  // Object notation with element name
          .withNamedSubElement("person", relatedObjs2.personObject2, false)  // Object notation
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
    const userSchema = createSchema('userSchema')
      .withFQId({ namespace: 'test', version: '1.0'})
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

    const postSchema = createSchema('postSchema')
      .withFQId({ namespace: 'test', version: '1.0'})
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

    const userObject = createEntityObject('userObject', userSchema)
      .withFQId({ namespace: 'test', version: '1.0'})
      .forDomain({ name: 'social', version: '1.0' })
      .buildObject();
      
    const postObject = createEntityObject('postObject', postSchema)
      .withFQId({ namespace: 'test', version: '1.0'})
      .forDomain({ name: 'social', version: '1.0' })
      .buildObject();

    const upviewBuilder = createView('user-posts')
      .withVersion('1.0')
      .withConfigSet('main')
      .withRootKey('userId')
      .withRootElement(userObject, false)
      .withNamedSubElement('posts', postObject, true)
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
    const accountSchema = createSchema('accountSchema')
      .withFQId({ namespace: 'test', version: '1.0'})
      .withProperty('accountNumber')
        .forType<string>()
        .withDictionaryId('dict-account-number', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Account Number')
        .endProperty()
      .buildSchema();

    const orderSchema = createSchema('orderSchema')
      .withFQId({ namespace: 'test', version: '1.0'})
      .withProperty('orderId')
        .forType<string>()
        .withDictionaryId('dict-order-id', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Order ID')
        .endProperty()
      .buildSchema();

    const itemSchema = createSchema('itemSchema')
      .withFQId({ namespace: 'test', version: '1.0'})
      .withProperty('itemId')
        .forType<string>()
        .withDictionaryId('dict-item-id', '1.0')
        .withInfoType('Text')
        .withDefaultLabel('Item ID')
        .endProperty()
      .buildSchema();

    const productSchema = createSchema('productSchema')
      .withFQId({ namespace: 'test', version: '1.0'})
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
      .withFQId({ namespace: 'test', version: '1.0'})
      .forDomain({ name: 'sales', version: '1.0' })
      .buildObject();

    const orderObject = createEntityObject('orderObject', orderSchema)
      .withFQId({ namespace: 'test', version: '1.0'})
      .forDomain({ name: 'sales', version: '1.0' })
      .buildObject();

    const itemObject = createEntityObject('itemObject', itemSchema)
      .withFQId({ namespace: 'test', version: '1.0'})
      .forDomain({ name: 'sales', version: '1.0' })
      .buildObject();

    const productObject = createEntityObject('productObject', productSchema)
      .withFQId({ namespace: 'test', version: '1.0'})
      .forDomain({ name: 'sales', version: '1.0' })
      .buildObject();

    const relObjs = createRelations()
    .allowRelationFromTo('hasOrder', accountObject, orderObject, true)
    .allowRelationFromTo('hasItem', orderObject, itemObject, true)
    .allowRelationFromTo('orderedProduct', itemObject, productObject, false)
    .buildRelatedObjects();

    // Build view with structure, then configure sub-elements using nested builder pattern
    const aoView = createView('account-orders')
      .withVersion('1.0')
      .withConfigSet('main')
      .withRootKey('accountNumber')
      .withRootElement(relObjs.accountObject, false)  // Using element name and queryObjectId
      // Now configure specific sub-elements using nested pattern
        .withSubElement(relObjs.orderObject, true)
          .withRelation('hasOrder')
          .withSubElement(relObjs.itemObject, true)
            .withRelation('hasItem')
              .withSubElement(relObjs.productObject, true)
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
    expect(order.object).toBe('orderObject');
    expect(order.queryObjectId).toBe('orderObject');
    expect(order.relationFromParent).toBe('hasOrder');

    const item = order.subElements![0] as any;
    expect(item.object).toBe('itemObject');
    expect(item.queryObjectId).toBe('itemObject');
    expect(item.relationFromParent).toBe('hasItem');

    const product = item.subElements![0] as any;
    expect(product.object).toBe('productObject');
    expect(product.queryObjectId).toBe('productObject');
    expect(product.relationFromParent).toBe('orderedProduct');
  });
});
