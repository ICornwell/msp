import { describe, expect, it } from 'vitest';
import { createEntityObject, createRelations, createView } from 'msp_common';
import {
  artefactSchema,
  assertionSchema,
  relationSchema,
  PamelaObjects,
  ArtefactAssertionsView,
} from '../../src/data/graph/index.js';

describe('PAMELA Stage 1 platform-native model', () => {
  it('builds the generic schema hierarchy for artefacts and assertions', () => {
    expect(artefactSchema.name).toBe('artefact');
    expect(assertionSchema.inheritsFromSchema).toEqual(artefactSchema);
    expect(assertionSchema.properties).toHaveProperty('subject');
    expect(assertionSchema.properties).toHaveProperty('predicate');
    expect(assertionSchema.properties).toHaveProperty('object');
    expect(assertionSchema.properties).toHaveProperty('polarity');
    expect(relationSchema.properties).toHaveProperty('sourceId');
    expect(relationSchema.properties).toHaveProperty('relationType');
    expect(relationSchema.properties).toHaveProperty('targetId');
  });

  it('builds the platform object graph and assertion view', () => {
    const entBrightstar = createEntityObject('ent_Brightstar', artefactSchema)
      .withFQId({ namespace: 'pamela', version: '1.0' })
      .withUniqueBusinessKey('name')
      .forDomain({ name: 'pamela', version: '1.0' })
      .buildObject();

    const prodSmePackage = createEntityObject('prod_sme_package', artefactSchema)
      .withFQId({ namespace: 'pamela', version: '1.0' })
      .withUniqueBusinessKey('name')
      .forDomain({ name: 'pamela', version: '1.0' })
      .buildObject();

    const coverProperty = createEntityObject('cover_property', artefactSchema)
      .withFQId({ namespace: 'pamela', version: '1.0' })
      .withUniqueBusinessKey('name')
      .forDomain({ name: 'pamela', version: '1.0' })
      .buildObject();

    const asrt006 = createEntityObject('asrt_006', assertionSchema)
      .withFQId({ namespace: 'pamela', version: '1.0' })
      .withUniqueBusinessKey('name')
      .forDomain({ name: 'pamela', version: '1.0' })
      .buildObject();

    const asrt008 = createEntityObject('asrt_008', assertionSchema)
      .withFQId({ namespace: 'pamela', version: '1.0' })
      .withUniqueBusinessKey('name')
      .forDomain({ name: 'pamela', version: '1.0' })
      .buildObject();

    const asrt013 = createEntityObject('asrt_013', assertionSchema)
      .withFQId({ namespace: 'pamela', version: '1.0' })
      .withUniqueBusinessKey('name')
      .forDomain({ name: 'pamela', version: '1.0' })
      .buildObject();

    const graph = createRelations()
      .allowRelationFromTo('hasAssertion', entBrightstar, asrt006, true)
      .allowRelationFromTo('hasAssertion', prodSmePackage, asrt006, true)
      .allowRelationFromTo('hasAssertion', coverProperty, asrt008, true)
      .allowRelationFromTo('assertionRelatesTo', asrt006, prodSmePackage, true)
      .allowRelationFromTo('derivedFrom', asrt006, asrt013, true)
      .allowRelationFromTo('supports', asrt008, asrt006, true)
      .buildRelatedObjects();

    expect(graph.ent_Brightstar.allowedRelationsFrom.map((rel) => rel.name)).toContain('hasAssertion');
    expect(graph.prod_sme_package.allowedRelationsFrom.map((rel) => rel.name)).toContain('hasAssertion');
    expect(graph.asrt_006.allowedRelationsFrom.map((rel) => rel.name)).toContain('assertionRelatesTo');
    expect(graph.asrt_006.allowedRelationsFrom.map((rel) => rel.name)).toContain('derivedFrom');
    expect(graph.asrt_008.allowedRelationsFrom.map((rel) => rel.name)).toContain('supports');

    const view = createView('artefact-assertions')
      .useBusinessKey()
      .withRootElement(graph.ent_Brightstar, false)
        .withNamedSubElement('assertions', graph.asrt_006, true)
          .withRelation('hasAssertion')
        .end()
      .end()
      .endView()
      .build();

    expect(view.name).toBe('artefact-assertions');
    expect(view.rootElement.object).toBe('ent_Brightstar');
    expect(view.rootElement.subElements).toHaveLength(1);
    expect(view.rootElement.subElements?.[0].object).toBe('asrt_006');

    expect(PamelaObjects.pamelaArtefact.allowedRelationsFrom.map((rel) => rel.name)).toContain('hasAssertion');
    expect(ArtefactAssertionsView.name).toBe('ArtefactAssertions');
    expect(ArtefactAssertionsView.rootElement.object).toBe('pamelaArtefact');
  });
});
