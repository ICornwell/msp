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
      version: "1.0",
      configSet: "main",
      dataType: {},
      rootKey: "accountNumber",
      rootElement: {
        object: "accountObject",
        docPathName: "accountObject",
        queryObjectId: "root",
        relationFromParent: undefined,
        domainObjectId: { domain: { name: "sales", version: "1.0"}, ...accountSchema.vid},
        isCollection: false,
        isEntity: true,
        subElements: [
          {
            object: "personObject",
            docPathName: "person",
            queryObjectId: "personObject",
            domainObjectId: { domain: { name: "sales", version: "1.0"}, ...personSchema.vid},
            isCollection: false,
            isEntity: true,
            relationFromParent: "belongsTo",
            subElements:  [
           {
            domainObjectId: {
              domain: { name: "sales", version: "1.0"},
              name: "address-123",
               version: "1.0",
             },
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
            domainObjectId: { domain: { name: "sales", version: "1.0"}, ...orderSchema.vid},
            isCollection: true,
            isEntity: false,
            relationFromParent: "hasOrder",
            subElements: [
              {
                object: "itemObject",
                docPathName: "orderItem",
                queryObjectId: "itemObject",
                domainObjectId: { domain: { name: "sales", version: "1.0"}, ...orderItemSchema.vid},
                isCollection: true,
                isEntity: false,
                relationFromParent: "hasItem",
                subElements: [
                  {
                    object: "productObject",
                    docPathName: "product",
                    queryObjectId: "productObject",
                    domainObjectId: { domain: { name: "sales", version: "1.0"}, ...productSchema.vid},
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
    expect(accountsPeopleOrdersItemsProductsView).toEqual(expectedView);
  });
});
