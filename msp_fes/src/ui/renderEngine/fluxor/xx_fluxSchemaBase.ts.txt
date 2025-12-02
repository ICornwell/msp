import type { FluxorProps } from "./fluxorProps";

const fluxorSchemaInfo: Record<string, FluxorProps> = {}
const fluxorSchemaNames: Record<string, string> = {}

const fluxorTmpAttrInfo: FluxorProps[] = []

export type FluxorSchemaInfo = { name: string | FluxorProps; source: string; attributes: (string | FluxorProps | { attributeName: string; })[]; }

export type FluxorSchemaInfoSet = Record<string, FluxorSchemaInfo>

export function fluxAttribute(
  fluxorProps: FluxorProps
) {

  return function (_target: any, propertyKey: any) {
    // propertyKey is a bit slippery
    // it can be a string or a symbol
    fluxorTmpAttrInfo.push({
      ...fluxorProps,
      attributeName: propertyKey.name ?? propertyKey
    });
  }
}

export function fluxObject(
  name: string
) {
  return function (target: any) {
    const tName = removeTrailingNumbers(target.name)
    const key = `${tName}.__objectName`
    if (!fluxorSchemaInfo[key]) {
      fluxorSchemaNames[key] = name
    }
    try {
      for (const prop of fluxorTmpAttrInfo) {
        const propKey = `${tName}.${prop.attributeName}`
        fluxorSchemaInfo[propKey] = {
          ...prop,
          _parentObjectKeyName: name,
          _schemaName: tName,
          attributeName: prop.attributeName
        }
      }
    } finally {
      fluxorTmpAttrInfo.length = 0;
    }
  }
}

function getFluxorSchemaProps(target: any, key: string) {
  const tName = removeTrailingNumbers(target.constructor.name)
  const schemaProps = fluxorSchemaInfo[`${tName}.${key}`];
  if (!schemaProps) {
    return null;
  }
  return schemaProps;
}

export function Attributes<T>(type: { new(): T; }): T {
  return (new type() as any)['~getNames']()
}

export function ObjectName<T>(type: { new(): T; }): string {
  return (new type() as any)['~getObjectName']()
}

export function Schema<T>(type: { new(): T; }): string {
  return (new type() as any)['~getSchema']()
}

export class fluxorSchemaBase {

  '~isFluxorSchema'() {
    return true;
  }

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
    const cName = removeTrailingNumbers(this.constructor.name)
    return fluxorSchemaNames[`${cName}.__objectName`];
  }

  '~getSchema'(): FluxorSchemaInfo {
    const cName = removeTrailingNumbers(this.constructor.name)
    const fluxorSchema = {
      name: fluxorSchemaNames[`${cName}.__objectName`],
      source: 'fluxor',
      attributes: Object.keys(this).map((key) => {
        const prop = getFluxorSchemaProps(this, key);
        if (prop) {
          return prop
        } else {
          return ({
            attributeName: key
          })
        }
      })

    }
    return fluxorSchema;
  }
}

function removeTrailingNumbers(str: string) {
  return str.replace(/(\d+)(?=\D*$)/, '');
}


