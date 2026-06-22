import {
  testData,
  accountsPeopleOrdersItemsProductsView,
  AccountsPeopleOrdersItemsProductsData,
} from '../../../../msp_common/dist/data/testResources/views/accounts-people-orders-items-products.1.0.js';
import { WriteData, ReadData, BeginTransaction, CommitTransaction, RollbackTransaction } from './integratedTestsSdk.js';
import { v7 as uuid } from 'uuid';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function threeItemOrderData(): AccountsPeopleOrdersItemsProductsData {
  return {
    accountNumber: `ACC-TXN-${uuid()}`,
    person: {
      name: "Jane Smith",
      address: { street: "456 Oak Ave", postalCode: "54321" }
    },
    order: [{
      orderId: "ORD-100",
      orderItem: [
        { itemId: "ITEM-A", numberOfUnits: 5, product: { productId: "PROD-A", name: "Product A" } },
        { itemId: "ITEM-B", numberOfUnits: 3, product: { productId: "PROD-B", name: "Product B" } },
        { itemId: "ITEM-C", numberOfUnits: 2, product: { productId: "PROD-C", name: "Product C" } },
      ]
    }]
  };
}

const debugTimeOut = 600000;
const view = accountsPeopleOrdersItemsProductsView;

// ---------------------------------------------------------------------------
// Suite 1 - all writes inside a transaction that is COMMITTED
// ---------------------------------------------------------------------------

describe('Insert then update - transactions commit', () => {

  it('should insert a new record and update it - commit', async () => {
    const txn = await BeginTransaction();
    const initialData = testData();

    const r1 = await WriteData(view, initialData, txn.token);
    const eid = r1.entityId;

    let readBack = await ReadData(view, eid, false, txn.token);
    if (readBack?.order?.[0]?.orderItem?.[0]) {
      readBack.order[0].orderItem[0].numberOfUnits = 7;
    }

    await WriteData(view, readBack, txn.token);

    const before_commit_unc = await ReadData(view, eid, false, txn.token);
    const before_commit_c = await ReadData(view, eid);
    
    const before_commit_unc_units = before_commit_unc?.order?.[0]?.orderItem?.[0]?.numberOfUnits;
    const before_commit_c_units = before_commit_c?.order?.[0]?.orderItem?.[0]?.numberOfUnits;
    
    expect(before_commit_unc_units).toBe(7); // Uncommitted change should not be visible in read-uncommitted view
    expect(before_commit_c_units).toBeUndefined();

    await CommitTransaction(txn.token);

    const final = await ReadData(view, eid);

    
    expect(final?.order?.[0]?.orderItem?.[0]?.numberOfUnits).toBe(7);
  }, debugTimeOut);

  it('should add order items - commit', async () => {
    const txn = await BeginTransaction();
    const initialData = testData();

    const r1 = await WriteData(view, initialData, txn.token);
    const eid = r1.entityId;

    let readBack = await ReadData(view, eid, false, txn.token);
    readBack.order[0].orderItem.push(
      { itemId: "ITEM-X", numberOfUnits: 9, product: { productId: "PROD-X", name: "Extra" } }
    );

    await WriteData(view, readBack, txn.token);
    await CommitTransaction(txn.token);

    const final = await ReadData(view, eid);
    expect(final?.order?.[0]?.orderItem?.length).toBe(2);
    expect(final?.order?.[0]?.orderItem?.[1]?.itemId).toBe("ITEM-X");
  }, debugTimeOut);

  it('should add and remove order items in a single update - committed/uncommitted checks', async () => {
    // ── Phase 1: insert baseline (2 items) outside any transaction ────────
    const initialData: AccountsPeopleOrdersItemsProductsData = {
      accountNumber: `ACC-COMBO-TXN-${uuid()}`,
      person: { name: "Bob Johnson", address: { street: "321 Pine Rd", postalCode: "11111" } },
      order: [{
        orderId: "ORD-200",
        orderItem: [
          { itemId: "ITEM-OLD-1", numberOfUnits: 2, product: { productId: "PROD-OLD-1", name: "Old Product 1" } },
          { itemId: "ITEM-OLD-2", numberOfUnits: 4, product: { productId: "PROD-OLD-2", name: "Old Product 2" } },
        ]
      }]
    };
    const r1 = await WriteData(view, initialData);
    const eid = r1.entityId;

    const baseline = await ReadData(view, eid);
    expect(baseline?.order?.[0]?.orderItem?.length).toBe(2);

    // ── Phase 2: begin transaction, remove ITEM-OLD-1, add ITEM-NEW-1 and ITEM-NEW-2 ──
    const txn = await BeginTransaction();

    let readBack = await ReadData(view, eid, false, txn.token);
    readBack.order[0].orderItem.shift(); // remove ITEM-OLD-1
    readBack.order[0].orderItem.push(
      { itemId: "ITEM-NEW-1", numberOfUnits: 6, product: { productId: "PROD-NEW-1", name: "New Product 1" } },
      { itemId: "ITEM-NEW-2", numberOfUnits: 8, product: { productId: "PROD-NEW-2", name: "New Product 2" } },
    );
    await WriteData(view, readBack, txn.token);

    // ── Phase 3: read WITHOUT token - original 2 items still visible ─────
    const outsideView = await ReadData(view, eid);
    expect(outsideView?.order?.[0]?.orderItem?.length).toBe(2);
    const outsideIds: string[] = outsideView?.order?.[0]?.orderItem?.map((i: any) => i.itemId) ?? [];
    expect(outsideIds).toContain("ITEM-OLD-1");
    expect(outsideIds).toContain("ITEM-OLD-2");
    expect(outsideIds).not.toContain("ITEM-NEW-1");

    // ── Phase 4: read WITH token - new 3 items visible, OLD-1 gone ───────
    const insideView = await ReadData(view, eid, false, txn.token);
    expect(insideView?.order?.[0]?.orderItem?.length).toBe(3);
    const insideIds: string[] = insideView?.order?.[0]?.orderItem?.map((i: any) => i.itemId) ?? [];
    expect(insideIds).toContain("ITEM-OLD-2");
    expect(insideIds).toContain("ITEM-NEW-1");
    expect(insideIds).toContain("ITEM-NEW-2");
    expect(insideIds).not.toContain("ITEM-OLD-1");

    // ── Phase 5: commit ───────────────────────────────────────────────────
    await CommitTransaction(txn.token);

    // ── Phase 6: after commit both read paths reflect the new state ───────
    const afterCommit = await ReadData(view, eid);
    expect(afterCommit?.order?.[0]?.orderItem?.length).toBe(3);
    const afterCommitIds: string[] = afterCommit?.order?.[0]?.orderItem?.map((i: any) => i.itemId) ?? [];
    expect(afterCommitIds).toContain("ITEM-OLD-2");
    expect(afterCommitIds).toContain("ITEM-NEW-1");
    expect(afterCommitIds).toContain("ITEM-NEW-2");
    expect(afterCommitIds).not.toContain("ITEM-OLD-1");

    const afterCommitWithToken = await ReadData(view, eid, false, txn.token);
    expect(afterCommitWithToken?.order?.[0]?.orderItem?.length).toBe(3);
    const afterCommitTokenIds: string[] = afterCommitWithToken?.order?.[0]?.orderItem?.map((i: any) => i.itemId) ?? [];
    expect(afterCommitTokenIds).not.toContain("ITEM-OLD-1");
  }, debugTimeOut);

  it('should remove order items from an existing order - committed/uncommitted checks', async () => {
    // ── Phase 1: insert baseline data outside any transaction ──────────────
    const initialData = threeItemOrderData();
    const r1 = await WriteData(view, initialData);
    const eid = r1.entityId;

    const baseline = await ReadData(view, eid);
    expect(baseline?.order?.[0]?.orderItem?.length).toBe(3);

    // ── Phase 2: begin a transaction and remove ITEM-B ────────────────────
    const txn = await BeginTransaction();

    let readBack = await ReadData(view, eid, false, txn.token);
    readBack.order[0].orderItem.splice(1, 1); // remove ITEM-B (index 1)
    await WriteData(view, readBack, txn.token);

    // ── Phase 3: read WITHOUT token - delete is uncommitted, ITEM-B must still be visible ──
    const uncommittedOutsideView = await ReadData(view, eid);
    expect(uncommittedOutsideView?.order?.[0]?.orderItem?.length).toBe(3);
    const outsideItemIds: string[] = uncommittedOutsideView?.order?.[0]?.orderItem?.map((i: any) => i.itemId) ?? [];
    expect(outsideItemIds).toContain("ITEM-B");

    // ── Phase 4: read WITH token (read-uncommitted) - ITEM-B should be gone ──
    const uncommittedInsideView = await ReadData(view, eid, false, txn.token);
    expect(uncommittedInsideView?.order?.[0]?.orderItem?.length).toBe(2);
    const insideItemIds: string[] = uncommittedInsideView?.order?.[0]?.orderItem?.map((i: any) => i.itemId) ?? [];
    expect(insideItemIds).not.toContain("ITEM-B");

    // ── Phase 5: commit ───────────────────────────────────────────────────
    await CommitTransaction(txn.token);

    // ── Phase 6: after commit, ITEM-B must be gone for everyone ──────────
    const afterCommit = await ReadData(view, eid);
    expect(afterCommit?.order?.[0]?.orderItem?.length).toBe(2);
    const afterCommitItemIds: string[] = afterCommit?.order?.[0]?.orderItem?.map((i: any) => i.itemId) ?? [];
    expect(afterCommitItemIds).toContain("ITEM-A");
    expect(afterCommitItemIds).toContain("ITEM-C");
    expect(afterCommitItemIds).not.toContain("ITEM-B");

    // Read with token post-commit also reflects the committed state
    const afterCommitWithToken = await ReadData(view, eid, false, txn.token);
    expect(afterCommitWithToken?.order?.[0]?.orderItem?.length).toBe(2);
    const afterCommitTokenItemIds: string[] = afterCommitWithToken?.order?.[0]?.orderItem?.map((i: any) => i.itemId) ?? [];
    expect(afterCommitTokenItemIds).not.toContain("ITEM-B");
  }, debugTimeOut);

});

// ---------------------------------------------------------------------------
// Suite 2 - all writes inside a transaction that is ROLLED BACK
// ---------------------------------------------------------------------------

describe('Insert then update - transactions rollback', () => {

  it('should rollback an insert - record should not be readable after rollback', async () => {
    const txn = await BeginTransaction();
    const initialData = testData();

    const r1 = await WriteData(view, initialData, txn.token);
    const eid = r1.entityId;

    // Readable inside the transaction
    const insideTxn = await ReadData(view, eid, false, txn.token);
    expect(insideTxn).toBeTruthy();

    await RollbackTransaction(txn.token);

    // After rollback the record must not exist
    const afterRollback = await ReadData(view, eid);
    const rootKey = afterRollback?.[view.rootKey];
    expect(rootKey).toBeFalsy();
  }, debugTimeOut);

  it('should rollback an update - original value must be restored', async () => {
    // Insert committed baseline
    const initialData = testData();
    const r1 = await WriteData(view, initialData);
    const eid = r1.entityId;

    const original = await ReadData(view, eid);
    const originalUnits = original?.order?.[0]?.orderItem?.[0]?.numberOfUnits;

    // Begin txn, update units
    const txn = await BeginTransaction();
    let readBack = await ReadData(view, eid, false, txn.token);
    readBack.order[0].orderItem[0].numberOfUnits = 999;
    await WriteData(view, readBack, txn.token);

    // Inside txn the new value is visible
    const insideTxn = await ReadData(view, eid, false, txn.token);
    expect(insideTxn?.order?.[0]?.orderItem?.[0]?.numberOfUnits).toBe(999);

    // Outside txn the original value is still visible
    const outsideTxn = await ReadData(view, eid);
    expect(outsideTxn?.order?.[0]?.orderItem?.[0]?.numberOfUnits).toBe(originalUnits);

    await RollbackTransaction(txn.token);

    // After rollback the original value must be restored for everyone
    const afterRollback = await ReadData(view, eid);
    expect(afterRollback?.order?.[0]?.orderItem?.[0]?.numberOfUnits).toBe(originalUnits);
  }, debugTimeOut);

  it('should add and remove order items in a single update - committed/uncommitted checks (rollback)', async () => {
    // ── Phase 1: insert baseline (2 items) outside any transaction ────────
    const initialData: AccountsPeopleOrdersItemsProductsData = {
      accountNumber: `ACC-COMBO-RB-${uuid()}`,
      person: { name: "Bob Johnson", address: { street: "321 Pine Rd", postalCode: "11111" } },
      order: [{
        orderId: "ORD-300",
        orderItem: [
          { itemId: "ITEM-OLD-1", numberOfUnits: 2, product: { productId: "PROD-OLD-1", name: "Old Product 1" } },
          { itemId: "ITEM-OLD-2", numberOfUnits: 4, product: { productId: "PROD-OLD-2", name: "Old Product 2" } },
        ]
      }]
    };
    const r1 = await WriteData(view, initialData);
    const eid = r1.entityId;

    const baseline = await ReadData(view, eid);
    expect(baseline?.order?.[0]?.orderItem?.length).toBe(2);

    // ── Phase 2: begin transaction, remove ITEM-OLD-1, add ITEM-NEW-1 and ITEM-NEW-2 ──
    const txn = await BeginTransaction();

    let readBack = await ReadData(view, eid, false, txn.token);
    readBack.order[0].orderItem.shift(); // remove ITEM-OLD-1
    readBack.order[0].orderItem.push(
      { itemId: "ITEM-NEW-1", numberOfUnits: 6, product: { productId: "PROD-NEW-1", name: "New Product 1" } },
      { itemId: "ITEM-NEW-2", numberOfUnits: 8, product: { productId: "PROD-NEW-2", name: "New Product 2" } },
    );
    await WriteData(view, readBack, txn.token);

    // ── Phase 3: read WITHOUT token - original 2 items still visible ─────
    const outsideView = await ReadData(view, eid);
    expect(outsideView?.order?.[0]?.orderItem?.length).toBe(2);
    const outsideIds: string[] = outsideView?.order?.[0]?.orderItem?.map((i: any) => i.itemId) ?? [];
    expect(outsideIds).toContain("ITEM-OLD-1");
    expect(outsideIds).toContain("ITEM-OLD-2");
    expect(outsideIds).not.toContain("ITEM-NEW-1");

    // ── Phase 4: read WITH token - new state visible inside transaction ───
    const insideView = await ReadData(view, eid, false, txn.token);
    expect(insideView?.order?.[0]?.orderItem?.length).toBe(3);
    const insideIds: string[] = insideView?.order?.[0]?.orderItem?.map((i: any) => i.itemId) ?? [];
    expect(insideIds).toContain("ITEM-OLD-2");
    expect(insideIds).toContain("ITEM-NEW-1");
    expect(insideIds).not.toContain("ITEM-OLD-1");

    // ── Phase 5: rollback ─────────────────────────────────────────────────
    await RollbackTransaction(txn.token);

    // ── Phase 6: after rollback, original 2 items restored for everyone ───
    const afterRollback = await ReadData(view, eid);
    expect(afterRollback?.order?.[0]?.orderItem?.length).toBe(2);
    const afterRollbackIds: string[] = afterRollback?.order?.[0]?.orderItem?.map((i: any) => i.itemId) ?? [];
    expect(afterRollbackIds).toContain("ITEM-OLD-1");
    expect(afterRollbackIds).toContain("ITEM-OLD-2");
    expect(afterRollbackIds).not.toContain("ITEM-NEW-1");
    expect(afterRollbackIds).not.toContain("ITEM-NEW-2");

    const afterRollbackWithToken = await ReadData(view, eid, false, txn.token);
    expect(afterRollbackWithToken?.order?.[0]?.orderItem?.length).toBe(2);
    const afterRollbackTokenIds: string[] = afterRollbackWithToken?.order?.[0]?.orderItem?.map((i: any) => i.itemId) ?? [];
    expect(afterRollbackTokenIds).toContain("ITEM-OLD-1");
    expect(afterRollbackTokenIds).not.toContain("ITEM-NEW-1");
  }, debugTimeOut);

  it('should remove order items from an existing order - committed/uncommitted checks with rollback', async () => {
    // ── Phase 1: insert baseline outside any transaction ──────────────────
    const initialData = threeItemOrderData();
    const r1 = await WriteData(view, initialData);
    const eid = r1.entityId;

    const baseline = await ReadData(view, eid);
    expect(baseline?.order?.[0]?.orderItem?.length).toBe(3);

    // ── Phase 2: begin a transaction and remove ITEM-B ────────────────────
    const txn = await BeginTransaction();

    let readBack = await ReadData(view, eid, false, txn.token);
    readBack.order[0].orderItem.splice(1, 1); // remove ITEM-B (index 1)
    await WriteData(view, readBack, txn.token);

    // ── Phase 3: read WITHOUT token - delete is uncommitted, ITEM-B must still be visible ──
    const uncommittedOutsideView = await ReadData(view, eid);
    expect(uncommittedOutsideView?.order?.[0]?.orderItem?.length).toBe(3);
    const outsideItemIds: string[] = uncommittedOutsideView?.order?.[0]?.orderItem?.map((i: any) => i.itemId) ?? [];
    expect(outsideItemIds).toContain("ITEM-B");

    // ── Phase 4: read WITH token (read-uncommitted) - ITEM-B should be gone ──
    const uncommittedInsideView = await ReadData(view, eid, false, txn.token);
    expect(uncommittedInsideView?.order?.[0]?.orderItem?.length).toBe(2);
    const insideItemIds: string[] = uncommittedInsideView?.order?.[0]?.orderItem?.map((i: any) => i.itemId) ?? [];
    expect(insideItemIds).not.toContain("ITEM-B");

    // ── Phase 5: rollback ─────────────────────────────────────────────────
    await RollbackTransaction(txn.token);

    // ── Phase 6: after rollback, ITEM-B must be restored for everyone ─────
    const afterRollback = await ReadData(view, eid);
    expect(afterRollback?.order?.[0]?.orderItem?.length).toBe(3);
    const afterRollbackItemIds: string[] = afterRollback?.order?.[0]?.orderItem?.map((i: any) => i.itemId) ?? [];
    expect(afterRollbackItemIds).toContain("ITEM-A");
    expect(afterRollbackItemIds).toContain("ITEM-B");
    expect(afterRollbackItemIds).toContain("ITEM-C");

    // Reading with the (now-rolled-back) token also shows full set
    const afterRollbackWithToken = await ReadData(view, eid, false, txn.token);
    expect(afterRollbackWithToken?.order?.[0]?.orderItem?.length).toBe(3);
    const afterRollbackTokenItemIds: string[] = afterRollbackWithToken?.order?.[0]?.orderItem?.map((i: any) => i.itemId) ?? [];
    expect(afterRollbackTokenItemIds).toContain("ITEM-B");
  }, debugTimeOut);

});
