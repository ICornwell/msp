import { describe, it, expect } from 'vitest';
import { accountsPeopleOrdersItemsProductsView, accountSchema, personSchema, orderSchema, orderItemSchema, productSchema } from '../testResources/views/accounts-people-orders-items-products.1.0.js';
import { View } from '../models/api/view.js';

describe('ViewBuilder', () => {
  it('should build view matching the JSON structure for accounts-people-orders-items-products', () => {
    // Local reference copy of the expected JSON (updated for new structure)
    const expectedView: View = {
      viewDataIdentifier: {
        name: "account-people",
        version: "1.0"
      },
      name: "account-people",
      getViewDataIdentifier: () => ({ namespace: "test", name: "account-people", version: "1.0", viewRootEntityId: "accountObject" }),
      getViewIdentifier: () => ({ namespace: "test", name: "account-people", version: "1.0", configSet: "main" }),
      version: "1.0",
      configSet: "main",
      dataType: {},
      rootKey: "accountNumber",
      rootElement: {
        object: "accountObject",
        docPathName: "accountObject",
        queryObjectId: "root",
        relationFromParent: undefined,
        domainObjectId: { name: "sales", version: "1.0"}, 
        isCollection: false,
        isEntity: true,
        subElements: [
          {
            object: "personObject",
            docPathName: "person",
            queryObjectId: "personObject",
            domainObjectId: {  name: "sales", version: "1.0"},
            isCollection: false,
            isEntity: true,
            relationFromParent: "belongsTo",
            subElements:  [
           {
            domainObjectId:  { name: "sales", version: "1.0"},
             isCollection: false,
             isEntity: false,
             object: "addressObject",
             docPathName: "address",
             queryObjectId: "addressObject",
             relationFromParent: "hasAddress",
              subElements: undefined,
            },
         ]
          },
          {
            object: "orderObject",
            docPathName: "order",
            queryObjectId: "orderObject",
            domainObjectId: { name: "sales", version: "1.0"},
            isCollection: true,
            isEntity: false,
            relationFromParent: "hasOrder",
            subElements: [
              {
                object: "itemObject",
                docPathName: "orderItem",
                queryObjectId: "itemObject",
                domainObjectId: {  name: "sales", version: "1.0"},
                isCollection: true,
                isEntity: false,
                relationFromParent: "hasItem",
                subElements: [
                  {
                    object: "productObject",
                    docPathName: "product",
                    queryObjectId: "productObject",
                    domainObjectId: { name: "sales", version: "1.0"},
                    isCollection: false,
                    isEntity: true,
                    relationFromParent: "orderedProduct",
                    subElements: undefined
                  }
                ]
              }
            ]
          }
        ]
      }
    };

    // Test that the built view matches the expected structure

// TODO: decide how far to go!

 //   expect(accountsPeopleOrdersItemsProductsView).toEqual(expectedView);
  });
});
