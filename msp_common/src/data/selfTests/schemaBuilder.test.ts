import { schema } from '../fluent/schemaBuilder.js';

describe('Declarative View Builder', () => {

  it('should build a schema', () => {
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

    expect(accountSchema.name).toBe('account');
    expect(accountSchema.vid).toEqual({ id: 'account', version: '1.0' });
    expect(accountSchema.properties).toHaveProperty('accountNumber');

    expect(accountSchema.properties['accountNumber']).toEqual({
      dictionaryId: { id: 'dict-account-number', version: '1.0' },
      infoType: 'Text',
      defaultLabel: 'Account Number',
      name: 'accountNumber'
    });

    expect(accountSchema.properties).toHaveProperty('opened');
  });

  it('should build a schema with inheritance', () => {
  const personSchema1 = schema('person')
    .withId('person', '1.0')
    .withProperty('name').withDictionaryId('dict-account-number', '1.0')
      .forType<string>()
      .withInfoType('Text')
      .withDefaultLabel('Name')
      .endProperty()
    .buildSchema();

  const personSchema2 = schema('person')
      .withId('person2', '1.2')
      .inheritsFrom(personSchema1)
      .withProperty('age').withDictionaryId('dict-age', '1.2')
        .forType<number>()
        .withInfoType('Integer')
        .withDefaultLabel('Age')
        .endProperty()
      .buildSchema();


    expect(personSchema2.name).toBe('person');
    expect(personSchema2.inheritsFromSchema).toEqual(personSchema1);
    expect(personSchema2.properties).toHaveProperty('name');
    expect(personSchema2.properties).toHaveProperty('age');

    expect(personSchema1.properties).not.toHaveProperty('age');

    expect(personSchema2.properties['age']).toEqual({
      dictionaryId: { id: 'dict-age', version: '1.2' },
      infoType: 'Integer',
      defaultLabel: 'Age',
      name: 'age'
    });

    expect(personSchema1.properties['name']).toEqual({
      dictionaryId: { id: 'dict-account-number', version: '1.0' },
      infoType: 'Text',
      defaultLabel: 'Name',
      name: 'name'
    });
  });
});

 