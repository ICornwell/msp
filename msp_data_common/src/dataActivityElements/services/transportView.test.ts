import { describe, expect, it } from 'vitest';
import { createEntityObject, createRelations, createSchema, createView } from 'msp_common';
import { toTransportView } from './transportView.js';

describe('toTransportView', () => {
  it('preserves declarative relation metadata without live circular object references', () => {
    const artefactSchema = createSchema('artefact')
      .withFQId({ namespace: 'test', version: '1.0' })
      .withProperty('name')
        .forType<string>()
        .withDictionaryId('test-name', '1.0')
        .withInfoType('Text')
      .endProperty()
      .buildSchema();
    const artefact = createEntityObject('artefact', artefactSchema)
      .withFQId({ namespace: 'test', version: '1.0' })
      .withUniqueBusinessKey('name')
      .buildObject();
    const related = createRelations()
      .allowRelationFromTo('relatesTo', artefact, artefact, true)
      .buildRelatedObjects();
    const view = createView('artefact-chain')
      .useBusinessKey()
      .withRootElement(related.artefact, false)
        .withNamedSubElement('related', related.artefact, true)
          .withRelation('relatesTo')
        .end()
      .end()
      .endView()
      .build();

    const transportView = toTransportView(view);
    const transportJson = JSON.stringify(transportView);
    const relation = transportView.rootElement.domainObject?.allowedRelationsFrom[0];

    expect(transportJson).toContain('relatesTo');
    expect(relation).toMatchObject({
      name: 'relatesTo',
      relatedObjectId: { name: 'artefact', namespace: 'test', version: '1.0' },
    });
    expect(relation).not.toHaveProperty('relatedObject');
    expect(transportView.rootElement.domainObject).not.toHaveProperty('getBusinessKey');
  });
});
