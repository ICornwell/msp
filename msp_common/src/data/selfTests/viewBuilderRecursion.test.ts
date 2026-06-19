import { describe, it, expect } from 'vitest';

import { createView } from '../fluent/viewBuilder.js';
import { createSchema } from '../fluent/schemaBuilder.js';

import { createValueObject, createEntityObject } from '../fluent/objectBuilder.js';
import { createRelations } from '../fluent/objectRelationsBuilder.js';

describe('Declarative View Builder', () => {

    const userSchema = createSchema('user')
    .withFQId({name: 'user', version: '1.0'})
    .withProperty('name')
      .forType<string>()
      .withDictionaryId('dict-user-name', '1.0')
      .withInfoType('Text')
      .withDefaultLabel('Name')
      .endProperty()
    .withProperty('email')
      .forType<string>()
      .withDictionaryId('dict-user-email', '1.0')
      .withInfoType('Text')
      .withDefaultLabel('Email')
      .endProperty()
    .buildSchema();

     const orgSchema = createSchema('org')
    .withFQId({name: 'org', version: '1.0'})
    .withProperty('name')
      .forType<string>()
      .withDictionaryId('dict-org-name', '1.0')
      .withInfoType('Text')
      .withDefaultLabel('Name')
      .endProperty()
    .withProperty('uuid')
      .forType<string>()
      .withDictionaryId('dict-org-uuid', '1.0')
      .withInfoType('Text')
      .withDefaultLabel('Org UUID')
      .endProperty()
    .buildSchema();


    const teamSchema = createSchema('team')
    .withFQId({name: 'team', version: '1.0'})
    .withProperty('name')
      .forType<string>()
      .withDictionaryId('dict-team-name', '1.0')
      .withInfoType('Text')
      .withDefaultLabel('Name')
      .endProperty()
    .withProperty('teamUuid')
      .forType<string>()
      .withDictionaryId('dict-team-uuid', '1.0')
      .withInfoType('Text')
      .withDefaultLabel('Team UUID')
      .endProperty()
    .buildSchema();

   const linkSchema = createSchema('link')
    .withFQId({name: 'link', version: '1.0'})
    .withProperty('name')
      .forType<string>()
      .withDictionaryId('dict-link-name', '1.0')
      .withInfoType('Text')
      .withDefaultLabel('Name')
      .endProperty()
    .withProperty('linkPrototypeId')
      .forType<string>()
      .withDictionaryId('dict-link-prototype-id', '1.0')
      .withInfoType('Text')
      .withDefaultLabel('Link Prototype ID')
      .endProperty()
    .buildSchema();

    const userObject = createEntityObject('user', userSchema)
        .withFQId({name: 'test-user', version: '1.0'})
        .forDomain({ name: 'recursion-test', version: '1.0' })
        .buildObject();

  const linkObject = createEntityObject('link', linkSchema)
    .withFQId({name: 'test-link', version: '1.0'})
    .forDomain({ name: 'recursion-test', version: '1.0' })
    .buildObject();

  const teamObject = createEntityObject('team', teamSchema)
      .withFQId({name: 'test-team', version: '1.0'})
      .forDomain({ name: 'recursion-test', version: '1.0' })
      .buildObject();

  const orgObject = createEntityObject('org', orgSchema)
      .withFQId({name: 'test-org', version: '1.0'})
      .forDomain({ name: 'recursion-test', version: '1.0' })
      .buildObject();


  const relatedObjs = createRelations()
    .allowRelationFromTo('withLink', userObject, linkObject, false)
    .allowRelationFromTo('toUser', linkObject, userObject, false)
    .allowRelationFromTo('withLink', teamObject, linkObject, false)
    .allowRelationFromTo('toTeam', linkObject, teamObject, false)
    .allowRelationFromTo('withLink', orgObject, linkObject, false)
    .allowRelationFromTo('toOrg', linkObject, orgObject, false)
    .buildRelatedObjects();


  it('should build view with declarative structure and infer correct types', () => {
    // Define schemas


    // Build view with declarative structure using TypeScript-native array syntax
    const simpleViewContext = createView('account-people-orders')
        .withVersion('1.0')
        .withRootKey('email')
        .withRootElement(relatedObjs.org, false)  // Object notation with element name
            .withRecursiveNamedSubElement("links", relatedObjs.link, true)  // Object notation
                .withRelation('withLink')
                
                .withSubElement(relatedObjs.user, true)  // Object notation
                    .withRelation('toUser')
                    .recurse() // will go back to 'withLink' links
                    .endRecurse()
                 
                 .withNamedSubElement("teams", relatedObjs.team, true)  // Object notation
                     .withRelation('toTeam')
                     .recurse() // will go back to 'withLink' links
                    .endRecurse()
                .end()
            .end()
        
        .endView()

    const accView = simpleViewContext.build();
    expect(accView.rootElement.isRecurseStartPoint || false).toBe(false);
    expect(accView.rootElement.subElements?.[0]?.isRecurseStartPoint || false).toBe(true);

      console.log('simpleViewContext:', JSON.stringify(simpleViewContext, null, 2));
  })
});