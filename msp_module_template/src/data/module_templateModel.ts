import { createEntityObject, createRelations, createView } from 'msp_common';
import { exampleSchema } from './templateSchema.js';
import { exampleOtherSchema } from './templateOtherSchema.js';
// import { relationSchema } from './relationSchema.js';

export type Module_TemplateArtefact = typeof exampleSchema;
export type Module_TemplateAssertion = typeof exampleOtherSchema;
// export type Module_TemplateRelation = typeof relationSchema;//


export const module_templateArtefactObject = createEntityObject('module_templateArtefact', exampleSchema)
  .withFQId({ namespace: 'module_template', version: '1.0' })
  .withUniqueBusinessKey('name')
  .forDomain({ name: 'module_template', version: '1.0' })
  .buildObject();

export const module_templateAssertionObject = createEntityObject('module_templateAssertion', exampleOtherSchema)
  .withFQId({ namespace: 'module_template', version: '1.0' })
  .withUniqueBusinessKey('name')
  .forDomain({ name: 'module_template', version: '1.0' })
  .buildObject();

export const Module_TemplateObjects = createRelations()
  .allowRelationFromTo('hasAssertion', module_templateArtefactObject, module_templateAssertionObject, true)
  .allowRelationFromTo('assertionRelatesTo', module_templateAssertionObject, module_templateArtefactObject, true)
  .allowRelationFromTo('hasAssertion', module_templateAssertionObject, module_templateAssertionObject, true)
  .allowRelationFromTo('assertionRelatesTo', module_templateAssertionObject, module_templateAssertionObject, true)
  .allowRelationFromTo('assertionHasSubject', module_templateAssertionObject, module_templateArtefactObject, true)
  .allowRelationFromTo('assertionHasObject', module_templateAssertionObject, module_templateArtefactObject, true)
  .buildRelatedObjects();

export const ArtefactAssertionsView = createView('ArtefactAssertions')
  .useBusinessKey()
  .withRootElement(Module_TemplateObjects.module_templateArtefact, false)
    .withNamedSubElement('assertions', Module_TemplateObjects.module_templateAssertion, true)
      .withRelation('hasAssertion')
      .withNamedSubElement('assertionsAboutAssertion', Module_TemplateObjects.module_templateAssertion, true)
        .withRelation('hasAssertion')
      .end()
      .withNamedSubElement('relatedAssertions', Module_TemplateObjects.module_templateAssertion, true)
        .withRelation('assertionRelatesTo')
      .end()
    .end()
    .end()
  .endView()
  .build();

export const SemanticArtefactAssertionsView = createView('SemanticArtefactAssertions')
  .useBusinessKey()
  .withRootElement(Module_TemplateObjects.module_templateArtefact, false)
    .withNamedSubElement('assertions', Module_TemplateObjects.module_templateAssertion, true)
      .withRelation('hasAssertion')
      .withNamedSubElement('subjectArtefact', Module_TemplateObjects.module_templateArtefact, false)
        .withRelation('assertionHasSubject')
      .end()
      .withNamedSubElement('objectArtefact', Module_TemplateObjects.module_templateArtefact, false)
        .withRelation('assertionHasObject')
      .end()
    .end()
  .end()
  .endView()
  .build();

export type ArtefactAssertionsViewType = typeof ArtefactAssertionsView.dataType;

 
 
