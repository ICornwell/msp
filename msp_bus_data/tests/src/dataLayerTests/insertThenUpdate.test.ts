
import { createView } from 'msp_common';
import { testData, accountsPeopleOrdersItemsProductsView,
   AccountsPeopleOrdersItemsProductsData,
   simplePersonView,
   relObjs,
   } from '../../../../msp_common/dist/data/testResources/views/accounts-people-orders-items-products.1.0.js';
// import { view } from '@/fluent/viewBuilder.js';
import { WriteData, ReadData } from './integratedTestsSdk.js';
import { v7 as uuid } from 'uuid';

const sharedContactView = createView('account-people-shared-contact')
  .withVersion('1.0')
  .withConfigSet('main')
  .useBusinessKey()
  .withRootElement(relObjs.accountObject, false)
    .withNamedSubElement('contactTelephoneNumber', relObjs.contactTelephoneNumberObject, false)
      .withRelation('useContactNumber')
      .end()
    .withNamedSubElement('person', relObjs.personObject, false)
      .withRelation('belongsTo')
      .withNamedSubElement('contactTelephoneNumber', relObjs.contactTelephoneNumberObject, false)
        .withRelation('useContactNumber')
        .end()
      .withNamedSubElement('address', relObjs.addressObject, false)
        .withRelation('hasAddress')
        .withNamedSubElement('contactTelephoneNumber', relObjs.contactTelephoneNumberObject, false)
          .withRelation('useContactNumber')
          .end()
        .end()
      .end()
    .withNamedSubElement('order', relObjs.orderObject, true)
      .withRelation('hasOrder')
      .withNamedSubElement('contactTelephoneNumber', relObjs.contactTelephoneNumberObject, false)
        .withRelation('useContactNumber')
        .end()
      .withNamedSubElement('orderItem', relObjs.itemObject, true)
        .withRelation('hasItem')
        .withNamedSubElement('contactTelephoneNumber', relObjs.contactTelephoneNumberObject, false)
          .withRelation('useContactNumber')
          .end()
        .withNamedSubElement('product', relObjs.productObject, false)
          .withRelation('orderedProduct')
          .end()
        .end()
      .end()
    .end()
  .endView()
  .build();

function sharedContactData() {
  const sharedContact = {
    telephoneNumber: `+44-555-${uuid()}`,
  };

  return {
    accountNumber: `ACC-SHARED-CONTACT-${uuid()}`,
    contactTelephoneNumber: sharedContact,
    person: {
      name: 'Shared Contact Person',
      email: `shared.contact.${uuid()}@example.com`,
      contactTelephoneNumber: sharedContact,
      address: {
        street: '1 Shared Contact Street',
        postalCode: 'SC100',
        contactTelephoneNumber: sharedContact,
      },
    },
    order: [
      {
        orderId: `ORD-SHARED-${uuid()}`,
        contactTelephoneNumber: sharedContact,
        orderItem: [
          {
            itemId: `ITEM-SHARED-${uuid()}`,
            numberOfUnits: 1,
            contactTelephoneNumber: sharedContact,
            product: {
              productId: `PROD-SHARED-${uuid()}`,
              name: 'Shared Contact Product',
            },
          },
        ],
      },
    ],
  };
}

describe('Insert then update test', () => {
  const debugTimeOut: number = 600000
  it('should insert a new record and then update it successfully', async () => {
    const v = accountsPeopleOrdersItemsProductsView;
    console.log('Using view:', v.name, 'version:', v.version);
    const initialData = testData()
    const r1 = await WriteData(accountsPeopleOrdersItemsProductsView, initialData)
    const eid = r1.entityId
    const readBackData = await ReadData(accountsPeopleOrdersItemsProductsView, eid)

    // Step 2: Update the inserted record
    let orderItem = 
    readBackData?.order?.[0]?.orderItem?.[0]
    if (orderItem) {
      orderItem.numberOfUnits = 4; // Update the number of units
    }

    const r2 = await WriteData(accountsPeopleOrdersItemsProductsView, readBackData)
    const readBackData2 = await ReadData(accountsPeopleOrdersItemsProductsView, eid)
    expect(readBackData2?.order?.[0]?.orderItem?.[0]?.numberOfUnits).toBe(4);
  }, debugTimeOut)

  it('should insert a new record and then update root object successfully', async () => {
    const v = accountsPeopleOrdersItemsProductsView;
    console.log('Using view:', v.name, 'version:', v.version);

    const initialData = testData()
    const r1 = await WriteData(accountsPeopleOrdersItemsProductsView, initialData)
    const eid = r1.entityId
    const readBackData = await ReadData(accountsPeopleOrdersItemsProductsView, eid)

    // Step 2: Update the inserted record
    readBackData.accountNumber = "ACC-UPDATED"; // Update the root level property

    const r2 = await WriteData(accountsPeopleOrdersItemsProductsView, readBackData)
    const readBackData2 = await ReadData(accountsPeopleOrdersItemsProductsView, eid)
    expect(readBackData2?.accountNumber).toBe("ACC-UPDATED");
  }, debugTimeOut)

  it('should add order items to an existing order', async () => {
    const v = accountsPeopleOrdersItemsProductsView;
    console.log('Using view:', v.name, 'version:', v.version);

    // Step 1: Insert initial record
    const initialData = testData()
    const r1 = await WriteData(accountsPeopleOrdersItemsProductsView, initialData)
    const eid = r1.entityId
    const readBackData = await ReadData(accountsPeopleOrdersItemsProductsView, eid)

    // Step 2: Add new order items to the first order
    if (readBackData?.order?.[0]?.orderItem) {
      readBackData.order[0].orderItem.push({
        itemId: "ITEM-002",
        numberOfUnits: 3,
        product: {
          productId: "PROD-002",
          name: "Gadget"
        }
      });
      readBackData.order[0].orderItem.push({
        itemId: "ITEM-003",
        numberOfUnits: 1,
        product: {
          productId: "PROD-003",
          name: "Doohickey"
        }
      });
    }

    const r2 = await WriteData(accountsPeopleOrdersItemsProductsView, readBackData)
    const readBackData2 = await ReadData(accountsPeopleOrdersItemsProductsView, eid)

    expect(readBackData2?.order?.[0]?.orderItem?.length).toBe(3);
    expect(readBackData2?.order?.[0]?.orderItem?.[1]?.itemId).toBe("ITEM-002");
    expect(readBackData2?.order?.[0]?.orderItem?.[2]?.product?.name).toBe("Doohickey");
  }, debugTimeOut)

  it('should remove order items from an existing order', async () => {
    const v = accountsPeopleOrdersItemsProductsView;
    console.log('Using view:', v.name, 'version:', v.version);

    // Step 1: Insert initial record with multiple order items
    const initialData: AccountsPeopleOrdersItemsProductsData = {
      accountNumber: `ACC-99999-${uuid()}`,
      person: {
        name: "Jane Smith",
        address: {
          street: "456 Oak Ave",
          postalCode: "54321"
        }
      },
      order: [
        {
          orderId: "ORD-100",
          orderItem: [
            {
              itemId: "ITEM-A",
              numberOfUnits: 5,
              product: {
                productId: "PROD-A",
                name: "Product A"
              }
            },
            {
              itemId: "ITEM-B",
              numberOfUnits: 3,
              product: {
                productId: "PROD-B",
                name: "Product B"
              }
            },
            {
              itemId: "ITEM-C",
              numberOfUnits: 2,
              product: {
                productId: "PROD-C",
                name: "Product C"
              }
            }
          ]
        }
      ]
    };

    const r1 = await WriteData(accountsPeopleOrdersItemsProductsView, initialData)
    const eid = r1.entityId
    const readBackData = await ReadData(accountsPeopleOrdersItemsProductsView, eid)

    // Step 2: Remove the middle order item (ITEM-B)
    if (readBackData?.order?.[0]?.orderItem) {
      readBackData.order[0].orderItem.splice(1, 1); // Remove index 1 (ITEM-B)
    }

    const r2 = await WriteData(accountsPeopleOrdersItemsProductsView, readBackData)
    const readBackData2 = await ReadData(accountsPeopleOrdersItemsProductsView, eid)

    expect(readBackData2?.order?.[0]?.orderItem?.length).toBe(2);
    expect(readBackData2?.order?.[0]?.orderItem?.[0]?.itemId).toBe("ITEM-A");
    expect(readBackData2?.order?.[0]?.orderItem?.[1]?.itemId).toBe("ITEM-C");
    // Verify ITEM-B is gone
    const itemIds = readBackData2?.order?.[0]?.orderItem?.map((item: any) => item.itemId) || [];
    expect(itemIds).not.toContain("ITEM-B");
  }, debugTimeOut)

  it('should maintain old children with updated objects', async () => {
    const v = accountsPeopleOrdersItemsProductsView;
    console.log('Using view:', v.name, 'version:', v.version);

    // Step 1: Insert initial record
    const initialData = testData()
    const r1 = await WriteData(accountsPeopleOrdersItemsProductsView, initialData)
    const eid = r1.entityId
    const readBackData = await ReadData(accountsPeopleOrdersItemsProductsView, eid)

    // Step 2: Change multiple properties at different levels simultaneously
    if (readBackData) {
      // Change root level property
      //    readBackData.accountNumber = "ACC-UPDATED";

      // Change person properties
      if (readBackData.person) {
        readBackData.person.name = "Jane Updated";

      }


    }

    const r2 = await WriteData(accountsPeopleOrdersItemsProductsView, readBackData)
    const readBackData2 = await ReadData(accountsPeopleOrdersItemsProductsView, eid)

    // Verify all changes were applied

    expect(readBackData2?.person?.name).toBe("Jane Updated");
    expect(readBackData2?.person?.address?.street).toBe("123 Main St");

  }, debugTimeOut)

  it('should link updated children with updated objects', async () => {
    const v = accountsPeopleOrdersItemsProductsView;
    console.log('Using view:', v.name, 'version:', v.version);
    // Step 1: Insert initial record
    const initialData = testData()
    const r1 = await WriteData(accountsPeopleOrdersItemsProductsView, initialData)
    const eid = r1.entityId
    const readBackData = (await ReadData(accountsPeopleOrdersItemsProductsView, eid)) as AccountsPeopleOrdersItemsProductsData

    // Step 2: Change multiple properties at different levels simultaneously
    if (readBackData) {
      // Change root level property
      //    readBackData.accountNumber = "ACC-UPDATED";

      // Change person properties
      if (readBackData.person) {
        readBackData.person.name = "Jane Updated";
        const address = readBackData?.person?.address
        if (address) address.street = "44 new street";
      }


    }

    const r2 = await WriteData(accountsPeopleOrdersItemsProductsView, readBackData)
    const readBackData2 = await ReadData(accountsPeopleOrdersItemsProductsView, eid)

    // Verify all changes were applied

    expect(readBackData2?.person?.name).toBe("Jane Updated");
    expect(readBackData2?.person?.address?.street).toBe("44 new street");

  }, debugTimeOut)

  it('should change multiple properties simultaneously across different levels', async () => {
    const v = accountsPeopleOrdersItemsProductsView;
    console.log('Using view:', v.name, 'version:', v.version);

    // Step 1: Insert initial record
    const initialData = testData()
    const updatedAccountNumber = `ACC-UPDATE-TEST-${uuid()}`
    const r1 = await WriteData(accountsPeopleOrdersItemsProductsView, initialData)
    const eid = r1.entityId
    const readBackData = await ReadData(accountsPeopleOrdersItemsProductsView, eid)

    // Step 2: Change multiple properties at different levels simultaneously
    if (readBackData) {
      // Change root level property
      readBackData.accountNumber = updatedAccountNumber;

      // Change person properties
      if (readBackData.person) {
        readBackData.person.name = "Jane Updated";

        // Change nested address properties
        if (readBackData.person.address) {
          readBackData.person.address.street = "789 New St";
          readBackData.person.address.postalCode = "99999";
        }
      }

      // Change order and order item properties
      if (readBackData.order?.[0]) {
        readBackData.order[0].orderId = "ORD-UPDATED";

        if (readBackData.order[0].orderItem?.[0]) {
          readBackData.order[0].orderItem[0].numberOfUnits = 10;
          readBackData.order[0].orderItem[0].itemId = "ITEM-UPDATED";

          // Change product properties
          if (readBackData.order[0].orderItem[0].product) {
            readBackData.order[0].orderItem[0].product.name = "Updated Widget Pro";
            readBackData.order[0].orderItem[0].product.productId = "PROD-UPDATED";
          }
        }
      }
    }

    const r2 = await WriteData(accountsPeopleOrdersItemsProductsView, readBackData)
    const readBackData2 = await ReadData(accountsPeopleOrdersItemsProductsView, eid)

    // Verify all changes were applied
    expect(readBackData2?.accountNumber).toBe(updatedAccountNumber);
    expect(readBackData2?.person?.name).toBe("Jane Updated");
    expect(readBackData2?.person?.address?.street).toBe("789 New St");
    expect(readBackData2?.person?.address?.postalCode).toBe("99999");
    expect(readBackData2?.order?.[0]?.orderId).toBe("ORD-UPDATED");
    expect(readBackData2?.order?.[0]?.orderItem?.[0]?.itemId).toBe("ITEM-UPDATED");
    expect(readBackData2?.order?.[0]?.orderItem?.[0]?.numberOfUnits).toBe(10);
    expect(readBackData2?.order?.[0]?.orderItem?.[0]?.product?.productId).toBe("PROD-UPDATED");
    expect(readBackData2?.order?.[0]?.orderItem?.[0]?.product?.name).toBe("Updated Widget Pro");
  }, debugTimeOut)


  it('should remove  items', async () => {
    const v = accountsPeopleOrdersItemsProductsView;
    console.log('Using view:', v.name, 'version:', v.version);
    const intitalAccountNumber = `ACC-REMOVE-TEST-${uuid()}`
    // Step 1: Insert initial record with two order items
    const initialData: AccountsPeopleOrdersItemsProductsData = {
      accountNumber: intitalAccountNumber,
      person: {
        name: "Bob Johnson",
        address: {
          street: "321 Pine Rd",
          postalCode: "11111"
        }
      },
      order: [
        {
          orderId: "ORD-200",
          orderItem: [
            {
              itemId: "ITEM-OLD-1",
              numberOfUnits: 2,
              product: {
                productId: "PROD-OLD-1",
                name: "Old Product 1"
              }
            },
            {
              itemId: "ITEM-OLD-2",
              numberOfUnits: 4,
              product: {
                productId: "PROD-OLD-2",
                name: "Old Product 2"
              }
            },
            {
              itemId: "ITEM-OLD-3",
              numberOfUnits: 5,
              product: {
                productId: "PROD-OLD-3",
                name: "Old Product 3"
              }
            }
          ]
        }
      ]
    };

    const r1 = await WriteData(accountsPeopleOrdersItemsProductsView, initialData)
    const eid = r1.entityId
    const readBackData = await ReadData(accountsPeopleOrdersItemsProductsView, eid)

    // Step 2: Remove first item and add two new items
    if (readBackData?.order?.[0]?.orderItem) {
      // Remove first item (ITEM-OLD-1)
      readBackData.order[0].orderItem.shift();

    }

    const r2 = await WriteData(accountsPeopleOrdersItemsProductsView, readBackData)
    const readBackData2 = await ReadData(accountsPeopleOrdersItemsProductsView, eid)

    expect(readBackData2?.order?.[0]?.orderItem?.length).toBe(2);
    const itemIds = readBackData2?.order?.[0]?.orderItem?.map((item: any) => item.itemId) || [];
    expect(itemIds).toContain("ITEM-OLD-2");
    expect(itemIds).toContain("ITEM-OLD-3");
    expect(itemIds).not.toContain("ITEM-OLD-1");
  }, debugTimeOut)



  it('should add and remove order items in a single update', async () => {
    const v = accountsPeopleOrdersItemsProductsView;
    console.log('Using view:', v.name, 'version:', v.version);
    const intitalAccountNumber = `ACC-COMBO-TEST-${uuid()}`
    // Step 1: Insert initial record with two order items
    const initialData: AccountsPeopleOrdersItemsProductsData = {
      accountNumber: intitalAccountNumber,
      person: {
        name: "Bob Johnson",
        address: {
          street: "321 Pine Rd",
          postalCode: "11111"
        }
      },
      order: [
        {
          orderId: "ORD-200",
          orderItem: [
            {
              itemId: "ITEM-OLD-1",
              numberOfUnits: 2,
              product: {
                productId: "PROD-OLD-1",
                name: "Old Product 1"
              }
            },
            {
              itemId: "ITEM-OLD-2",
              numberOfUnits: 4,
              product: {
                productId: "PROD-OLD-2",
                name: "Old Product 2"
              }
            }
          ]
        }
      ]
    };

    const r1 = await WriteData(accountsPeopleOrdersItemsProductsView, initialData)
    const eid = r1.entityId
    const readBackData = await ReadData(accountsPeopleOrdersItemsProductsView, eid)

    // Step 2: Remove first item and add two new items
    if (readBackData?.order?.[0]?.orderItem) {
      // Remove first item (ITEM-OLD-1)
      readBackData.order[0].orderItem.shift();

      // Add two new items
      readBackData.order[0].orderItem.push({
        itemId: "ITEM-NEW-1",
        numberOfUnits: 6,
        product: {
          productId: "PROD-NEW-1",
          name: "New Product 1"
        }
      });
      readBackData.order[0].orderItem.push({
        itemId: "ITEM-NEW-2",
        numberOfUnits: 8,
        product: {
          productId: "PROD-NEW-2",
          name: "New Product 2"
        }
      });
    }

    const r2 = await WriteData(accountsPeopleOrdersItemsProductsView, readBackData)
    const readBackData2 = await ReadData(accountsPeopleOrdersItemsProductsView, eid)

    expect(readBackData2?.order?.[0]?.orderItem?.length).toBe(3);
    const itemIds = readBackData2?.order?.[0]?.orderItem?.map((item: any) => item.itemId) || [];
    expect(itemIds).toContain("ITEM-OLD-2");
    expect(itemIds).toContain("ITEM-NEW-1");
    expect(itemIds).toContain("ITEM-NEW-2");
    expect(itemIds).not.toContain("ITEM-OLD-1");
  }, debugTimeOut)


  it('should delink, not delete Entities', async () => {
    const v = accountsPeopleOrdersItemsProductsView;
    console.log('Using view:', v.name, 'version:', v.version);
    const intitalAccountNumber = `ACC-DELINK-TEST-${uuid()}`
    const intitalpersonEmail = `bob.johnson-${uuid()}@example.com`
    // Step 1: Insert initial record with two order items
    const initialData: AccountsPeopleOrdersItemsProductsData = {
      accountNumber: intitalAccountNumber,
      person: {
        name: "Bob Johnson",
        email: intitalpersonEmail,
        address: {
          street: "321 Pine Rd",
          postalCode: "11111"
        }
      },
      order: [
        {
          orderId: "ORD-200",
          orderItem: [
            {
              itemId: "ITEM-OLD-1",
              numberOfUnits: 2,
              product: {
                productId: "PROD-OLD-1",
                name: "Old Product 1"
              }
            },
            {
              itemId: "ITEM-OLD-2",
              numberOfUnits: 4,
              product: {
                productId: "PROD-OLD-2",
                name: "Old Product 2"
              }
            },
            {
              itemId: "ITEM-OLD-3",
              numberOfUnits: 5,
              product: {
                productId: "PROD-OLD-3",
                name: "Old Product 3"
              }
            }
          ]
        }
      ]
    };

    const r1 = await WriteData(accountsPeopleOrdersItemsProductsView, initialData)
    const eid = r1.entityId
    const readBackData = await ReadData(accountsPeopleOrdersItemsProductsView, eid)
    const personEId = readBackData?.person?.__entityId

    const readBackDataPerson = await ReadData(simplePersonView, personEId)

    expect(readBackDataPerson?.name).toBe("Bob Johnson");
    // Step 2: Remove first item and add two new items
    if (readBackData?.person) {
      // Remove first item (ITEM-OLD-1)
      delete readBackData.person;

    }

    const r2 = await WriteData(accountsPeopleOrdersItemsProductsView, readBackData)
    const readBackData2 = await ReadData(accountsPeopleOrdersItemsProductsView, eid)

    expect(readBackData2?.person).toBeUndefined();
    
    const readBackData3 = await ReadData(simplePersonView, personEId)

    expect(readBackData3?.name).toBe("Bob Johnson");

  }, debugTimeOut)

  it('should delink value objects when relation is marked for delink on removal', async () => {
    const initialData: AccountsPeopleOrdersItemsProductsData = {
      accountNumber: `ACC-DELINK-VO-${uuid()}`,
      person: {
        name: 'Value Delink',
        address: {
          street: '1 Delink Way',
          postalCode: '10001'
        }
      },
      order: [
        {
          orderId: `ORD-DELINK-${uuid()}`,
          orderItem: [
            {
              itemId: `ITEM-DELINK-${uuid()}`,
              numberOfUnits: 2,
              product: {
                productId: `PROD-DELINK-${uuid()}`,
                name: 'Delink Product'
              }
            }
          ]
        }
      ]
    };

    const r1 = await WriteData(accountsPeopleOrdersItemsProductsView, initialData)
    const accountEntityId = r1.entityId
    const readBackData = await ReadData(accountsPeopleOrdersItemsProductsView, accountEntityId)

    const removedOrderItemId = readBackData?.order?.[0]?.orderItem?.[0]?.id
    expect(removedOrderItemId).toBeDefined()

    readBackData.order[0].orderItem = []
    const removalResult = await WriteData(accountsPeopleOrdersItemsProductsView, readBackData)

    const accountAfterRemoval = await ReadData(accountsPeopleOrdersItemsProductsView, accountEntityId)
    expect(accountAfterRemoval?.order?.[0]?.orderItem?.length ?? 0).toBe(0)

    const deletedVertices = removalResult?.request?.delete?.vertices ?? []
    const wasDeleted = deletedVertices.some((v: any) => v?.__previousId === removedOrderItemId || v?.__originalId === removedOrderItemId)
    expect(wasDeleted).toBe(false)

    const updateVertices = removalResult?.request?.update?.vertices ?? []
    const hasDelinkedEdge = updateVertices.some((v: any) => Array.isArray(v?.__viewManagedEdges) && v.__viewManagedEdges.length > 0)
    expect(hasDelinkedEdge).toBe(true)
  }, debugTimeOut)

  it('should soft-delete value objects when relation is not marked for delink on removal', async () => {
    const initialData: AccountsPeopleOrdersItemsProductsData = {
      accountNumber: `ACC-SOFTDEL-VO-${uuid()}`,
      person: {
        name: 'Value Delete',
        address: {
          street: '2 Delete Way',
          postalCode: '20002'
        }
      },
      order: [
        {
          orderId: `ORD-DEL-${uuid()}`,
          orderItem: [
            {
              itemId: `ITEM-DEL-${uuid()}`,
              numberOfUnits: 1,
              product: {
                productId: `PROD-DEL-${uuid()}`,
                name: 'Delete Product'
              }
            }
          ]
        }
      ]
    };

    const r1 = await WriteData(accountsPeopleOrdersItemsProductsView, initialData)
    const accountEntityId = r1.entityId
    const readBackData = await ReadData(accountsPeopleOrdersItemsProductsView, accountEntityId)

    const addressVertexId = readBackData?.person?.address?.id
    expect(addressVertexId).toBeDefined()

    delete readBackData.person.address
    const removalResult = await WriteData(accountsPeopleOrdersItemsProductsView, readBackData)

    const accountAfterRemoval = await ReadData(accountsPeopleOrdersItemsProductsView, accountEntityId)
    expect(accountAfterRemoval?.person?.address).toBeUndefined()

    const deletedVertices = removalResult?.request?.delete?.vertices ?? []
    const wasSoftDeleted = deletedVertices.some((v: any) => v?.__previousId === addressVertexId || v?.__originalId === addressVertexId)
    expect(wasSoftDeleted).toBe(true)

    const updateVertices = removalResult?.request?.update?.vertices ?? []
    const hasDelinkedEdge = updateVertices.some((v: any) => Array.isArray(v?.__viewManagedEdges) && v.__viewManagedEdges.length > 0)
    expect(hasDelinkedEdge).toBe(true)
  }, debugTimeOut)

  it('should create one shared contactTelephoneNumber vertex with inbound links from multiple parents', async () => {
    const initialData = sharedContactData();

    const insertResult = await WriteData(sharedContactView as any, initialData);
    const addedVertices = insertResult?.request?.add?.vertices ?? [];
    const addedEdges = insertResult?.request?.add?.edges ?? [];

    const contactVertices = addedVertices.filter((v: any) => v?.__label === 'contactTelephoneNumberObject');
    expect(contactVertices.length).toBe(1);

    const sharedContactTmpId = contactVertices[0]?.__tmpId;
    expect(sharedContactTmpId).toBeDefined();

    const inboundUseContactEdges = addedEdges.filter(
      (e: any) => e?.__label === 'useContactNumber' && e?.to === sharedContactTmpId
    );

    expect(inboundUseContactEdges.length).toBeGreaterThanOrEqual(5);
  }, debugTimeOut)

  it('should delink shared contactTelephoneNumber until person removal soft-deletes it everywhere', async () => {
    const initialData = sharedContactData();
    const insertResult = await WriteData(sharedContactView as any, initialData);
    const accountEntityId = insertResult.entityId;

    const readBackData = await ReadData(sharedContactView as any, accountEntityId);
    expect(readBackData?.contactTelephoneNumber?.telephoneNumber).toBeDefined();
    expect(readBackData?.person?.contactTelephoneNumber?.telephoneNumber).toBeDefined();
    expect(readBackData?.person?.address?.contactTelephoneNumber?.telephoneNumber).toBeDefined();
    expect(readBackData?.order?.[0]?.contactTelephoneNumber?.telephoneNumber).toBeDefined();
    expect(readBackData?.order?.[0]?.orderItem?.[0]?.contactTelephoneNumber?.telephoneNumber).toBeDefined();

    // These relations are configured with delinkOnRemoval=true.
    delete readBackData.order?.[0]?.contactTelephoneNumber;
    if (readBackData?.order?.[0]?.orderItem?.[0]) {
      delete readBackData.order[0].orderItem[0].contactTelephoneNumber;
    }

    const delinkResult = await WriteData(accountsPeopleOrdersItemsProductsView, readBackData);
    const delinkDeleteVertices = delinkResult?.request?.delete?.vertices ?? [];
    const delinkDeletedContact = delinkDeleteVertices.some((v: any) => v?.__label === 'contactTelephoneNumberObject');
    expect(delinkDeletedContact).toBe(false);

    const afterDelink = await ReadData(sharedContactView as any, accountEntityId);
    expect(afterDelink?.contactTelephoneNumber?.telephoneNumber).toBeDefined();
    expect(afterDelink?.person?.contactTelephoneNumber?.telephoneNumber).toBeDefined();
    expect(afterDelink?.person?.address?.contactTelephoneNumber?.telephoneNumber).toBeDefined();

    // person->contact is configured with delinkOnRemoval=false, so this should soft-delete.
    delete afterDelink.person.contactTelephoneNumber;
    const softDeleteResult = await WriteData(sharedContactView as any, afterDelink);
    const softDeleteVertices = softDeleteResult?.request?.delete?.vertices ?? [];
    const softDeletedContact = softDeleteVertices.some((v: any) => v?.__label === 'contactTelephoneNumberObject');
    expect(softDeletedContact).toBe(true);

    const afterSoftDelete = await ReadData(sharedContactView as any, accountEntityId);
    expect(afterSoftDelete?.contactTelephoneNumber).toBeUndefined();
    expect(afterSoftDelete?.person?.contactTelephoneNumber).toBeUndefined();
    expect(afterSoftDelete?.person?.address?.contactTelephoneNumber).toBeUndefined();
    expect(afterSoftDelete?.order?.[0]?.contactTelephoneNumber).toBeUndefined();
    expect(afterSoftDelete?.order?.[0]?.orderItem?.[0]?.contactTelephoneNumber).toBeUndefined();
  }, debugTimeOut)

})