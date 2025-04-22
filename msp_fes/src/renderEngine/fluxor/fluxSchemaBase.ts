const fluxorSchemaInfo: Record<string, any> = {}

export function fluxAttribute(
  name: string,
  preferredComponent: string,
  defaultValue: any = null,
  label: string = ''
) {
  return function (_target: any, propertyKey: any) {
    const key = `${name}.${propertyKey}`
    if (!fluxorSchemaInfo[key]) {
      fluxorSchemaInfo[key] = {
        propertyKey,
        name,
        preferredComponent,
        defaultValue,
        label,
      };
    }
  }
}

export function fluxObject(
  name: string
) {
  return function (target: any) {
    const key = `${target.name}.__objectName`
    if (!fluxorSchemaInfo[key]) {
      fluxorSchemaInfo[key] = name
    }
  }
}

function getFluxorSchemaProps(target: any, key: string) {
  const schemaProps = fluxorSchemaInfo[`${target.constructor.name}.${key}`];
  if (!schemaProps) {
    return null;
  }
  return schemaProps;
}

export function Attributes<T>(type: { new(): T;} ): T {
  return (new type() as any)['~getNames']()
} 

export function ObjectName<T>(type: { new(): T;} ): T {
  return (new type() as any)['~getObjectName']()
} 

export class fluxorSchemaBase {

  static get myStatic() { return this}

  '~getNames'() {
    // this is a cheeky misuse of the underlying Javascript
    // that replaces whatever types and values the object thinks
    // is has/needs with string values that match the key names of the object
    // done for shorter, neater syntax sugar for declaring atttribute descriptors
    Object.keys(this).forEach((key) => {
      (this as any)[key] = key;
    })
    return this;
  }

  '~getObjectName'() {
    return fluxorSchemaInfo[`${this.constructor.name}.__objectName`];
  }

  '~getSchema'() {
    const fluxorSchema = {
      name: fluxorSchemaInfo[`${this.constructor.name}.__objectName`],
      entity: {
        source: 'fluxor',
        attributes: Object.keys(this).map((key) => {
          const prop = getFluxorSchemaProps(this, key);
          if (!prop) {
            return ({
              name: key,
              preferredComponent: prop.preferredComponent,
              description: prop.schemaProps?.description,
              defaultValue: prop.schemaProps?.defaultValue
            })
          } else {
            return ({
              name: key
            })
          }
        })
      }
    }
    return fluxorSchema;
  }
}
