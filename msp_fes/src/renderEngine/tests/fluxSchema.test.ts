import { fluxorSchemaBase, fluxAttribute, fluxObject, ObjectName, Attributes } from '../fluxor/fluxSchemaBase'

@fluxObject('Test')
export class TestClass extends fluxorSchemaBase {

  @fluxAttribute({dictionaryName: 'test1', preferredDisplayType:'text', defaultValue:'default value', label:'Test Label'}) 
  test1: string = 'test';

  @fluxAttribute({dictionaryName: 'test2', preferredDisplayType:'text', defaultValue:'default value', label:'Test Label'})
  test2: boolean = true;

  @fluxAttribute({dictionaryName: 'test3', preferredDisplayType:'text', defaultValue:'default value', label:'Test Label'})
  test3: number = 1;
}

@fluxObject('TestA')
export class TestClass2 extends fluxorSchemaBase {

  @fluxAttribute({dictionaryName: 'testx', preferredDisplayType:'text', defaultValue:'default value', label:'Test Label'}) 
  testX: string = 'test';

  @fluxAttribute({dictionaryName: 'testy', preferredDisplayType:'text', defaultValue:'default value', label:'Test Label'})
  testY: boolean = true;

  @fluxAttribute({dictionaryName: 'testz', preferredDisplayType:'text', defaultValue:'default value', label:'Test Label'})
  testZ: number = 1;
}


describe('Schema accessors', () => {
  test('Should have an object name for the class type', () => {
    const name = ObjectName(TestClass);
    expect(name).toMatch('Test');
  });
})

describe('Schema attr accessors', () => {
  test('All attributes should be found, none must bleed in from neighbouts', () => {
    const attrs = Attributes(TestClass);
    const names = Object.keys(attrs);
    expect(names).toContain('test1');
    expect(names).toContain('test2');
    expect(names).toContain('test3');
// just the one class, not bleeding in from the other
    expect(names).not.toContain('testX');
    expect(names).not.toContain('testY');
    expect(names).not.toContain('testZ');
// all attrs contain there own names
    expect(attrs.test1).toEqual('test1');
    expect(attrs.test2).toEqual('test2');
    expect(attrs.test3).toEqual('test3');
  });
})