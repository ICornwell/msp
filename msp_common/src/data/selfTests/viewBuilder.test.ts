import { describe, it, expect } from 'vitest';
import { accountsPeopleOrdersItemsProductsView, accountSchema, personSchema, orderSchema, orderItemSchema, productSchema } from '../testResources/views/accounts-people-orders-items-products.1.0.js';
import { View } from '../models/api/view.js';

describe('ViewBuilder', () => {
  it('should build view matching the JSON structure for accounts-people-orders-items-products', () => {
    // Local reference copy of the expected JSON (updated for new structure)
    const expectedView: View = {
      name: "account-people",
      version: "1.0",
      configSet: "main",
      dataType: {},
      rootKey: "accountNumber",
      domain: undefined,
      product: undefined,
      rootElement: {
        object: "accountObject",
        queryObjectId: "root",
        relationFromParent: undefined,
        domainObjectId: accountSchema.vid,
        isCollection: false,
        isEntity: true,
        subElements: [
          {
            object: "person",
            queryObjectId: "person",
            domainObjectId: personSchema.vid,
            isCollection: false,
            isEntity: true,
            relationFromParent: "belongsTo",
            subElements:  [
           {
            domainObjectId: {
              id: "address-123",
               version: "1.0",
             },
             isCollection: false,
             isEntity: false,
             object: "address",
             queryObjectId: "address",
             relationFromParent: "hasAddress",
              subElements: undefined,
            },
         ]
          },
          {
            object: "order",
            queryObjectId: "order",
            domainObjectId: orderSchema.vid,
            isCollection: true,
            isEntity: false,
            relationFromParent: "hasOrder",
            subElements: [
              {
                object: "orderItem",
                queryObjectId: "orderItem",
                domainObjectId: orderItemSchema.vid,
                isCollection: true,
                isEntity: false,
                relationFromParent: "hasItem",
                subElements: [
                  {
                    object: "product",
                    queryObjectId: "product",
                    domainObjectId: productSchema.vid,
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
