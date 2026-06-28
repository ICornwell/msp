import got from 'got';
import deepClone from 'safe-clone-deep';
import { v7 as uuid } from 'uuid';
import { accountsPeopleOrdersItemsProductsView } from '../../msp_common/dist/data/testResources/views/accounts-people-orders-items-products.1.0.js';

const BASE = 'http://localhost:5000/v1/doc';

function getBusinessKeyFromData(data, rootKey) {
  if (typeof rootKey === 'string') return data?.[rootKey];
  if (Array.isArray(rootKey)) return rootKey.map(k => data?.[k]?.toString()).filter(Boolean).join('|');
  if (typeof rootKey === 'function') return rootKey(data);
  return null;
}

function recursePopulate(viewElement, data) {
  if (!viewElement || !data) return;
  if (viewElement.domainObject?.isEntity && viewElement.domainObject.businessKey) {
    const businessKey = getBusinessKeyFromData(data, viewElement.domainObject.businessKey);
    if (businessKey) data.__businessKey = businessKey;
  }
  for (const subElement of viewElement.subElements ?? []) {
    const key = subElement.docPathName ?? subElement.domainObjectId?.name;
    const subData = data?.[key];
    if (Array.isArray(subData)) subData.forEach(sd => recursePopulate(subElement, sd));
    else if (subData) recursePopulate(subElement, subData);
  }
}

async function write(view, data, key = '__noid__', preview = false) {
  const safeData = deepClone(data, { circular: true });
  recursePopulate(view.rootElement, safeData);
  const safeView = deepClone(view, { circular: true });
  safeView.rootKey = '__entityId';
  const url = `${BASE}/upsert/${key}${preview ? '?type=preview' : ''}`;
  const response = await got.put(url, {
    json: { view: safeView, data: safeData },
    responseType: 'json',
    retry: { limit: 0 }
  });
  return response.body;
}

async function read(view, id) {
  const safeView = deepClone(view, { circular: true });
  safeView.rootKey = '__entityId';
  const response = await got.put(`${BASE}/query/${id}`, {
    json: safeView,
    responseType: 'json',
    retry: { limit: 0 }
  });
  return response.body;
}

const initialData = {
  accountNumber: `ACC-DBG-${uuid()}`,
  person: {
    name: 'Jane Smith',
    address: { street: '456 Oak Ave', postalCode: '54321' }
  },
  order: [
    {
      orderId: 'ORD-100',
      orderItem: [
        { itemId: 'ITEM-A', numberOfUnits: 5, product: { productId: 'PROD-A', name: 'Product A' } },
        { itemId: 'ITEM-B', numberOfUnits: 3, product: { productId: 'PROD-B', name: 'Product B' } },
        { itemId: 'ITEM-C', numberOfUnits: 2, product: { productId: 'PROD-C', name: 'Product C' } }
      ]
    }
  ]
};

const inserted = await write(accountsPeopleOrdersItemsProductsView, initialData);
console.log('insert response', inserted);
const eid = inserted.entityId;
const before = await read(accountsPeopleOrdersItemsProductsView, eid);
console.log('before order', JSON.stringify(before.order, null, 2));
before.order[0].orderItem.splice(1, 1);
const preview = await write(accountsPeopleOrdersItemsProductsView, before, eid, true);
console.log('preview request', JSON.stringify(preview.request, null, 2));
const exec = await write(accountsPeopleOrdersItemsProductsView, before, eid, false);
console.log('exec response', JSON.stringify(exec, null, 2));
const after = await read(accountsPeopleOrdersItemsProductsView, eid);
console.log('after order', JSON.stringify(after.order, null, 2));
