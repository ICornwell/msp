import { fluxorSchemaBase, fluxAttribute, fluxObject } from '../fluxor/fluxSchemaBase'


@fluxObject('Test')
export class TestClass extends fluxorSchemaBase {

  static get testStatic() { return this }


  @fluxAttribute({dictionaryName: 'test', preferredDisplayType:'text', defaultValue:'default value', label:'Test Label'}) 
  test: string = 'test';

  @fluxAttribute({dictionaryName: 'test', preferredDisplayType:'text', defaultValue:'default value', label:'Test Label'})
  test2: boolean = true;

  @fluxAttribute({dictionaryName: 'test', preferredDisplayType:'text', defaultValue:'default value', label:'Test Label'})
  test3: number = 1;
}

// function _example(attr: any) {
//   console.log(attr)
//   return attr
// }

