import { createEntityObject, createRelations, createView } from 'msp_common';
import { artefactSchema } from './artefactSchema.js';
import { assertionSchema } from './assertionSchema.js';
// import { relationSchema } from './relationSchema.js';

export type PamelaArtefact = typeof artefactSchema;
export type PamelaAssertion = typeof assertionSchema;
// export type PamelaRelation = typeof relationSchema;//


export const pamelaArtefactObject = createEntityObject('pamelaArtefact', artefactSchema)
  .withFQId({ namespace: 'pamela', version: '1.0' })
  .withUniqueBusinessKey('name')
  .forDomain({ name: 'pamela', version: '1.0' })
  .buildObject();

export const pamelaAssertionObject = createEntityObject('pamelaAssertion', assertionSchema)
  .withFQId({ namespace: 'pamela', version: '1.0' })
  .withUniqueBusinessKey('name')
  .forDomain({ name: 'pamela', version: '1.0' })
  .buildObject();

export const PamelaObjects = createRelations()
  .allowRelationFromTo('hasAssertion', pamelaArtefactObject, pamelaAssertionObject, true)
  .allowRelationFromTo('assertionRelatesTo', pamelaAssertionObject, pamelaArtefactObject, true)
  .allowRelationFromTo('hasAssertion', pamelaAssertionObject, pamelaAssertionObject, true)
  .allowRelationFromTo('assertionRelatesTo', pamelaAssertionObject, pamelaAssertionObject, true)
  .buildRelatedObjects();

export const ArtefactAssertionsView = createView('ArtefactAssertions')
  .useBusinessKey()
  .withRootElement(PamelaObjects.pamelaArtefact, false)
    .withNamedSubElement('assertions', PamelaObjects.pamelaAssertion, true)
      .withRelation('hasAssertion')
      .withNamedSubElement('assertionsAboutAssertion', PamelaObjects.pamelaAssertion, true)
        .withRelation('hasAssertion')
      .end()
      .withNamedSubElement('relatedAssertions', PamelaObjects.pamelaAssertion, true)
        .withRelation('assertionRelatesTo')
      .end()
    .end()
    .end()
  .endView()
  .build();

export type ArtefactAssertionsViewType = typeof ArtefactAssertionsView.dataType;

 
 
