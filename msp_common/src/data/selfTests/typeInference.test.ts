import { describe, it, expect } from 'vitest';
import { PropertiesOf } from '../models/api/data.js';
import { createSchema } from '../fluent/schemaBuilder.js';


describe('Type Inference Tests', () => {
  it('should demonstrate type inference at various levels', () => {
    // Define schemas
    const personSchema = createSchema('person')
      .withId('person', '1.0')
      .withProperty('name')
      .forType<string>()
      .withDictionaryId('dict-name', '1.0')
      .withInfoType('Text')
      .withDefaultLabel('Name')
      .endProperty()
      .buildSchema();

    const addressSchema = createSchema('address')
      .withId('address', '1.0')
      .withProperty('street')
      .forType<string>()
      .withDictionaryId('dict-street', '1.0')
      .withInfoType('Text')
      .withDefaultLabel('Street')
      .endProperty()
      .withProperty('city')
      .forType<string>()
      .withDictionaryId('dict-city', '1.0')
      .withInfoType('Text')
      .withDefaultLabel('City')
      .endProperty()
      .buildSchema();
    const phoneSchema = createSchema('phone')
      .withId('phone', '1.0')
      .withProperty('number')
      .forType<string>()
      .withDictionaryId('dict-number', '1.0')
      .withInfoType('Text')
      .withDefaultLabel('Number')
      .endProperty()
      .withProperty('type')
      .forType<string>()
      .withDictionaryId('dict-type', '1.0')
      .withInfoType('Text')
      .withDefaultLabel('Type')
      .endProperty()
      .buildSchema();



    // Test 1: Single element, no children
    // Hover over Type1 to see: { name: string }
    type Type1 = PropertiesOf<typeof personSchema>;
    const data1: Type1 = { name: "John" };
    expect(data1.name).toBe("John");

    // Test 2: Collection, no children  
    // Hover over Type2 to see: Array<{ number: string, type: string }>
    type Type2 = PropertiesOf<typeof phoneSchema>[];
    const data2: Type2 = [
      { number: "555-0001", type: "mobile" },
      { number: "555-0002", type: "home" }
    ];
    expect(data2).toHaveLength(2);

 
  });
});
