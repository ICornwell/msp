// enables boolean funtion parameters to be used to drive conditional types
export type TrueFalse = true | false;
// JOIN - flattens intersection types, respecting array types
export type JOIN<A, B> =
  A extends Array<infer AT>
  ? { [K in keyof (AT & B)]: (AT & B)[K] }[]
  : { [K in keyof (A & B)]: (A & B)[K] };


// Flatten - recursively flattens intersection types into a single object type
// Apply this to the final extracted type: Flatten<typeof builder.data>
export type Flatten<T> = T extends Array<infer AT>
  ? FlattenObject<AT>[]
  : FlattenObject<T>;

type FlattenObject<T> = T extends (Object | undefined)
  ? { [K in keyof T]: T[K] extends Array<infer Item>
      ? FlattenObject<Exclude<Item, undefined>>[]
      : (T[K] extends (Object | undefined)
        ? FlattenObject<T[Exclude<K, undefined>]>
        : T[K]
        )
    }
  : T;

export type DeepPartial<T> = T extends Array<infer AT>
  ? DeepPartialObject<AT>[]
  : DeepPartialObject<T>;

type DeepPartialObject<T> = T extends (Object | undefined)
  ? { [K in keyof T]+?: T[K] extends Array<infer Item>
      ? DeepPartialObject<Exclude<Item, undefined>>[]
      : (T[K] extends (Object | undefined)
        ? DeepPartialObject<T[Exclude<K, undefined>]>
        : T[K]
        )
    }
  : T;

export type ReKey<T> = T extends Object
  ? { [K in keyof T]: T[K] }
  : T;  


// coerces single type or array type based on IC (isCollection) 
export type MakeArray<T, IC extends TrueFalse> = IC extends true ? T[] : T;

function objectReplacer(key: string, value: any) {
  // Exclude circular references
  if (['relatedObject','schema', 'serialise', 'domainObj'].includes(key)) {
    return undefined;
  }
  return value;
}

export function stringifyObject(domainObj: any): string {
  return JSON.stringify(domainObj, objectReplacer, 2);
}