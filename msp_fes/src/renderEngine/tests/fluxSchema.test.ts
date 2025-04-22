import { fluxorSchemaBase, fluxAttribute, fluxObject, Attributes} from '../fluxor/fluxSchemaBase'


@fluxObject('Test')
export class TestClass extends fluxorSchemaBase {

  static get testStatic() { return this }


  @fluxAttribute('test', 'text', 'default value', 'Test Label')
  test: string = 'test';

  @fluxAttribute('test2', 'text', 'default value', 'Test Label')
  test2: boolean = true;

  @fluxAttribute('test3', 'text', 'default value', 'Test Label')
  test3: number = 1;
}

function example(attr: any) {
  console.log(attr)
  return attr
}

