import { GETRELSFORNAME, NameOfDomainObject, RelsFromDO, RelsToDO } from '../models/api/data.js';
import { schema } from '../fluent/schemaBuilder.js';
import { addDomainObjectRelationTo, domainObject } from '../fluent/objectBuilder.js';
import { relationsBuilder } from '../fluent/objectRelationsBuilder.js';

describe('Declarative View Builder', () => {
  const accountSchema = schema('account')
    .withId('account', '1.0')
    .withProperty('accountNumber')
      .forType<string>()
      .withDictionaryId('dict-account-number', '1.0')
      .withInfoType('Text')
      .withDefaultLabel('Account Number')
      .endProperty()
    .withProperty('opened')
      .forType<Date>()
      .withDictionaryId('dict-account-number', '1.0')
      .withInfoType('Date')
      .withDefaultLabel('Account Opened')
      .endProperty()
    .buildSchema();

  const personSchema = schema('person')
    .withId('person', '1.0')
    .withProperty('name').withDictionaryId('dict-account-number', '1.0')
      .forType<string>()
      .withInfoType('Text')
      .withDefaultLabel('Name')
      .endProperty()
    .buildSchema();



  it('should build related objects', () => {
    
    const personObject_noRels = domainObject('personObject', personSchema)
      .withId('person-123', '1.0')
      .forDomain({ id: 'banking', version: '1.0' })
      .withIsEntity(true)
      .buildDomainObject();

    const accountObject_noRels = domainObject('accountObject', accountSchema)
      .withId('acc-123', '1.0')
      .forDomain({ id: 'banking', version: '1.0' })
      .withIsEntity(true)
      // .withRelationFrom('owner', personObject_noRels, true)
      .buildDomainObject();

    const relatedObjs = relationsBuilder()
    .allowRelationFrom('owner', personObject_noRels, accountObject_noRels, true)
    .allowRelationFrom('admin', personObject_noRels, accountObject_noRels, true)
    .allowRelationTo('test', accountObject_noRels, personObject_noRels, true)

    .allowRelationFrom('hasAccount', accountObject_noRels, personObject_noRels, true)
  //  .allowRelationFrom('payer', personObject_noRels, accountObject_noRels, true)
  //  .allowRelationFrom('hasAccount', personObject_noRels, accountObject_noRels, true)
    .buildRelatedObjects()

    type xxa = typeof relatedObjs.accountObject
    type xxtr = typeof relatedObjs.accountObject._allowedRelationsFromNames
    type xxr = RelsToDO<xxa>
    type xxf = RelsFromDO<xxa>

    type xxx = GETRELSFORNAME<RelsFromDO<xxa>, NameOfDomainObject<typeof relatedObjs.personObject>>;

    
    //const r1 : typeof relatedObjs.accountObject = relatedObjs;

    const po = relatedObjs.personObject;
    const ao = relatedObjs.accountObject;

    console.log('Related Objs:', relatedObjs);
    const accToperRels = relatedObjs.accountObject.relationsTo(relatedObjs.personObject) ;
    const perToaccRels = relatedObjs.personObject.relationsTo(relatedObjs.accountObject) ;
    const accFromperRels = relatedObjs.accountObject.relationsFrom(relatedObjs.personObject) ;
    const perFromaccRels = relatedObjs.personObject.relationsFrom(relatedObjs.accountObject) ;
    type accToperRelsTypes = typeof accToperRels
    type perToaccRelsTypes = typeof perToaccRels
    type accFromperRelsTypes = typeof accFromperRels
    type perFromaccRelsTypes = typeof perFromaccRels


    const a1: perFromaccRelsTypes = "admin";
    const y2: perFromaccRelsTypes = "owner";
    const y2_1: perFromaccRelsTypes = "owner";
    const y1: perToaccRelsTypes = "hasAccount";

    

    //const r2: typeof personObject.allowedRelationsToNames['personObject'] = 'aa';
    //console.log('Relations to personObject:', r1, r2);

    const accountObject = relatedObjs.accountObject;
    const personObject = relatedObjs.personObject;


    expect(accountObject.name).toBe('accountObject');
    expect(accountObject.vid).toEqual({ id: 'acc-123', version: '1.0' });
    expect(accountObject.domain).toEqual({ id: 'banking', version: '1.0' });
    expect(accountObject.isEntity).toBe(true);
    expect(accountObject.allowedRelationsTo).toHaveLength(3);
    expect(accountObject.allowedRelationsTo[0].name).toBe('owner');
    expect(accountObject.allowedRelationsTo[0].relatedObject).toBe(personObject);

    expect(accountObject.allowedRelationsFrom).toHaveLength(1);
    expect(accountObject.allowedRelationsFrom[0].name).toBe('hasAccount');
    expect(accountObject.allowedRelationsFrom[0].relatedObject).toBe(personObject);

    expect(personObject.name).toBe('personObject');
    expect(personObject.vid).toEqual({ id: 'person-123', version: '1.0' });
    expect(personObject.domain).toEqual({ id: 'banking', version: '1.0' });
    expect(personObject.isEntity).toBe(true);
    expect(personObject.allowedRelationsTo).toHaveLength(1);
    expect(personObject.allowedRelationsTo[0].name).toBe('hasAccount');
    expect(personObject.allowedRelationsTo[0].relatedObject).toBe(accountObject);

    expect(personObject.allowedRelationsFrom).toHaveLength(3);
    expect(personObject.allowedRelationsFrom[0].name).toBe('owner');
    expect(personObject.allowedRelationsFrom[0].relatedObject).toBe(accountObject);
  });

   it('should serialise without circular references', () => {
    
    const personObject = domainObject('personObject', personSchema)
      .withId('person-123', '1.0')
      .forDomain({ id: 'banking', version: '1.0' })
      .withIsEntity(true)
      .buildDomainObject();

    const accountObject = domainObject('accountObject', accountSchema)
      .withId('acc-123', '1.0')
      .forDomain({ id: 'banking', version: '1.0' })
      .withIsEntity(true)
      .withRelationTo('owner', personObject, true)
      .buildDomainObject();

    addDomainObjectRelationTo(personObject, 'hasAccount', accountObject, false);
    const accountJson = accountObject.serialise();
  
    expect(accountJson).toBeDefined();
  
  });

   it('should expose valid relations', () => {
    
    const personObject = domainObject('personObject', personSchema)
      .withId('person-123', '1.0')
      .forDomain({ id: 'banking', version: '1.0' })
      .withIsEntity(true)
      .buildDomainObject();

    const accountObject = domainObject('accountObject', accountSchema)
      .withId('acc-123', '1.0')
      .forDomain({ id: 'banking', version: '1.0' })
      .withIsEntity(true)
      .withRelationTo('owner', personObject, true)
      .buildDomainObject();

    addDomainObjectRelationTo(personObject, 'hasAccount', accountObject, false);
    const accountJson = accountObject.serialise();
  

  
  });

});


 