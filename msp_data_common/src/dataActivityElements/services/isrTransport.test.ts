import { describe, expect, it } from 'vitest';
import { prepareIsrData } from './isrTransport.js';

function testView() {
  const child = {
    object: 'child',
    docPathName: 'child',
    domainObjectId: { name: 'child', namespace: 'test', version: '1.0' },
    queryObjectId: 'child',
    isEntity: true,
    isCollection: false,
    subElements: [],
  };
  return {
    name: 'test-view',
    version: '1.0',
    configSet: 'main',
    rootKey: '__businessKey',
    rootElement: {
      object: 'root',
      docPathName: 'root',
      domainObjectId: { name: 'root', namespace: 'test', version: '1.0' },
      queryObjectId: 'root',
      isEntity: true,
      isCollection: false,
      subElements: [child, { ...child, docPathName: 'otherChild', queryObjectId: 'otherChild' }],
    },
  } as any;
}

describe('prepareIsrData', () => {
  it('leaves a tree-shaped payload structurally unchanged', () => {
    const data = { __entityId: 'root-1', child: { __entityId: 'child-1', value: 'one' } };
    const prepared = prepareIsrData(testView(), data);

    expect(prepared).toEqual(data);
    expect(prepared).not.toBe(data);
  });

  it('replaces a repeated Entity with an ISR reference stub', () => {
    const shared = { __entityId: 'child-1', value: 'shared' };
    const data = {
      __entityId: 'root-1',
      child: shared,
      otherChild: shared,
    };

    const prepared = prepareIsrData(testView(), data);

    expect(prepared.child).toMatchObject({ __entityId: 'child-1', value: 'shared' });
    expect(prepared.otherChild).toEqual({
      __mspReference: { object: 'child', entityId: 'child-1' },
    });
    expect(JSON.stringify(prepared)).toBeDefined();
  });

  it('uses Value Object id and preserves its owner entity id in the reference', () => {
    const shared = { id: 'value-version-1', __entityId: 'owner-1', value: 'shared' };
    const data = { __entityId: 'root-1', child: shared, otherChild: shared };

    const prepared = prepareIsrData(testView(), data);

    expect(prepared.otherChild).toEqual({
      __mspReference: { object: 'child', id: 'value-version-1', entityId: 'owner-1' },
    });
  });

  it('encodes a self-cycle using a request-local temporary identity', () => {
    const data: any = { __tmpId: 'root-tmp' };
    data.child = data;

    const prepared = prepareIsrData(testView(), data);

    expect(prepared.child).toEqual({
      __mspReference: { object: 'root', tmpId: 'root-tmp' },
    });
  });

  it('does not mutate the source graph', () => {
    const shared = { __entityId: 'child-1' };
    const data = { __entityId: 'root-1', child: shared, otherChild: shared };

    prepareIsrData(testView(), data);

    expect(data.otherChild).toBe(shared);
  });
});
